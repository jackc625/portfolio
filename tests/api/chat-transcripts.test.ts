// chat-transcripts.test.ts — unit tests for src/lib/chat-transcripts.ts
//
// Phase 18 Plan 18-02 — mock-KV unit-test suite covering the entire KV
// write contract owned by src/lib/chat-transcripts.ts:
//
//   • KV-02 — schema versioning (`v: 1`) + 30-day TTL on every put
//   • KV-03 — KV `metadata` field on every put for Phase 19 cron list({prefix})
//   • KV-04 — 30-turn drop-oldest sliding window cap + truncated one-way flag
//             + referrer/user_agent truncation to 512 chars
//   • KV-05 — per-sessionId rolling 1-hour write quota of 100 (D-12)
//   • META-01 — first-turn metadata pin (referrer, user_agent, country,
//               region, colo from request.cf snapshot)
//   • D-05  — drop-oldest sliding window at cap
//   • D-06  — truncated=true is one-way
//   • D-07  — 30 = individual messages (matches validation.ts max(30))
//   • D-09  — appendTurn surfaces errors so the caller's .catch (RESEARCH
//             § Pitfall 1) emits chat.transcript.write_failed
//   • D-13  — race_suspected log on shorter-read; write proceeds last-writer-wins
//
// Module under test does NOT exist yet (RED phase). Import resolution will
// fail until Task 2 lands src/lib/chat-transcripts.ts.
//
// Mock-KV pattern is hand-rolled (~30 LOC) per 18-PATTERNS.md §
// "Mock KV pattern (RESEARCH §Supporting)". Console-spy pattern mirrors
// tests/api/cache-hit-logs.test.ts:107-141.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  appendTurn,
  KEY_PREFIX,
  TRANSCRIPT_TTL_SECONDS,
  TURN_CAP,
  QUOTA_CAP,
  REFERRER_MAX,
  USER_AGENT_MAX,
  type AppendTurnMeta,
  type ChatTranscript,
  type KVMetadata,
} from "../../src/lib/chat-transcripts";

// Hard-coded fixture sessionId per CONTEXT.md Claude's Discretion — sessionIds
// carry no information, just need to be UUIDv4-shaped. Same value across every
// test case for stable spy assertions.
const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";

// ---------------------------------------------------------------------------
// MockKVNamespace — hand-rolled per RESEARCH §"Supporting". 30 LOC, no dep.
// Implements get/getWithMetadata/put/list against an in-memory Map. Tests
// assert against this mock; production KV semantics are the platform contract.
// ---------------------------------------------------------------------------
interface MockKVEntry {
  value: string;
  metadata: unknown;
  expirationTtl?: number;
}

class MockKVNamespace {
  storage = new Map<string, MockKVEntry>();

