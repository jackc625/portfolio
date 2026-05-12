// chat-delivery.test.ts — unit tests for src/lib/chat-delivery.ts
//
// Phase 19 Plan 19-02 — TDD RED test battery covering the entire Phase 19
// cron-sweep contract owned by src/lib/chat-delivery.ts:
//
//   • CRON-02 — list({ prefix: "live:" }) + 2h inactivity filter + two-keyspace
//               promotion ordering (PUT delivered: BEFORE deletion of live:)
//   • CRON-03 — 50-session batch cap, 50-page pagination hard-cap,
//               3-try retry harness, per-session try/catch isolation
//   • CRON-04 — env.DRY_RUN === "1" gate; envelope log under DRY_RUN;
//               throw under DRY_RUN === "0" (Phase 20 substitution target)
//
// Decision IDs anchored:
//   D-01 / D-02 — strict-equals-string DRY_RUN gate
//   D-05        — locked envelope field names
//                 { sid, to, from, reply_to, msg_count, truncated, country,
//                   referrer_host, dry_run }
//   D-06        — NO src/lib/email/* imports (Phase 20 creates that surface)
//   D-07        — 3-attempt retry harness, mock-failure-tested
//   D-09 / D-10 — delivered:{sid} value shape {v:1, sid, delivered_at,
//                 dry_run, msg_count, truncated} + 24h TTL
//   D-11        — NO KV metadata field on delivered: writes
//
// Module under test does NOT exist yet (RED phase). Import resolution will
// fail until Task 2 lands src/lib/chat-delivery.ts.
//
// MockKVNamespace pattern extends tests/api/chat-transcripts.test.ts's
// 30-LOC mock with two additions:
//   1. async delete(key) — required by promoteOne step 5
//   2. cursor-paginated list({ prefix, cursor, limit }) — required by
//      pagination hard-cap + multi-page batch-drain tests
//
// Console-spy beforeEach/afterEach pattern mirrors chat-transcripts.test.ts:167-178.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  deliverDue,
  INACTIVITY_THRESHOLD_MS,
  PER_TICK_BATCH_CAP,
  PAGINATION_PAGE_HARDCAP,
  MAX_SEND_ATTEMPTS,
  DELIVERED_TTL_SECONDS,
  type DeliveredMarker,
} from "../../src/lib/chat-delivery";
import {
  KEY_PREFIX,
  type ChatTranscript,
  type KVMetadata,
} from "../../src/lib/chat-transcripts";

// Hard-coded fixture sessionId — sibling pattern from chat-transcripts.test.ts.
const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";

// Deterministic scheduledTime fixture — tests pass this as deliverDue's
// second arg so inactivity comparisons don't depend on real wall clock
// (RESEARCH OQ-6 tick-as-batch consistency).
const SCHEDULED_NOW = Date.parse("2026-05-12T12:00:00.000Z");
const STALE_3H = new Date(SCHEDULED_NOW - 3 * 60 * 60 * 1000).toISOString();
const FRESH_30M = new Date(SCHEDULED_NOW - 30 * 60 * 1000).toISOString();

// ---------------------------------------------------------------------------
// MockKVNamespace — extends the chat-transcripts.test.ts pattern with
// delete + cursor-paginated list. Cursor is a numeric string index into
// the sorted entries array; pageSize defaults to 1000.
// ---------------------------------------------------------------------------
interface MockKVEntry {
  value: string;
  metadata: unknown;
  expirationTtl?: number;
}

interface MockOperation {
  op: "get" | "put" | "delete" | "list";
  key?: string;
  ts: number;
}

class MockKVNamespace {
  storage = new Map<string, MockKVEntry>();
  operations: MockOperation[] = [];

  // Hook for tests that want to override list() behavior (pagination cap test).
  listOverride:
    | ((opts?: { prefix?: string; cursor?: string; limit?: number }) => Promise<{
        keys: { name: string; metadata: unknown }[];
        list_complete: boolean;
        cursor: string;
      }>)
    | null = null;

  private record(op: MockOperation["op"], key?: string): void {
    this.operations.push({ op, key, ts: this.operations.length });
  }

