---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 06
type: tdd
wave: 2
depends_on: [01, 03]
files_modified:
  - src/scripts/chat.ts
  - tests/client/chat-sessionid-mint.test.ts
autonomous: true
requirements: [IDENT-01, IDENT-02]
must_haves:
  truths:
    - "`STORAGE_VERSION` bumped from 1 to 2 in src/scripts/chat.ts (triggers existing auto-clear path at chat.ts:104-106 — IDENT-01 wipe mechanism)"
    - "`ChatStorage` interface extended with `sessionId: string` (`version: 2` literal type narrows)"
    - "`saveChatHistory(msgs, sessionId)` signature extended: persists sessionId alongside messages; no-op when sessionId is undefined (D-04 silent-fail-no-persistence)"
    - "`loadChatHistory()` returns `{ messages, sessionId } | null` — full v2 shape surfaced to caller; existing version-gate at chat.ts:104-106 auto-clears v1 blobs"
    - "Bubble-click handler mints `crypto.randomUUID()` if no sessionId in storage; persists immediately; if mint or persist THROWS, sessionId stays undefined per D-04 (chat UX preserved)"
    - "`streamChat` body shape: `{ sessionId, messages }` when sessionId present; `{ messages }` (field OMITTED, not null) when sessionId absent — matches server's `z.uuidv4().optional()` contract"
    - "Cross-visit continuity: clicking bubble when v2 blob already has sessionId preserves the existing sessionId (does NOT re-mint per D-01)"
    - "v1 → v2 auto-clear: clicking bubble with a v1-shape blob in localStorage triggers the version-gate auto-clear AND mints a fresh sessionId"
  artifacts:
    - path: "src/scripts/chat.ts"
      provides: "STORAGE_VERSION = 2 + ChatStorage.sessionId + bubble-click mint + streamChat body sessionId field"
      contains: "STORAGE_VERSION = 2"
    - path: "tests/client/chat-sessionid-mint.test.ts"
      provides: "jsdom client tests for IDENT-01 — source-text + behavioral two-prong"
      contains: "describe(\"IDENT-01"
      min_lines: 200
  key_links:
    - from: "src/scripts/chat.ts bubble-click handler"
      to: "crypto.randomUUID() + saveChatHistory(chatLog, sessionId)"
      via: "ensureSessionId() sub-routine fires BEFORE openPanel animation begins"
      pattern: "crypto\\.randomUUID\\(\\)"
    - from: "src/scripts/chat.ts streamChat body construction"
      to: "fetch('/api/chat', { body: JSON.stringify({ sessionId?, messages }) })"
      via: "conditional field emission based on sessionId truthiness"
      pattern: "sessionId\\s*\\?\\s*\\{\\s*sessionId|sessionId\\s*\\?\\s*\\{\\s*sessionId\\s*,"
---

<objective>
Wire `src/scripts/chat.ts` to mint a sessionId via `crypto.randomUUID()` on bubble click per IDENT-01 + D-01, persist it in the existing `chat-history` localStorage blob with `STORAGE_VERSION` bumped 1→2 per D-02, and include the field on every `/api/chat` POST body per IDENT-01 (or omit per D-04 missing-tolerance fallback). Author the jsdom test file `tests/client/chat-sessionid-mint.test.ts` covering source-text + behavioral assertions in the listener-dedup two-prong pattern.

Key insight per CONTEXT.md "Specifics": "Bubble click as the mint trigger means initChat in chat.ts (line ~572) needs a sessionId-mint sub-routine. The mint must happen BEFORE the panel-open animation begins so the first user-submit POST already carries the sessionId. The order is: click → check localStorage chat-history → if sessionId missing, mint + persist → THEN animate panel open."

D-04 silent-fail surfaces here too: if `crypto.randomUUID()` throws (rare — extension blocks Web Crypto) OR `localStorage.setItem` throws (private browsing / quota), sessionId stays undefined, the field is OMITTED from the POST body, and the chat surface CONTINUES TO WORK. The server-side branch in Plan 18-05 accepts the missing field per `z.uuidv4().optional()`.

This plan parallel-runs with Plan 18-05 (api/chat.ts wiring) — both depend on Plan 18-03 schema extension (sessionId acceptable on envelope) but touch DISJOINT files. Plans 18-05 and 18-06 are in Wave 2 together (zero file-overlap = parallel-safe).

Purpose: Completes the IDENT-01 + IDENT-02 round-trip. Plan 18-05 reads sessionId server-side; Plan 18-06 produces sessionId client-side. After Plan 18-06 commits, a real visitor session against `pnpm dev:worker` will land a `live:{sid}` key in CHAT_KV — verifiable manually via `wrangler kv key get` (success criterion 1 from ROADMAP Phase 18).

Output: `src/scripts/chat.ts` extended with STORAGE_VERSION bump + ChatStorage shape + ensureSessionId helper + streamChat body field. `tests/client/chat-sessionid-mint.test.ts` with ≥5 tests (target 8) GREEN.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md
@src/scripts/chat.ts
@tests/client/listener-dedup.test.ts
</context>