  async get(
    key: string,
    opts?: { type: "json" },
  ): Promise<unknown> {
    const entry = this.storage.get(key);
    if (!entry) return null;
    return opts?.type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async getWithMetadata<V, M>(
    key: string,
    opts?: { type: "json" },
  ): Promise<{ value: V | null; metadata: M | null }> {
    const entry = this.storage.get(key);
    if (!entry) return { value: null, metadata: null };
    return {
      value:
        opts?.type === "json"
          ? (JSON.parse(entry.value) as V)
          : (entry.value as unknown as V),
      metadata: (entry.metadata as M) ?? null,
    };
  }

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void> {
    this.storage.set(key, {
      value,
      metadata: options?.metadata,
      expirationTtl: options?.expirationTtl,
    });
  }

  async list<M>(
    opts?: { prefix?: string },
  ): Promise<{ keys: { name: string; metadata: M }[] }> {
    const prefix = opts?.prefix ?? "";
    const keys = [...this.storage.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([name, entry]) => ({ name, metadata: entry.metadata as M }));
    return { keys };
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function baseMeta(overrides: Partial<AppendTurnMeta> = {}): AppendTurnMeta {
  return {
    referrer: "https://example.com/",
    user_agent: "Mozilla/5.0 (Test)",
    country: "US",
    region: "TX",
    colo: "DFW",
    ...overrides,
  };
}

function buildSeededTranscript(opts: {
  msgCount: number;
  truncated?: boolean;
  meta?: ChatTranscript["meta"];
  startedAt?: string;
}): ChatTranscript {
  const startedAt = opts.startedAt ?? "2026-05-11T00:00:00.000Z";
  const messages = Array.from({ length: opts.msgCount }, (_, i) => ({
    role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: `seed-${i}`,
    ts: new Date(Date.parse(startedAt) + i * 1000).toISOString(),
  }));
  return {
    v: 1,
    sid: SID,
    started_at: startedAt,
    last_activity_at: messages[messages.length - 1]?.ts ?? startedAt,
    msg_count: opts.msgCount,
    truncated: opts.truncated ?? false,
    meta: opts.meta ?? {
      referrer: "https://seed.example/",
      user_agent: "SeedUA/1.0",
      country: "US",
      region: "TX",
      colo: "DFW",
    },
    messages,
  };
}

function seedKV(
  kv: MockKVNamespace,
  transcript: ChatTranscript,
  metadata: KVMetadata,
): void {
  kv.storage.set(KEY_PREFIX + transcript.sid, {
    value: JSON.stringify(transcript),
    metadata,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("KV-02 — schema versioning + 30d TTL on every put (D-22 sibling pattern)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1 — KV-02 first-write seed shape + expirationTtl + metadata fields
  it("KV-02: first appendTurn writes v:1 transcript with 30d TTL + metadata", async () => {
    const kv = new MockKVNamespace();
    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Hi",
      baseMeta(),
    );
    expect(putSpy).toHaveBeenCalledOnce();
    const [key, value, options] = putSpy.mock.calls[0] as [
      string,
      string,
      { expirationTtl?: number; metadata?: KVMetadata },
    ];
    expect(key).toBe(KEY_PREFIX + SID);
    expect(options.expirationTtl).toBe(TRANSCRIPT_TTL_SECONDS);
    expect(options.expirationTtl).toBe(30 * 24 * 3600);

    const stored = JSON.parse(value) as ChatTranscript;
    expect(stored.v).toBe(1);
    expect(stored.sid).toBe(SID);
    expect(stored.msg_count).toBe(1);
    expect(stored.truncated).toBe(false);
    expect(stored.messages).toHaveLength(1);
    expect(stored.messages[0].role).toBe("user");
    expect(stored.messages[0].content).toBe("Hi");
    expect(typeof stored.messages[0].ts).toBe("string");
    expect(typeof stored.started_at).toBe("string");
    expect(typeof stored.last_activity_at).toBe("string");

    // Metadata MUST be populated on every put — Phase 19 cron list({prefix})
    // forward-compat per KV-03 / 18-PATTERNS.md.
    expect(options.metadata).toBeDefined();
    expect(options.metadata!.msg_count).toBe(1);
    expect(options.metadata!.window_count).toBe(1);
    expect(typeof options.metadata!.last_activity_at).toBe("string");
    expect(typeof options.metadata!.window_started_at).toBe("string");

    // No quota warnings on first write under cap
    expect(
      warnSpy.mock.calls.find(
        (c: unknown[]) => c[0] === "chat.transcript.quota_exceeded",
      ),
    ).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // Test 2 — read-modify-write preserves schema version + started_at across writes
  it("KV-02: second appendTurn preserves v:1 and started_at; updates last_activity_at + msg_count", async () => {
    const kv = new MockKVNamespace();
    await appendTurn(kv as unknown as KVNamespace, SID, "user", "First", baseMeta());
    const firstStored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    const startedAtT0 = firstStored.started_at;

    // Advance wall clock so the second put's ts > first put's ts.
    await new Promise((resolve) => setTimeout(resolve, 5));

    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "assistant",
      "Reply",
      baseMeta(),
    );
    const secondStored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;

    expect(secondStored.v).toBe(1);
    expect(secondStored.started_at).toBe(startedAtT0); // unchanged
    expect(secondStored.last_activity_at >= startedAtT0).toBe(true);
    expect(secondStored.msg_count).toBe(2);
    expect(secondStored.messages).toHaveLength(2);
    expect(secondStored.messages[0].role).toBe("user");
    expect(secondStored.messages[1].role).toBe("assistant");
  });
});

describe("KV-03 — metadata field for Phase 19 list({prefix}) forward-compat", () => {
  // Silence console spies so quota/race observability noise from the module
  // doesn't surface in test output; these describe blocks don't assert
  // against the log seam directly.
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 3 — metadata populated on every put with all 4 keys
  it("KV-03: every put carries metadata with last_activity_at + msg_count + window_started_at + window_count", async () => {
    const kv = new MockKVNamespace();
    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(kv as unknown as KVNamespace, SID, "user", "Hi", baseMeta());
    await appendTurn(kv as unknown as KVNamespace, SID, "assistant", "Hello", baseMeta());
    await appendTurn(kv as unknown as KVNamespace, SID, "user", "And again", baseMeta());

    expect(putSpy.mock.calls).toHaveLength(3);
    for (const call of putSpy.mock.calls) {
      const options = call[2] as
        | { metadata?: KVMetadata }
        | undefined;
      expect(options?.metadata).toBeDefined();
      expect(typeof options!.metadata!.last_activity_at).toBe("string");
      expect(typeof options!.metadata!.msg_count).toBe("number");
      expect(typeof options!.metadata!.window_started_at).toBe("string");
      expect(typeof options!.metadata!.window_count).toBe("number");
    }
  });

  // Test 4 — metadata payload ≤1024 bytes serialized (Cloudflare KV hard limit)
  it("KV-03: metadata serialized size ≤ 1024 bytes (Cloudflare KV ceiling)", async () => {
    const kv = new MockKVNamespace();
    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Some user content",
      baseMeta(),
    );
    const options = putSpy.mock.calls[0]![2] as { metadata?: KVMetadata };
    const serialized = JSON.stringify(options.metadata);
    expect(serialized.length).toBeLessThanOrEqual(1024);
  });
});

describe("KV-04 — 30-turn cap drop-oldest + truncated one-way (D-05/D-06/D-07)", () => {
  // Silence console spies; trim-cap behavior tests don't assert log output.
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 5 — append 31 → length 30, oldest dropped, truncated=true (RESEARCH § Pitfall 6)
  it("KV-04 (D-05): appending the 31st turn drops the oldest and flips truncated", async () => {
    const kv = new MockKVNamespace();
    const seeded = buildSeededTranscript({ msgCount: 30, truncated: false });
    const secondSeedContent = seeded.messages[1].content;
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 30,
      window_started_at: new Date().toISOString(),
      window_count: 30,
    });

    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Turn 31 — should evict turn 0",
      baseMeta(),
    );

    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.messages).toHaveLength(TURN_CAP);
    expect(stored.messages).toHaveLength(30);
    expect(stored.messages[0].content).toBe(secondSeedContent);
    expect(stored.messages[stored.messages.length - 1].content).toBe(
      "Turn 31 — should evict turn 0",
    );
    expect(stored.truncated).toBe(true); // D-06: one-way flip on first drop
  });

  // Test 6 — off-by-one boundary: append exactly 30 → length 30, truncated=false (Pitfall 6)
  it("KV-04 (D-07 off-by-one): seeding 29 then appending 1 → length 30, truncated stays false", async () => {
    const kv = new MockKVNamespace();
    const seeded = buildSeededTranscript({ msgCount: 29, truncated: false });
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 29,
      window_started_at: new Date().toISOString(),
      window_count: 29,
    });

    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Turn 30 — exactly at cap, no drop",
      baseMeta(),
    );

    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.messages).toHaveLength(30);
    expect(stored.truncated).toBe(false);
    // First seeded turn still present (not dropped)
    expect(stored.messages[0].content).toBe("seed-0");
  });

  // Test 7 — D-06 truncated one-way: once true, stays true even on writes that
  // don't require a drop
  it("D-06: truncated=true is one-way (never unset on subsequent in-cap writes)", async () => {
    const kv = new MockKVNamespace();
    // Seed with 30-turn transcript that has truncated=true (i.e. a 31st turn
    // was previously appended and dropped). Now append one more; net length
    // stays 30 because the cap is enforced, truncated must remain true.
    const seeded = buildSeededTranscript({ msgCount: 30, truncated: true });
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 30,
      window_started_at: new Date().toISOString(),
      window_count: 5,
    });

    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Another turn while already truncated",
      baseMeta(),
    );

    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.truncated).toBe(true);
    expect(stored.messages).toHaveLength(30);
  });
});