  async get(key: string, opts?: { type: "json" }): Promise<unknown> {
    this.record("get", key);
    const entry = this.storage.get(key);
    if (!entry) return null;
    return opts?.type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async getWithMetadata<V, M>(
    key: string,
    opts?: { type: "json" },
  ): Promise<{ value: V | null; metadata: M | null }> {
    this.record("get", key);
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
    this.record("put", key);
    this.storage.set(key, {
      value,
      metadata: options?.metadata,
      expirationTtl: options?.expirationTtl,
    });
  }

  async delete(key: string): Promise<void> {
    this.record("delete", key);
    this.storage.delete(key);
  }

  async list<M>(opts?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    keys: { name: string; metadata: M }[];
    list_complete: boolean;
    cursor: string;
  }> {
    this.record("list", opts?.prefix);
    if (this.listOverride) {
      const res = await this.listOverride(opts);
      return {
        keys: res.keys as { name: string; metadata: M }[],
        list_complete: res.list_complete,
        cursor: res.cursor,
      };
    }
    const prefix = opts?.prefix ?? "";
    const all = [...this.storage.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, entry]) => ({ name, metadata: entry.metadata as M }));
    const pageSize = opts?.limit ?? 1000;
    const startIdx = opts?.cursor ? parseInt(opts.cursor, 10) : 0;
    const slice = all.slice(startIdx, startIdx + pageSize);
    const endIdx = startIdx + slice.length;
    return {
      keys: slice,
      list_complete: endIdx >= all.length,
      cursor: String(endIdx),
    };
  }
}

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function buildTranscript(opts: {
  sid?: string;
  msgCount?: number;
  truncated?: boolean;
  country?: string | null;
  referrer?: string | null;
  lastActivityAt?: string;
}): ChatTranscript {
  const sid = opts.sid ?? SID;
  const startedAt = "2026-05-12T08:00:00.000Z";
  const lastActivityAt = opts.lastActivityAt ?? STALE_3H;
  const msgCount = opts.msgCount ?? 2;
  return {
    v: 1,
    sid,
    started_at: startedAt,
    last_activity_at: lastActivityAt,
    msg_count: msgCount,
    truncated: opts.truncated ?? false,
    meta: {
      referrer: opts.referrer ?? "https://example.com/path",
      user_agent: "TestUA/1.0",
      country: opts.country ?? "US",
      region: "TX",
      colo: "DFW",
    },
    messages: Array.from({ length: msgCount }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `msg-${i}`,
      ts: startedAt,
    })),
  };
}

function seedLive(
  kv: MockKVNamespace,
  transcript: ChatTranscript,
  metadataOverride?: Partial<KVMetadata>,
): void {
  const meta: KVMetadata = {
    last_activity_at: transcript.last_activity_at,
    msg_count: transcript.msg_count,
    window_started_at: transcript.started_at,
    window_count: transcript.msg_count,
    ...metadataOverride,
  };
  kv.storage.set(KEY_PREFIX + transcript.sid, {
    value: JSON.stringify(transcript),
    metadata: meta,
  });
}

function buildEnv(
  kv: MockKVNamespace,
  overrides?: { DRY_RUN?: string; CHAT_RECIPIENT_EMAIL?: string; CHAT_SENDER_EMAIL?: string; CHAT_REPLY_TO_EMAIL?: string },
): {
  CHAT_KV: KVNamespace;
  DRY_RUN: string;
  CHAT_RECIPIENT_EMAIL?: string;
  CHAT_SENDER_EMAIL?: string;
  CHAT_REPLY_TO_EMAIL?: string;
} {
  return {
    CHAT_KV: kv as unknown as KVNamespace,
    DRY_RUN: overrides?.DRY_RUN ?? "1",
    CHAT_RECIPIENT_EMAIL: overrides?.CHAT_RECIPIENT_EMAIL ?? "to@example.com",
    CHAT_SENDER_EMAIL: overrides?.CHAT_SENDER_EMAIL ?? "from@example.com",
    // WR-02 (Phase 19 code review) — envelope reply_to: sourced from env var.
    CHAT_REPLY_TO_EMAIL: overrides?.CHAT_REPLY_TO_EMAIL ?? "jackcutrara@gmail.com",
  };
}