<interfaces>
<!-- Existing ChatStorage interface (verbatim from src/scripts/chat.ts:68-83) -->

  interface StoredMessage {
    role: "user" | "bot";
    content: string;
    timestamp: string;
  }

  interface ChatStorage {
    version: 1;
    messages: StoredMessage[];
    lastActive: string;
  }

  const STORAGE_KEY = "chat-history";
  const STORAGE_VERSION = 1;
  const MAX_MESSAGES = 50;
  const TTL_MS = 24 * 60 * 60 * 1000;

<!-- TARGET ChatStorage interface after Plan 18-06 -->

  interface ChatStorage {
    version: 2;             // bumped 1→2 — existing auto-clear at chat.ts:104-106 wipes v1 blobs
    sessionId: string;      // IDENT-01: client-minted UUIDv4
    messages: StoredMessage[];
    lastActive: string;
  }

  const STORAGE_VERSION = 2;  // bumped 1→2 per IDENT-01 / D-02

<!-- TARGET saveChatHistory signature -->

  function saveChatHistory(msgs: StoredMessage[], sessionId: string | undefined): void {
    if (!sessionId) return;  // D-04: no persistence without sessionId (mint failed or storage disabled)
    // ... existing localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) where data includes sessionId
  }

<!-- TARGET loadChatHistory return shape -->

  function loadChatHistory(): { messages: StoredMessage[]; sessionId: string } | null {
    // ... existing TTL + version gate (1→2 mismatch auto-clears via chat.ts:104-106 mechanism) ...
    // After gates pass: return { messages: data.messages, sessionId: data.sessionId };
  }

<!-- ensureSessionId sub-routine — declared at module scope, called from bubble-click handler -->

  let sessionId: string | undefined = undefined;  // module-scope; surfaces to streamChat body

  function ensureSessionId(): void {
    // Idempotent — safe to call multiple times.
    if (sessionId) return;
    const stored = loadChatHistory();
    if (stored?.sessionId) {
      sessionId = stored.sessionId;  // D-01 cross-visit continuity within 24h
      return;
    }
    try {
      sessionId = crypto.randomUUID();
      saveChatHistory(chatLog, sessionId);  // persist immediately so next page-load resumes
    } catch {
      sessionId = undefined;  // D-04 silent fail — body field omitted
    }
  }