describe("KV-04 — referrer/user_agent truncation to 512 chars (log-poisoning defense)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 8 — referrer truncated to 512 chars on first-write
  it("KV-04: referrer truncated to 512 chars on first-write", async () => {
    const kv = new MockKVNamespace();
    const overlongReferrer = "x".repeat(1000);
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Hi",
      baseMeta({ referrer: overlongReferrer }),
    );
    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.meta.referrer).not.toBeNull();
    expect(stored.meta.referrer!.length).toBe(REFERRER_MAX);
    expect(stored.meta.referrer!.length).toBe(512);
  });

  // Test 9 — user_agent truncated to 512 chars on first-write
  it("KV-04: user_agent truncated to 512 chars on first-write", async () => {
    const kv = new MockKVNamespace();
    const overlongUA = "y".repeat(800);
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Hi",
      baseMeta({ user_agent: overlongUA }),
    );
    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.meta.user_agent).not.toBeNull();
    expect(stored.meta.user_agent!.length).toBe(USER_AGENT_MAX);
    expect(stored.meta.user_agent!.length).toBe(512);
  });
});

describe("META-01 — first-turn metadata pin (request.cf snapshot)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 10 — first-turn meta is pinned; subsequent appendTurns DO NOT
  // overwrite session-level metadata even when they pass different values.
  it("META-01: first-turn meta is pinned; second-turn meta does not overwrite", async () => {
    const kv = new MockKVNamespace();
    const firstMeta = baseMeta({
      referrer: "https://example.com/",
      user_agent: "Mozilla/5.0",
      country: "US",
      region: "TX",
      colo: "DFW",
    });
    const secondMeta = baseMeta({
      referrer: "https://different.com/",
      user_agent: "DifferentAgent/2.0",
      country: "GB",
      region: "ENG",
      colo: "LHR",
    });
    await appendTurn(kv as unknown as KVNamespace, SID, "user", "First", firstMeta);
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "assistant",
      "Reply",
      secondMeta,
    );

    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.meta.referrer).toBe(firstMeta.referrer);
    expect(stored.meta.user_agent).toBe(firstMeta.user_agent);
    expect(stored.meta.country).toBe("US");
    expect(stored.meta.region).toBe("TX");
    expect(stored.meta.colo).toBe("DFW");
  });

  // Test 11 — null defaults preserved when request.cf absent (RESEARCH §
  // Pitfall 4: wrangler dev mocks may surface cf as undefined)
  it("META-01: null meta fields stored as null, not undefined and not placeholder strings", async () => {
    const kv = new MockKVNamespace();
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Hi",
      {
        referrer: null,
        user_agent: null,
        country: null,
        region: null,
        colo: null,
      },
    );
    const stored = JSON.parse(
      kv.storage.get(KEY_PREFIX + SID)!.value,
    ) as ChatTranscript;
    expect(stored.meta.referrer).toBeNull();
    expect(stored.meta.user_agent).toBeNull();
    expect(stored.meta.country).toBeNull();
    expect(stored.meta.region).toBeNull();
    expect(stored.meta.colo).toBeNull();
  });
});