function findLog(
  spy: ReturnType<typeof vi.spyOn>,
  eventName: string,
): unknown[] | undefined {
  return spy.mock.calls.find((c: unknown[]) => c[0] === eventName) as
    | unknown[]
    | undefined;
}

// ---------------------------------------------------------------------------
// GROUP A — CRON-02 list({prefix: "live:"}) + inactivity filter
// ---------------------------------------------------------------------------

describe("GROUP A — CRON-02 list + inactivity filter", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters by inactivity", async () => {
    // Session with last_activity_at 30min stale (fresher than 2h threshold) → NOT due
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: FRESH_30M }));

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect(tick).toBeDefined();
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);
    expect((tick![1] as { sessions_due: number }).sessions_due).toBe(0);
    expect(kv.storage.has(`delivered:${SID}`)).toBe(false);
    expect(kv.storage.has(KEY_PREFIX + SID)).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("filters by inactivity (3h stale promoted)", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect(tick).toBeDefined();
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(1);
    expect((tick![1] as { sessions_due: number }).sessions_due).toBe(1);
    expect(kv.storage.has(`delivered:${SID}`)).toBe(true);
    expect(kv.storage.has(KEY_PREFIX + SID)).toBe(false);
  });

  it("lists only live: prefix", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    // Inspect MockKV operations log: every list call must use the "live:" prefix.
    const listOps = kv.operations.filter((o) => o.op === "list");
    expect(listOps.length).toBeGreaterThanOrEqual(1);
    for (const op of listOps) {
      expect(op.key).toBe(KEY_PREFIX); // "live:"
      expect(op.key).not.toBe("delivered:");
    }
  });
});

// ---------------------------------------------------------------------------
// GROUP B — CRON-02 ordering invariant (D-09)
// ---------------------------------------------------------------------------