<!-- streamChat body shape — current line 191 -->
  // FROM: body: JSON.stringify({ messages: chatMessages }),
  // TO:   body: JSON.stringify(sessionId ? { sessionId, messages: chatMessages } : { messages: chatMessages }),
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author tests/client/chat-sessionid-mint.test.ts (RED — source not yet updated)</name>
  <files>tests/client/chat-sessionid-mint.test.ts</files>
  <read_first>
    - tests/client/listener-dedup.test.ts (analog jsdom client-test pattern — lines 1-2 header convention, 79-117 source-text assertions, 124-147 jsdom setup, 154-185 behavioral mint assertion shape)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/client/chat-sessionid-mint.test.ts — file header lines 306-330, jsdom setup lines 332-354, source-text assertions lines 356-374, behavioral mint assertion lines 376-403)
    - src/scripts/chat.ts (current state — read lines 60-130 for ChatStorage / saveChatHistory / loadChatHistory; lines 565-660 for initChat / openPanel; line 191 for streamChat body)
    - src/components/chat/ChatWidget.astro (the panel + bubble markup — needed for the jsdom fixture)
  </read_first>
  <behavior>
    Test file `tests/client/chat-sessionid-mint.test.ts` MUST contain ≥5 tests (target 8). All under a single top-level `describe("IDENT-01 — sessionId mint on bubble click (Plan 18-06 / D-01 / D-02 / D-04 silent fail)")`.

    File header: `// @vitest-environment jsdom` directive on line 1 + the verbatim header comment block from PATTERNS.md lines 306-330 (two-prong source-text + behavioral validation rationale).

    Imports follow listener-dedup pattern: `describe, it, expect, vi, beforeEach, afterEach` from vitest; `readFileSync` from `node:fs`; `join` from `node:path`.

    Test cases (verbatim shape from PATTERNS.md § "Required test cases" + CONTEXT.md D-26 expansion list):

    **Source-text prong (uses readFileSync — does NOT execute chat.ts in jsdom):**

    1. `STORAGE_VERSION = 2`: assert `src` matches `/const\s+STORAGE_VERSION\s*=\s*2\b/` AND does NOT match `/const\s+STORAGE_VERSION\s*=\s*1\b/`.

    2. ChatStorage extends with sessionId: assert `src` matches `/version:\s*2\b/` AND matches `/sessionId\s*:\s*string/` (within the ChatStorage interface).

    3. crypto.randomUUID call: assert `src` matches `/crypto\.randomUUID\(\)/`.

    4. streamChat body conditionally emits sessionId: assert `src` matches `/sessionId\s*\?\s*\{\s*sessionId\s*,\s*messages/` (the truthy branch) — this regex matches the ternary pattern from `<interfaces>`. Also assert NOT `/body:\s*JSON\.stringify\(\s*\{\s*messages:\s*chatMessages\s*\}\s*\)/` — that pattern (no sessionId field at all) is the BEFORE-state and should be gone.

    **Behavioral prong (jsdom DOM lifecycle — uses await import + click simulation):**

    Each jsdom test follows the listener-dedup beforeEach setup (verbatim from PATTERNS.md lines 332-354): IntersectionObserver stub, matchMedia mock, fetch mock, document fixture. afterEach restores mocks + resetModules.

    5. **Fresh-mint behavior: bubble click on empty localStorage mints + persists.** Set `document.body.innerHTML` to a fixture mirroring ChatWidget.astro (chat-bubble + chat-panel divs). `vi.spyOn(crypto, "randomUUID").mockReturnValue("8b0f7f1c-1234-4567-8901-abcdef012345");` `localStorage.clear();` Dynamic import `await import("../../src/scripts/chat");`. Trigger `document.getElementById("chat-bubble")!.click();`. Assert: `const stored = JSON.parse(localStorage.getItem("chat-history") || "{}"); expect(stored.version).toBe(2); expect(stored.sessionId).toBe("8b0f7f1c-1234-4567-8901-abcdef012345");`.

    6. **v1 → v2 auto-clear: bubble click with a v1-shape blob triggers wipe + fresh mint.** Pre-seed localStorage with `{ version: 1, messages: [], lastActive: new Date().toISOString() }`. Same setup as Test 5; trigger click. Assert: `const stored = JSON.parse(localStorage.getItem("chat-history") || "{}"); expect(stored.version).toBe(2);` AND `expect(stored.sessionId).toBe("8b0f7f1c-1234-4567-8901-abcdef012345");`. (The old v1 blob was auto-cleared by the version gate, then ensureSessionId minted fresh.)

    7. **Cross-visit continuity: bubble click with valid v2 blob preserves existing sessionId.** Pre-seed localStorage with `{ version: 2, sessionId: "existing-uuid-here-1234-...", messages: [], lastActive: new Date().toISOString() }` where `"existing-uuid-here-1234-..."` is a valid UUIDv4. Trigger click. Assert: `const stored = JSON.parse(localStorage.getItem("chat-history") || "{}"); expect(stored.sessionId).toBe("existing-uuid-here-1234-...");` — NOT re-minted. ALSO assert `crypto.randomUUID` was NOT called (`expect(vi.spyOn(crypto, "randomUUID")).not.toHaveBeenCalled();`).

    8. **D-04 silent fail when crypto.randomUUID throws.** `vi.spyOn(crypto, "randomUUID").mockImplementation(() => { throw new Error("crypto unavailable"); });` `localStorage.clear();` Same setup; trigger click. Then submit a message (interact with the text input + send button — refer to chat.ts for the input ID). Assert: the fetch call body does NOT contain a `sessionId` key. Pattern: `const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]; const body = JSON.parse(fetchCall[1].body); expect("sessionId" in body).toBe(false);`. The chat surface should NOT throw — visible reply still arrives (fetch mock should return a successful SSE response).

    Hard-coded fixture sessionId: `const UUID = "8b0f7f1c-1234-4567-8901-abcdef012345";` declared at file top scope.

    PATTERNS.md note: "vi.resetModules() re-creates fresh handler references; cross-evaluation behavior is reference-mismatched. Keep each test self-contained — do not assume cross-test module state." Each behavioral test MUST call `vi.resetModules();` in beforeEach (already in the afterEach in listener-dedup; mirror).
  </behavior>
  <action>
Create `tests/client/chat-sessionid-mint.test.ts`. First line: `// @vitest-environment jsdom`. Second-line through line ~20: the verbatim file-header docblock from PATTERNS.md lines 307-326.

Imports (lines after the docblock):
  import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
  import { readFileSync } from "node:fs";
  import { join } from "node:path";

Hard-coded fixture at module scope:
  const UUID = "8b0f7f1c-1234-4567-8901-abcdef012345";
  const SECOND_UUID = "a1b2c3d4-5678-4901-2345-67890abcdef0";  // for cross-visit test (different from UUID)

Top-level describe: `describe("IDENT-01 — sessionId mint on bubble click (Plan 18-06 / D-01 / D-02 / D-04 silent fail)")`.

Inside the describe:
  - Nested describe `"Source-text prong (chat.ts source-of-truth invariants)"` containing tests 1, 2, 3, 4.
  - Nested describe `"Behavioral prong (jsdom DOM lifecycle + mint integration)"` containing tests 5, 6, 7, 8 wrapped with the standard beforeEach + afterEach (verbatim from listener-dedup lines 124-147).