describe("KV-05 — per-sessionId write quota (D-12)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 12 — under-cap proceed: window_count: 99 → 100, no quota warning
  it("KV-05 (D-12): under-cap appendTurn proceeds and increments window_count", async () => {
    const kv = new MockKVNamespace();
    const seeded = buildSeededTranscript({ msgCount: 5 });
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 5,
      window_started_at: new Date().toISOString(), // within 1h window
      window_count: 99, // one slot below QUOTA_CAP=100
    });

    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Allowed turn",
      baseMeta(),
    );
    expect(putSpy).toHaveBeenCalledOnce();
    const options = putSpy.mock.calls[0]![2] as { metadata?: KVMetadata };
    expect(options.metadata!.window_count).toBe(100);

    const quotaCalls = warnSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "chat.transcript.quota_exceeded",
    );
    expect(quotaCalls).toHaveLength(0);
  });

  // Test 13 — at-cap reject: window_count: 100 → no put, warn fires
  it("KV-05 (D-12): at-cap appendTurn skips put and logs chat.transcript.quota_exceeded", async () => {
    const kv = new MockKVNamespace();
    const seeded = buildSeededTranscript({ msgCount: 5 });
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 5,
      window_started_at: new Date().toISOString(), // within 1h window
      window_count: QUOTA_CAP, // at cap (100)
    });

    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Rejected turn",
      baseMeta(),
    );

    expect(putSpy).not.toHaveBeenCalled();
    const quotaCall = warnSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.transcript.quota_exceeded",
    );
    expect(quotaCall).toBeDefined();
    expect(quotaCall![1]).toMatchObject({
      sessionId: SID,
      count_in_window: QUOTA_CAP,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // Test 14 — window expiry: window_started_at > 1h ago → reset to window_count=1
  it("KV-05 (D-12): expired window resets window_count and write proceeds", async () => {
    const kv = new MockKVNamespace();
    const seeded = buildSeededTranscript({ msgCount: 5 });
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    seedKV(kv, seeded, {
      last_activity_at: seeded.last_activity_at,
      msg_count: 5,
      window_started_at: twoHoursAgo, // 2h ago — expired
      window_count: QUOTA_CAP, // would normally reject, but window is stale
    });

    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Fresh-window turn",
      baseMeta(),
    );

    expect(putSpy).toHaveBeenCalledOnce();
    const options = putSpy.mock.calls[0]![2] as { metadata?: KVMetadata };
    expect(options.metadata!.window_count).toBe(1);
    const newWindowStart = new Date(options.metadata!.window_started_at).getTime();
    expect(Math.abs(newWindowStart - Date.now())).toBeLessThan(5000); // within 5s of now

    const quotaCalls = warnSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "chat.transcript.quota_exceeded",
    );
    expect(quotaCalls).toHaveLength(0);
  });
});