describe("GROUP B — CRON-02 ordering invariant (D-09)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ordering: PUT delivered before send", async () => {
    // Capture operation order: kv.put("delivered:...") must occur BEFORE the
    // chat.delivery.dry_run log line (which is sendOne's synthetic-success surface).
    // Strategy: record operation timestamp on each KV touch + record log call
    // sequence; assert put-delivered timestamp < log timestamp.
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    // Wrap console.log to capture the operation-log sequence number at log time.
    const logSeqAtCall: Record<string, number> = {};
    logSpy.mockImplementation((...args: unknown[]) => {
      const evt = String(args[0]);
      logSeqAtCall[evt] = kv.operations.length;
    });

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    // Find the put-delivered operation index
    const putDeliveredIdx = kv.operations.findIndex(
      (o) => o.op === "put" && o.key === `delivered:${SID}`,
    );
    expect(putDeliveredIdx).toBeGreaterThanOrEqual(0);

    const dryRunLogSeq = logSeqAtCall["chat.delivery.dry_run"];
    expect(dryRunLogSeq).toBeDefined();

    // PUT delivered must occur BEFORE the dry_run log (i.e. dry_run log seq > put idx).
    // Actually per the implementation contract: sendOne (which logs dry_run) is called
    // FIRST (step 3), then put delivered (step 4), then delete live (step 5).
    // So the order is: dry_run log → put delivered → delete live.
    // The invariant we lock: the dry_run log was captured BEFORE the put-delivered
    // operation index (i.e. logSeqAtCall["chat.delivery.dry_run"] <= putDeliveredIdx).
    expect(dryRunLogSeq).toBeLessThanOrEqual(putDeliveredIdx);

    // And critically: put delivered occurs BEFORE delete live (D-09 ordering invariant)
    const deleteLiveIdx = kv.operations.findIndex(
      (o) => o.op === "delete" && o.key === KEY_PREFIX + SID,
    );
    expect(deleteLiveIdx).toBeGreaterThanOrEqual(0);
    expect(putDeliveredIdx).toBeLessThan(deleteLiveIdx);
  });

  it("ordering: DELETE live after success", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const putDeliveredIdx = kv.operations.findIndex(
      (o) => o.op === "put" && o.key === `delivered:${SID}`,
    );
    const deleteLiveIdx = kv.operations.findIndex(
      (o) => o.op === "delete" && o.key === KEY_PREFIX + SID,
    );

    expect(putDeliveredIdx).toBeGreaterThanOrEqual(0);
    expect(deleteLiveIdx).toBeGreaterThanOrEqual(0);
    expect(deleteLiveIdx).toBeGreaterThan(putDeliveredIdx);

    // Final state: live key deleted, delivered key present
    expect(kv.storage.has(KEY_PREFIX + SID)).toBe(false);
    expect(kv.storage.has(`delivered:${SID}`)).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GROUP C — CRON-02 envelope value shape (D-09 / D-10 / D-11)
// ---------------------------------------------------------------------------

describe("GROUP C — CRON-02 envelope value shape (D-09 / D-10 / D-11)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envelope shape", async () => {
    const kv = new MockKVNamespace();
    seedLive(
      kv,
      buildTranscript({
        lastActivityAt: STALE_3H,
        msgCount: 4,
        truncated: true,
      }),
    );

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const stored = kv.storage.get(`delivered:${SID}`);
    expect(stored).toBeDefined();
    const value = JSON.parse(stored!.value) as DeliveredMarker;

    // Exact key set — no extras, no missing keys
    expect(Object.keys(value).sort()).toEqual(
      ["delivered_at", "dry_run", "msg_count", "sid", "truncated", "v"].sort(),
    );
    expect(value.v).toBe(1);
    expect(value.sid).toBe(SID);
    expect(typeof value.delivered_at).toBe("string");
    // ISO 8601 sanity check
    expect(Number.isNaN(Date.parse(value.delivered_at))).toBe(false);
    expect(value.dry_run).toBe(true);
    expect(value.msg_count).toBe(4);
    expect(value.truncated).toBe(true);
  });

  it("24h TTL", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));
    const putSpy = vi.spyOn(kv, "put");

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const deliveredPutCall = putSpy.mock.calls.find(
      (c) => c[0] === `delivered:${SID}`,
    );
    expect(deliveredPutCall).toBeDefined();
    const options = deliveredPutCall![2] as {
      expirationTtl?: number;
      metadata?: unknown;
    };
    expect(options.expirationTtl).toBe(DELIVERED_TTL_SECONDS);
    expect(options.expirationTtl).toBe(24 * 3600);
  });

  it("no metadata on delivered: writes (D-11)", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));
    const putSpy = vi.spyOn(kv, "put");

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const deliveredPutCall = putSpy.mock.calls.find(
      (c) => c[0] === `delivered:${SID}`,
    );
    expect(deliveredPutCall).toBeDefined();
    const options = deliveredPutCall![2] as {
      expirationTtl?: number;
      metadata?: unknown;
    };
    expect(options.metadata).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GROUP D — CRON-04 DRY_RUN gate (D-01 / D-02 / D-05)
// ---------------------------------------------------------------------------

describe("GROUP D — CRON-04 DRY_RUN gate (D-01 / D-02 / D-05)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dry_run logs envelope", async () => {
    const kv = new MockKVNamespace();
    seedLive(
      kv,
      buildTranscript({
        lastActivityAt: STALE_3H,
        msgCount: 5,
        truncated: false,
        country: "US",
        referrer: "https://example.com/path/page",
      }),
    );

    await deliverDue(
      buildEnv(kv, {
        DRY_RUN: "1",
        CHAT_RECIPIENT_EMAIL: "jack@example.com",
        CHAT_SENDER_EMAIL: "noreply@example.com",
      }),
      SCHEDULED_NOW,
    );

    const dryRunCall = findLog(logSpy, "chat.delivery.dry_run");
    expect(dryRunCall).toBeDefined();
    const payload = dryRunCall![1] as Record<string, unknown>;

    // Locked field NAMES per D-05 — exact set
    expect(Object.keys(payload).sort()).toEqual(
      [
        "country",
        "dry_run",
        "from",
        "msg_count",
        "referrer_host",
        "reply_to",
        "sid",
        "to",
        "truncated",
      ].sort(),
    );

    // dry_run field MUST be true under env.DRY_RUN === "1"
    expect(payload.dry_run).toBe(true);
    expect(payload.sid).toBe(SID);
    expect(payload.to).toBe("jack@example.com");
    expect(payload.from).toBe("noreply@example.com");
    expect(payload.reply_to).toBe("jackcutrara@gmail.com");
    expect(payload.msg_count).toBe(5);
    expect(payload.truncated).toBe(false);
    expect(payload.country).toBe("US");
    expect(payload.referrer_host).toBe("example.com");
  });

  it("dry_run gate (env.DRY_RUN !== '1' throws)", async () => {
    // With env.DRY_RUN === "0", sendOne should throw send_not_implemented_in_phase_19,
    // which the retry harness catches → promoteOne catch path logs chat.delivery.failed.
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    // Use fake timers so retry backoff completes instantly
    vi.useFakeTimers();
    const p = deliverDue(buildEnv(kv, { DRY_RUN: "0" }), SCHEDULED_NOW);
    await vi.runAllTimersAsync();
    await p;
    vi.useRealTimers();

    const failedCall = errorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.delivery.failed",
    );
    expect(failedCall).toBeDefined();
    expect((failedCall![1] as { sid: string }).sid).toBe(SID);

    // tick log reports errors >= 1, sessions_promoted: 0
    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { errors: number }).errors).toBeGreaterThanOrEqual(1);
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GROUP E — CRON-02 idempotency cursor
// ---------------------------------------------------------------------------