For tests 5-8, the document fixture is the chat-bubble + chat-panel markup. Read `src/components/chat/ChatWidget.astro` to get the exact element IDs (chat-bubble + chat-panel) and copy minimal markup into `document.body.innerHTML` for the fixture. Mirror the listener-dedup fixture strategy (line 156-167 if present in that file — otherwise build minimally).

For test 8 (D-04 silent fail), the fetch mock needs to resolve to a Response-like object with a body stream. Build a minimal SSE-compatible mock that emits `data: {"text":"hello"}\n\ndata: [DONE]\n\n` and resolves. If implementing the full SSE stream in the mock is too complex, simplify test 8 to JUST: click bubble (mint throws), submit message, assert fetch was called once AND the body has no sessionId key — do NOT assert anything about the reply UI. The mint-failure-to-fetch-call chain is what test 8 is forward-defending.

After writing, run `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts`. Expected: source-text tests 1-4 may PASS (current chat.ts already matches the AFTER-state regex on... wait, no, current chat.ts has STORAGE_VERSION = 1 — test 1 will FAIL on `STORAGE_VERSION = 2` regex). Behavioral tests 5-7 will FAIL because chat.ts doesn't write `data.sessionId` yet. Test 8 may pass (current chat.ts produces a body without sessionId) but the test is forward-defending the D-04 path post-update.

Confirm RED state: at least tests 1, 2, 3, 4, 5, 6, 7 FAIL. Test 8 might still pass on current chat.ts because today's streamChat body is `{ messages: chatMessages }` (no sessionId field) — but Plan 18-06 Task 2 will change that to a conditional, and test 8's mint-throws path will keep the body sessionId-less. OK if test 8 is GREEN in RED state too — it's a forward-defense.