describe("D-09 — appendTurn surfaces errors to caller's .catch (RESEARCH Pitfall 1)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 15 — appendTurn rejects with the kv.put error so the CALLER's .catch
  // chain (Plan 18-05 in api/chat.ts) emits chat.transcript.write_failed.
  // RESEARCH § Pitfall 1: ctx.waitUntil swallows unhandled rejections —
  // the .catch MUST live at the call site, not inside the module.
  it("D-09: appendTurn surfaces kv.put rejection to caller (no internal try/catch)", async () => {
    const kv = new MockKVNamespace();
    vi.spyOn(kv, "put").mockRejectedValue(
      new Error("KV connection failed"),
    );
    await expect(
      appendTurn(
        kv as unknown as KVNamespace,
        SID,
        "user",
        "Hi",
        baseMeta(),
      ),
    ).rejects.toBeInstanceOf(Error);
  });
});

describe("D-13 — race_suspected log on shorter read (single-invocation scope per Pitfall 2)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 16 — race detection: KV value's messages.length < metadata.msg_count
  // (a prior put recorded msg_count: 5 but the cross-POP read returned a
  // 3-message transcript). Per CONTEXT.md critical-constraint resolution (b),
  // "in_memory_tail_len" is sourced from existingMeta.msg_count and
  // "kv_read_len" from existing.messages.length. Write proceeds last-writer-wins.
  it("D-13: shorter value vs metadata.msg_count fires chat.transcript.race_suspected and still writes", async () => {
    const kv = new MockKVNamespace();
    // Seed a 3-turn transcript value but metadata claiming msg_count: 5
    // (i.e. a prior put recorded 5 but the value we just read shows only 3 —
    // cross-POP eventual-consistency surface per RESEARCH § Pitfall 2).
    const seededValue = buildSeededTranscript({ msgCount: 3 });
    kv.storage.set(KEY_PREFIX + SID, {
      value: JSON.stringify(seededValue),
      metadata: {
        last_activity_at: seededValue.last_activity_at,
        msg_count: 5, // prior put recorded 5
        window_started_at: new Date().toISOString(),
        window_count: 5,
      } satisfies KVMetadata,
    });

    const putSpy = vi.spyOn(kv, "put");
    await appendTurn(
      kv as unknown as KVNamespace,
      SID,
      "user",
      "Race-suspect turn",
      baseMeta(),
    );

    // Write proceeds — last-writer-wins per D-13
    expect(putSpy).toHaveBeenCalledOnce();

    const raceCall = warnSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.transcript.race_suspected",
    );
    expect(raceCall).toBeDefined();
    expect(raceCall![1]).toMatchObject({
      sessionId: SID,
      in_memory_tail_len: 5,
      kv_read_len: 3,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