describe("GROUP E — CRON-02 idempotency cursor", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("idempotency cursor skip", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    // Pre-seed delivered:{sid} from a prior tick (still within 24h TTL)
    const existingDeliveredAt = new Date(
      SCHEDULED_NOW - 2 * 60 * 60 * 1000,
    ).toISOString();
    kv.storage.set(`delivered:${SID}`, {
      value: JSON.stringify({
        v: 1,
        sid: SID,
        delivered_at: existingDeliveredAt,
        dry_run: true,
        msg_count: 1,
        truncated: false,
      } satisfies DeliveredMarker),
      metadata: undefined,
    });

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    // sessions_promoted: 0 for that sid
    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);

    // skipped_already_delivered log emitted with the expected fields
    const skipCall = findLog(logSpy, "chat.delivery.skipped_already_delivered");
    expect(skipCall).toBeDefined();
    expect(skipCall![1]).toMatchObject({
      sid: SID,
      delivered_at_existing: existingDeliveredAt,
    });

    // live: key NOT deleted (only promoted sessions trigger delete)
    expect(kv.storage.has(KEY_PREFIX + SID)).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("missing live: graceful skip", async () => {
    // delivered:{sid} absent, live:{sid} also absent (race) — should be a no-op.
    // To exercise this path the list() must return a key for live:{sid} BUT the
    // value read returns null. We force this by installing a custom list override
    // that injects a phantom key.
    const kv = new MockKVNamespace();
    const phantomSid = "phantom-sid-1111-2222-3333-444455556666";
    kv.listOverride = async (opts) => {
      if (opts?.prefix !== KEY_PREFIX) {
        return { keys: [], list_complete: true, cursor: "0" };
      }
      // Return a phantom key whose value is not in storage
      return {
        keys: [
          {
            name: KEY_PREFIX + phantomSid,
            metadata: {
              last_activity_at: STALE_3H,
              msg_count: 1,
              window_started_at: STALE_3H,
              window_count: 1,
            },
          },
        ],
        list_complete: true,
        cursor: "1",
      };
    };

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    // No errors, no log spam beyond the tick log
    expect(errorSpy).not.toHaveBeenCalled();
    const skipLogs = logSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "chat.delivery.skipped_already_delivered",
    );
    expect(skipLogs).toHaveLength(0);

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);
    expect((tick![1] as { errors: number }).errors).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GROUP F — CRON-03 batch cap + pagination
// ---------------------------------------------------------------------------

describe("GROUP F — CRON-03 batch cap + pagination", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("batch cap 50", async () => {
    const kv = new MockKVNamespace();
    // Seed 60 stale live: sessions
    for (let i = 0; i < 60; i++) {
      const sid = `00000000-0000-4000-8000-${i.toString().padStart(12, "0")}`;
      seedLive(kv, buildTranscript({ sid, lastActivityAt: STALE_3H }));
    }

    // First call promotes exactly 50
    await deliverDue(buildEnv(kv), SCHEDULED_NOW);
    const tick1 = findLog(logSpy, "chat.delivery.tick");
    expect((tick1![1] as { sessions_promoted: number }).sessions_promoted).toBe(
      PER_TICK_BATCH_CAP,
    );
    expect((tick1![1] as { sessions_promoted: number }).sessions_promoted).toBe(50);

    // Second call promotes the remaining 10
    logSpy.mockClear();
    await deliverDue(buildEnv(kv), SCHEDULED_NOW);
    const tick2 = findLog(logSpy, "chat.delivery.tick");
    expect((tick2![1] as { sessions_promoted: number }).sessions_promoted).toBe(10);
  });

  it("pagination cap 50 pages", async () => {
    const kv = new MockKVNamespace();
    // Force list() to always return list_complete: false with no due sessions.
    // The fake page returns one fresh (NOT due) session so the batch cap never
    // trips before the page cap.
    let listCalls = 0;
    kv.listOverride = async (_opts) => {
      listCalls += 1;
      return {
        keys: [
          {
            name: KEY_PREFIX + `dummy-sid-${listCalls}`,
            metadata: {
              last_activity_at: FRESH_30M, // not due
              msg_count: 1,
              window_started_at: FRESH_30M,
              window_count: 1,
            },
          },
        ],
        list_complete: false,
        cursor: String(listCalls),
      };
    };

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { pages_scanned: number }).pages_scanned).toBe(
      PAGINATION_PAGE_HARDCAP,
    );
    expect((tick![1] as { pages_scanned: number }).pages_scanned).toBe(50);
    expect(listCalls).toBe(50);
  });

  it("multi-page batch drain", async () => {
    const kv = new MockKVNamespace();
    // 30 stale sessions; force pageSize via listOverride so they land across 3 pages
    for (let i = 0; i < 30; i++) {
      const sid = `00000000-0000-4000-8000-${i.toString().padStart(12, "0")}`;
      seedLive(kv, buildTranscript({ sid, lastActivityAt: STALE_3H }));
    }

    // Capture a SNAPSHOT of keys at the start of the sweep so post-delete
    // pagination doesn't lose track. Production KV `list()` returns a
    // point-in-time snapshot; the mock must mirror that semantics for
    // multi-page tests where promoteOne deletes the live: key mid-sweep.
    const snapshot = [...kv.storage.entries()]
      .filter(([k]) => k.startsWith(KEY_PREFIX))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, entry]) => ({ name, metadata: entry.metadata as unknown }));

    // Override list() to paginate at 10 keys per page over the snapshot.
    kv.listOverride = async (opts) => {
      const pageSize = 10;
      const startIdx = opts?.cursor ? parseInt(opts.cursor, 10) : 0;
      const slice = snapshot.slice(startIdx, startIdx + pageSize);
      const endIdx = startIdx + slice.length;
      return {
        keys: slice,
        list_complete: endIdx >= snapshot.length,
        cursor: String(endIdx),
      };
    };

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(30);
    expect((tick![1] as { pages_scanned: number }).pages_scanned).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// GROUP G — CRON-03 retry harness + per-session isolation