DO NOT touch `src/scripts/chat.ts` in this task.
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('tests/client/chat-sessionid-mint.test.ts', 'utf8'); const checks = [/@vitest-environment\s+jsdom/.test(f), /describe\([\"']IDENT-01/.test(f), /Source-text prong/.test(f), /Behavioral prong/.test(f), /STORAGE_VERSION\\s\*=\\s\*2/.test(f), /crypto\\\.randomUUID\\\(\\\)/.test(f), /sessionId/.test(f), /8b0f7f1c-1234-4567-8901-abcdef012345/.test(f), (f.match(/\bit\(/g) || []).length >= 5, /from\s+[\"']node:fs[\"']/.test(f), /readFileSync/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Check ' + failed + ' failed'); process.exit(1); } process.exit(0);" && pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts 2>&1 | tail -5</automated>
  </verify>
  <done>tests/client/chat-sessionid-mint.test.ts exists with @vitest-environment jsdom directive, ≥5 it() blocks, source-text + behavioral two-prong describes, UUID fixture. At least 4 tests FAILING (RED) because chat.ts has not been updated.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update src/scripts/chat.ts — STORAGE_VERSION 1→2, ChatStorage shape, ensureSessionId, streamChat body</name>
  <files>src/scripts/chat.ts</files>
  <read_first>
    - src/scripts/chat.ts (current state — lines 68-83 ChatStorage block; lines 85-96 saveChatHistory; lines 98-120 loadChatHistory; lines 565-660 initChat / openPanel / bubble-click registration; line 191 streamChat body)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ src/scripts/chat.ts MODIFY — target ChatStorage shape lines 642-648, saveChatHistory target lines 668-684, loadChatHistory target lines 703-710, bubble-click mint sub-routine lines 712-735, streamChat body target lines 742-748)
    - tests/client/chat-sessionid-mint.test.ts (just-authored — must turn it GREEN at end of Task 2)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraints — D-26 chat regression battery 117/117 GREEN at every chat-surface commit; chat.ts is chat-surface)
  </read_first>
  <behavior>
    All tests in `tests/client/chat-sessionid-mint.test.ts` MUST GREEN. The 30+ existing chat-surface tests carried from Phase 17 MUST stay GREEN.

    Five edits to src/scripts/chat.ts:

    1. **ChatStorage interface** (lines 74-78): `version: 1` → `version: 2`. Add `sessionId: string;` field between `version` and `messages`.

    2. **STORAGE_VERSION constant** (line 81): `1` → `2`.

    3. **saveChatHistory signature + body** (lines 85-96): extend signature with `sessionId: string | undefined` second param. First statement in body: `if (!sessionId) return;` (D-04 silent fail — no persistence without sessionId). Add `sessionId` to the `data` literal.

    4. **loadChatHistory return shape + body** (lines 98-120): return type becomes `{ messages: StoredMessage[]; sessionId: string } | null`. The version-gate at lines 104-106 stays exactly as-is — it auto-clears v1 blobs because `data.version` (which is 1) !== `STORAGE_VERSION` (now 2). After all existing gates pass, return `{ messages: data.messages, sessionId: data.sessionId };`.

    5. **ensureSessionId sub-routine + module-scoped sessionId state**: add a new module-scoped `let sessionId: string | undefined = undefined;` declaration (place it near the existing `let chatLog: StoredMessage[] = [];` at line 122) AND a new `function ensureSessionId(): void { ... }` (place it immediately after `loadChatHistory` declaration — around line 121).

    6. **Bubble-click registration in initChat**: locate the bubble-click handler registration (around line 727 — `openPanel();`). INSERT a `ensureSessionId();` call BEFORE the openPanel call inside the bubble-click handler. The order is: click → ensureSessionId → openPanel.

    7. **streamChat body construction** (line 191): conditional emit.

    8. **All existing saveChatHistory call sites** must pass `sessionId` as the second argument. Locate all call sites via Grep. There are 2 documented (line 871 and line 933 per the read context). Update both.

    9. **All existing loadChatHistory call sites** that destructure messages — locate via Grep. The existing call at line 650 (inside initChat) returns the messages array via the return type change. UPDATE THE DESTRUCTURE: `const stored = loadChatHistory();` then `if (stored) { chatLog = stored.messages; sessionId = stored.sessionId; }`.
  </behavior>
  <action>
Open `src/scripts/chat.ts`. Apply the following 9 edits using exact-text replacements. Each edit is precise.

**Edit 1 — ChatStorage interface (lines 74-78):**
Find the exact existing block:
```
interface ChatStorage {
  version: 1;
  messages: StoredMessage[];
  lastActive: string; // ISO 8601
}
```
Replace with (one literal version bump + one new field; comment cites IDENT-01 + D-02):
```
interface ChatStorage {
  version: 2;            // IDENT-01 / D-02: bumped 1→2 — existing auto-clear at line ~104 wipes v1 blobs
  sessionId: string;     // IDENT-01: client-minted UUIDv4 (Plan 18-06 / D-01)
  messages: StoredMessage[];
  lastActive: string; // ISO 8601
}
```

**Edit 2 — STORAGE_VERSION constant (line 81):**
Find: `const STORAGE_VERSION = 1;`
Replace with: `const STORAGE_VERSION = 2;  // IDENT-01 / D-02: bumped 1→2 — Plan 18-06`

**Edit 3 — saveChatHistory signature + body (lines 85-96):**
Find the current saveChatHistory:
```
function saveChatHistory(msgs: StoredMessage[]): void {
  const data: ChatStorage = {
    version: STORAGE_VERSION,
    messages: msgs.slice(-MAX_MESSAGES),
    lastActive: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail -- localStorage may be full, disabled, or in private browsing
  }
}
```
Replace with:
```
function saveChatHistory(msgs: StoredMessage[], sid: string | undefined): void {
  // D-04: no persistence without sessionId. Caller's chat surface still works
  // (in-memory chatLog continues); next page-load loses cross-visit continuity.
  if (!sid) return;
  const data: ChatStorage = {
    version: STORAGE_VERSION,
    sessionId: sid,
    messages: msgs.slice(-MAX_MESSAGES),
    lastActive: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail -- localStorage may be full, disabled, or in private browsing
  }
}
```

**Edit 4 — loadChatHistory return shape + body (lines 98-120):**
Find the current loadChatHistory:
```
function loadChatHistory(): StoredMessage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ChatStorage;
    // Version check -- clear if schema has changed
    if (!data.version || data.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // TTL check -- clear if older than 24 hours
    const elapsed = Date.now() - new Date(data.lastActive).getTime();
    if (elapsed > TTL_MS || isNaN(elapsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.messages;
  } catch {
    // Corrupted JSON or other error -- clear and start fresh
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    return null;
  }
}
```
Replace ONLY the return type and the final return statement (every other line stays byte-identical). Specifically:
- Change `function loadChatHistory(): StoredMessage[] | null {` to `function loadChatHistory(): { messages: StoredMessage[]; sessionId: string } | null {`.
- Change `return data.messages;` (one line before the catch) to `return { messages: data.messages, sessionId: data.sessionId };`.
The version-gate, TTL-gate, raw-null, and catch paths stay byte-identical (returning `null` in each case).

**Edit 5 — module-scoped sessionId + ensureSessionId function:**
Locate the existing `let chatLog: StoredMessage[] = [];` (line 122). Immediately AFTER that line, insert:
```

// IDENT-01 / D-01: module-scoped sessionId state. Surfaces to streamChat body
// construction. Undefined when mint or persist fails (D-04 silent fail).
let sessionId: string | undefined = undefined;

/**
 * IDENT-01 / D-01 / D-04: idempotent sessionId mint sub-routine.
 *
 * Called from the bubble-click handler BEFORE openPanel animation begins
 * (per CONTEXT.md "Specifics"). Order: click → ensureSessionId → openPanel.
 *
 * - Cross-visit continuity (D-01): if a v2 blob with sessionId exists in
 *   localStorage, adopt it (24h TTL not expired AND version matches → loadChatHistory returns it).
 * - Fresh mint: if no stored sessionId, call crypto.randomUUID() and
 *   persist immediately via saveChatHistory so next page-load resumes.
 * - D-04 silent fail: if crypto.randomUUID throws (rare — extension blocks
 *   Web Crypto) OR localStorage throws (private browsing / quota), leave
 *   sessionId undefined. streamChat body shape conditionally omits the
 *   field; server's z.uuidv4().optional() accepts the absent branch.
 */
function ensureSessionId(): void {
  if (sessionId) return;  // idempotent — multiple calls are safe
  const stored = loadChatHistory();
  if (stored?.sessionId) {
    sessionId = stored.sessionId;  // D-01 cross-visit continuity
    return;
  }
  try {
    sessionId = crypto.randomUUID();
    saveChatHistory(chatLog, sessionId);
  } catch {
    sessionId = undefined;  // D-04: field will be omitted from /api/chat body
  }
}
```

**Edit 6 — Bubble-click handler wiring in initChat:**
Locate the bubble-click handler. Per the existing code structure, line ~727 has `openPanel();`. Read the surrounding 20 lines to identify the EXACT click handler. Add `ensureSessionId();` AS THE FIRST STATEMENT in the click handler — before `openPanel();`.

Use Grep to find the exact line:
  - Grep pattern: `openPanel\(\);` in src/scripts/chat.ts
  - Expected one occurrence inside the bubble-click handler around line 727.

If the click handler is structured as `$bubble.addEventListener("click", () => { openPanel(); });`, change it to `$bubble.addEventListener("click", () => { ensureSessionId(); openPanel(); });`. If it's a named function `function handleBubbleClick() { openPanel(); ... }`, add `ensureSessionId();` as the first statement of that function.

**Edit 7 — streamChat body construction (line 191):**
Find: `      body: JSON.stringify({ messages: chatMessages }),`
Replace with:
```
      // IDENT-01 / D-04: sessionId emitted when present; OMITTED entirely when
      // undefined (matches server's z.uuidv4().optional() — field absent ≠ field null).
      body: JSON.stringify(
        sessionId
          ? { sessionId, messages: chatMessages }
          : { messages: chatMessages }
      ),
```

**Edit 8 — Update saveChatHistory call sites (ENUMERATED — plan-time Grep result):**

Plan-time `grep -n "saveChatHistory(" src/scripts/chat.ts` returned EXACTLY two call sites in user code (excluding the function declaration at line 85 and the call inside ensureSessionId at the Edit-5 insertion point, which is already correctly shaped):

- Line 871: `saveChatHistory(chatLog);` — inside the user-send path
- Line 933: `saveChatHistory(chatLog);` — inside the bot-streamed-reply persist path

Update BOTH call sites verbatim from `saveChatHistory(chatLog);` to `saveChatHistory(chatLog, sessionId);`. Line numbers may shift by ~1-5 after Edits 1-7 land in earlier file regions; use Grep at task time to re-confirm exact positions, but the COUNT must stay at exactly 2 user-code call sites + 1 inside ensureSessionId = 3 total `saveChatHistory(` invocations in the file.

If Grep at task time returns a count OTHER than 3 (after Edit 5 lands), STOP — either an unexpected call site exists (audit before editing) or one of the documented sites is missing (audit the prior edits). The verify gate below catches a missed call site by asserting ZERO matches of the OLD single-arg pattern `/saveChatHistory\(chatLog\)(?![\s,])/` (which matches `saveChatHistory(chatLog)` NOT followed by whitespace or comma — the bare single-arg form). Any leftover bare-call would be a missed update.

**Edit 9 — Update loadChatHistory call site (ENUMERATED — plan-time Grep result):**

Plan-time `grep -n "loadChatHistory(" src/scripts/chat.ts` returned EXACTLY one user-code call site (excluding the function declaration at line 98 and the new call inside ensureSessionId from Edit 5 which is already correctly shaped):

- Line 650: `const stored = loadChatHistory();` — inside initChat

Verify count at task time: Grep for `loadChatHistory(` should return exactly 2 occurrences after Edit 5 (the existing user-code site + the ensureSessionId site). The function declaration at line 98 does NOT match because the grep includes the parenthesis.

Read the surrounding 10 lines at line 650 first. The current pattern is likely:
```
const stored = loadChatHistory();
if (stored) {
  chatLog = stored;
  // ... render stored messages into the panel ...
}
```
Replace the destructure-and-use logic to use the new return shape:
```
const stored = loadChatHistory();
if (stored) {
  chatLog = stored.messages;
  sessionId = stored.sessionId;
  // ... render stored.messages into the panel ...
}
```
The exact final shape depends on the existing code at line 649-660 — read it first, then apply minimal-diff to thread sessionId through.

After all 9 edits, run in order:
1. `pnpm exec astro check` — MUST exit 0/0/0. If type errors surface (e.g., a saveChatHistory call without the new sid arg), fix them.
2. `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts` — all tests GREEN.
3. `pnpm exec vitest run tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts` — chat-surface client-side tests stay GREEN (no regression).
4. `pnpm test` — full suite. Expected: 445 (Plan 18-05 close) + 8 new (Plan 18-06 Task 1) = 453 PASS / 0 FAIL / 2 SKIP.

Commit shape: `feat(18-06): src/scripts/chat.ts STORAGE_VERSION 1→2 + sessionId mint + streamChat body — IDENT-01 + D-01 + D-04 silent fail`.
  </action>
  <verify>
    <automated>pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('src/scripts/chat.ts', 'utf8'); const saveCallsBare = (f.match(/saveChatHistory\(chatLog\)(?![\s,])/g) || []).length; const saveCallsTotal = (f.match(/saveChatHistory\(/g) || []).length; const loadCallsTotal = (f.match(/loadChatHistory\(/g) || []).length; const checks = [/const\s+STORAGE_VERSION\s*=\s*2\b/.test(f), !/const\s+STORAGE_VERSION\s*=\s*1\b/.test(f), /version:\s*2\b/.test(f), /sessionId\s*:\s*string/.test(f), /crypto\.randomUUID\(\)/.test(f), /function\s+ensureSessionId\s*\(\s*\)\s*:\s*void/.test(f), /let\s+sessionId\s*:\s*string\s*\|\s*undefined/.test(f), /sessionId\s*\?\s*\{\s*sessionId\s*,\s*messages/.test(f), /loadChatHistory\(\)\s*:\s*\{\s*messages:\s*StoredMessage\[\];\s*sessionId:\s*string\s*\}\s*\|\s*null/.test(f), /saveChatHistory\([^,]*,\s*sessionId\s*\)/.test(f) || /saveChatHistory\([^,]*,\s*sid\s*\)/.test(f), saveCallsBare === 0, saveCallsTotal === 3 || saveCallsTotal === 4, loadCallsTotal === 2 || loadCallsTotal === 3]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed (saveCallsBare=' + saveCallsBare + ', saveCallsTotal=' + saveCallsTotal + ', loadCallsTotal=' + loadCallsTotal + ')'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>src/scripts/chat.ts has STORAGE_VERSION = 2, ChatStorage with sessionId field + version: 2, ensureSessionId function with crypto.randomUUID(), module-scoped `let sessionId`, conditional streamChat body shape, loadChatHistory returning `{ messages, sessionId } | null`, saveChatHistory accepting sid as second arg. tests/client/chat-sessionid-mint.test.ts ≥5 GREEN. tests/client/listener-dedup.test.ts + tests/client/chat-panel-display.test.ts GREEN. `pnpm exec astro check` 0/0/0.</done>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — FULL D-26 chat regression battery + astro check 0/0/0</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraint #3 — D-26 BLOCKING on chat-surface commits; chat.ts is chat-surface)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md (after every plan wave full suite + astro check)
  </read_first>
  <action>
Plan 18-06 touches src/scripts/chat.ts — a chat-surface file. D-26 gate BLOCKING.

Three commands, in order:

1. `pnpm test` — full suite. Expected: 445 (Plan 18-05 close) + 8 new (Plan 18-06) = 453 PASS / 0 FAIL / 2 SKIP. If any new failure outside the 8 IDENT-01 tests appears, STOP.

2. `pnpm exec astro check` — 0/0/0 baseline carry-forward.

3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/client/chat-sessionid-mint.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` — chat-surface focused 11-file battery (now including the new chat-sessionid-mint.test.ts).

Record gate status in SUMMARY. Plan 18-06 is the second chat-surface commit in Phase 18 (Plan 18-05 was the first; Plan 18-03 was the third type — validation.ts is chat-surface per CONTEXT.md gate language, but it shipped a smaller surface area). With Plan 18-06 closed, the D-26 BLOCKING gate has been validated twice across the highest-risk chat-surface commits.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/client/chat-sessionid-mint.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` ≥ 453 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. 11-file chat-surface focused battery GREEN. Plan SUMMARY records exact counts and notes Plan 18-06 as the second-of-three chat-surface BLOCKING commits in Phase 18 cleared.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser environment → chat.ts | `crypto.randomUUID` is browser-global; localStorage is browser-managed; both can throw in restricted environments (private browsing, extension-blocked Web Crypto, quota exceeded). |
| chat.ts → /api/chat | sessionId crosses the HTTP envelope. Server validates via Plan 18-03 Zod schema; never threads into Anthropic payload (Plan 18-04 forward-defense). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-06-01 | Spoofing | Forged sessionId in localStorage (visitor edits the chat-history blob via DevTools) | accept | Per T-18-03-01: sessionId is an opaque correlation ID, not a session-management token. Forging only writes into someone else's `live:{sid}` IF they guess a valid UUIDv4 (122 bits entropy makes this infeasible). KV-05 quota caps abuse to 100 writes/h. Per V3 partial. |
| T-18-06-02 | Information Disclosure | sessionId persisted in localStorage readable by other scripts on jackcutrara.com | mitigate | The site is intentionally a single-origin static site with NO third-party scripts beyond Cloudflare Web Analytics (no Google Analytics, no Hotjar, no Segment, etc.). XSS via untrusted user content is mitigated by DOMPurify on chat bot responses (Plan 7-04). localStorage exposure is therefore limited to first-party code paths. Per V5 / V6. |
| T-18-06-03 | Denial of Service | crypto.randomUUID() or localStorage.setItem throwing breaks chat UX | mitigate | D-04 silent-fail: try/catch around both calls in ensureSessionId; on throw, sessionId stays undefined; streamChat body omits the field; server's z.uuidv4().optional() accepts the omission; chat surface continues to work (D-26 invariant). Per V7. |
| T-18-06-04 | Tampering | Visitor edits the v2 chat-history blob to inject a malformed sessionId | mitigate | Server-side validation (Plan 18-03 z.uuidv4().optional()) rejects malformed sessionId → 400. Client-side blob is untrusted; if loadChatHistory returns a blob whose sessionId fails the server's validation, the user-turn-write fails AT THE SERVER and silently logs `chat.transcript.write_failed` per Plan 18-05 D-09. Per V5. |
| T-18-06-05 | Repudiation | sessionId mint failure invisible to operator | accept | Per D-04 silent-fail decision: chat UX always wins. Operator visibility into mint-failure rate is achievable in v1.4+ via a DEV-only client log (existing pattern at chat.ts:185 `chat.response_metrics_client`). Phase 18 deliberately does not add a new client log surface. Per V7. |
| T-18-06-06 | Tampering | STORAGE_VERSION bump leaves an open chat panel with in-memory v1 state (Pitfall 5) | accept | Per D-03 + Pitfall 5: active panels at deploy time use v1 in-memory chatLog; next localStorage write fails the version-gate at NEXT bubble-open → auto-clear → fresh sessionId. Brief session-boundary discontinuity at deploy is acceptable (D-03 "no special treatment for expired sessions"). Per V14. |

ASVS L1 mapping for this plan: V3 partial (sessionId correlation), V5 yes (server-side rejects malformed; client-side is untrusted by design), V6 partial (crypto.randomUUID is Web Crypto), V7 yes (D-04 silent fail), V14 partial (STORAGE_VERSION migration policy).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm test` — full suite ≥ 453 PASS / 0 FAIL / 2 SKIP.
2. `pnpm exec astro check` — 0/0/0.
3. `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts` — all new tests GREEN (≥5, target 8).
4. 11-file D-26 chat-surface focused battery — all GREEN.
5. Source diff confined to `src/scripts/chat.ts` + `tests/client/chat-sessionid-mint.test.ts`: `git diff --exit-code src/pages/api/chat.ts src/lib/validation.ts src/lib/chat-transcripts.ts src/prompts/chat-request-shape.ts wrangler.jsonc` exits 0 (Plan 18-06 does NOT touch the api/server side).
6. `src/scripts/chat.ts` has `STORAGE_VERSION = 2` and contains zero `STORAGE_VERSION = 1` substrings.
</verification>

<success_criteria>
- src/scripts/chat.ts has STORAGE_VERSION bumped to 2, ChatStorage extends with `sessionId: string`, ensureSessionId helper minted on bubble click (via crypto.randomUUID()), and streamChat body conditionally emits sessionId.
- All saveChatHistory call sites updated to pass sessionId as second arg.
- loadChatHistory call site at line ~650 destructures both messages and sessionId from the new return shape.
- `tests/client/chat-sessionid-mint.test.ts` exists with ≥5 tests (target 8) GREEN — covering source-text invariants AND behavioral mint integration + D-04 silent-fail.
- D-04 silent fail verified: crypto.randomUUID throwing OR localStorage throwing leaves sessionId undefined; chat UX continues; POST body omits the field.
- `pnpm test` ≥ 453 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0; D-26 chat-surface focused 11-file battery GREEN.
- No file touched other than src/scripts/chat.ts + tests/client/chat-sessionid-mint.test.ts.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-06-SUMMARY.md` recording:
- Test count delta (Plan 18-05 close → Plan 18-06 close: 445 → ≥453 PASS)
- `astro check` 0/0/0 preserved
- 11-file chat-surface focused battery GREEN — second chat-surface BLOCKING commit cleared
- Final exact line numbers in chat.ts for ChatStorage interface + ensureSessionId function + streamChat body conditional
- Anchor for Plan 18-08 (UAT): a real visitor session against `pnpm dev:worker` + sessionId on POST body now produces a `live:{sid}` KV key — verifiable manually via `wrangler kv key get --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 live:<sid>` against the preview namespace
- Anchor for /gsd-verify-work: ROADMAP Phase 18 success criterion 3 ("client mints sessionId via crypto.randomUUID, persists with STORAGE_VERSION 1→2, includes in /api/chat body; server rejects non-UUIDv4") is FULLY satisfied at this point
</output>