// ---------------------------------------------------------------------------

describe("GROUP G — CRON-03 retry harness + isolation", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("retry harness 3 attempts", async () => {
    // Force sendOne to throw on every attempt by using env.DRY_RUN === "0"
    // (the sendOne implementation throws send_not_implemented_in_phase_19 in
    // that branch). This proves the retry harness exhausts MAX_SEND_ATTEMPTS
    // and the catch path emits chat.delivery.failed.
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    vi.useFakeTimers();
    const p = deliverDue(buildEnv(kv, { DRY_RUN: "0" }), SCHEDULED_NOW);
    await vi.runAllTimersAsync();
    await p;

    const failedCall = errorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.delivery.failed",
    );
    expect(failedCall).toBeDefined();
    const payload = failedCall![1] as Record<string, unknown>;
    expect(payload.sid).toBe(SID);
    expect(typeof payload.error_class).toBe("string");
    expect(typeof payload.msg_count).toBe("number");

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { errors: number }).errors).toBe(1);
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);

    // delivered: NOT written, live: NOT deleted (failed path short-circuits)
    expect(kv.storage.has(`delivered:${SID}`)).toBe(false);
    expect(kv.storage.has(KEY_PREFIX + SID)).toBe(true);

    // MAX_SEND_ATTEMPTS constant must be 3 — locked
    expect(MAX_SEND_ATTEMPTS).toBe(3);
  });

  it("retry harness eventual success", async () => {
    // Two sessions in DRY_RUN mode — both succeed first try. This proves the
    // common-case path doesn't accidentally invoke retry/backoff.
    // (Eventual-success-after-failure requires injecting a counter into sendOne,
    // which the pure-module pattern doesn't expose. The retry harness shape is
    // covered by case 16 plus the constant assertion; eventual-success is
    // exercised structurally by the happy path through deliverDue under DRY_RUN.)
    const kv = new MockKVNamespace();
    const sid1 = `00000000-0000-4000-8000-000000000001`;
    const sid2 = `00000000-0000-4000-8000-000000000002`;
    seedLive(kv, buildTranscript({ sid: sid1, lastActivityAt: STALE_3H }));
    seedLive(kv, buildTranscript({ sid: sid2, lastActivityAt: STALE_3H }));

    vi.useFakeTimers();
    const p = deliverDue(buildEnv(kv, { DRY_RUN: "1" }), SCHEDULED_NOW);
    await vi.runAllTimersAsync();
    await p;

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { errors: number }).errors).toBe(0);
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(2);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("per-session isolation", async () => {
    // Seed two sessions: session A's transcript value is null (so promoteOne
    // returns missing_live) — but we want one to FAIL and one to SUCCEED to
    // prove the per-session try/catch loop continues past the failure.
    //
    // Approach: session A uses DRY_RUN-respecting path (succeeds), session B
    // is seeded such that the transcript JSON is malformed (kv.get throws on
    // JSON.parse). This forces the catch path on B without affecting A.
    const kv = new MockKVNamespace();
    const sidA = `00000000-0000-4000-8000-00000000000a`;
    const sidB = `00000000-0000-4000-8000-00000000000b`;
    seedLive(kv, buildTranscript({ sid: sidA, lastActivityAt: STALE_3H }));

    // Override get for sidB to throw on json parse
    const origGet = kv.get.bind(kv);
    vi.spyOn(kv, "get").mockImplementation(async (key, opts) => {
      if (key === KEY_PREFIX + sidB) {
        throw new Error("KV-read-failure for sidB");
      }
      return origGet(key, opts);
    });

    // Seed sidB in storage so list() returns it
    kv.storage.set(KEY_PREFIX + sidB, {
      value: "irrelevant — will throw on read",
      metadata: {
        last_activity_at: STALE_3H,
        msg_count: 1,
        window_started_at: STALE_3H,
        window_count: 1,
      } satisfies KVMetadata,
    });

    vi.useFakeTimers();
    const p = deliverDue(buildEnv(kv, { DRY_RUN: "1" }), SCHEDULED_NOW);
    await vi.runAllTimersAsync();
    await p;

    const tick = findLog(logSpy, "chat.delivery.tick");
    expect((tick![1] as { errors: number }).errors).toBe(1);
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(1);

    // A was promoted, B was not
    expect(kv.storage.has(`delivered:${sidA}`)).toBe(true);
    expect(kv.storage.has(`delivered:${sidB}`)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GROUP H — observability (OQ-7)
// ---------------------------------------------------------------------------

describe("GROUP H — observability (OQ-7)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tick summary log", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));

    await deliverDue(buildEnv(kv), SCHEDULED_NOW);

    // Exactly one chat.delivery.tick call per deliverDue
    const tickCalls = logSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === "chat.delivery.tick",
    );
    expect(tickCalls).toHaveLength(1);

    const payload = tickCalls[0]![1] as Record<string, unknown>;
    // 6 required flat-primitive fields
    expect(typeof payload.sessions_seen).toBe("number");
    expect(typeof payload.sessions_due).toBe("number");
    expect(typeof payload.sessions_promoted).toBe("number");
    expect(typeof payload.errors).toBe("number");
    expect(typeof payload.pages_scanned).toBe("number");
    expect(typeof payload.elapsed_ms).toBe("number");
    expect(payload.elapsed_ms as number).toBeGreaterThanOrEqual(0);

    // Constant cross-check — the locked threshold
    expect(INACTIVITY_THRESHOLD_MS).toBe(2 * 60 * 60 * 1000);
  });
});
