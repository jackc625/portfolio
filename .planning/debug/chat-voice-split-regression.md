---
status: diagnosed
trigger: "Chat bot greets visitors as 'Jack' and answers 'who am i' with 'You're Jack Cutrara' — assumes the visitor IS Jack instead of speaking ABOUT Jack to a visitor. Violates CHAT-06 voice-split contract."
created: 2026-05-10
updated: 2026-05-10
---

## Symptoms

- **expected:** Bot addresses visitors (recruiters/engineers) and refers to Jack in third person. "who am i" should NOT assume the visitor is Jack.
- **actual:**
  - `user: hi` -> `bot: Hey Jack. What would you like to know?`
  - `user: who am i` -> `bot: You're Jack Cutrara, a software engineer based in Virginia... [continues describing visitor AS Jack]`
- **errors:** None — silent semantic regression. No runtime error, no failed assertion.
- **reproduction:** Open chat widget on https://jackcutrara.com, send any greeting. Bot greets visitor by name "Jack".
- **started:** Unknown — user reports "Never noticed before." Voice-split contract is CHAT-06 (Phase 14). The merged knowledge JSON gained first-person prose at commit `1910544 feat(14-02): regenerate portfolio-context.json with merged knowledge` (Phase 14-02). The biographer system prompt was authored at `865a50f feat(14-04): rewrite buildSystemPrompt body with biographer persona` (Phase 14-04). Both shipped in the same wave; the regression has likely been latent since then but masked by short, project-focused chat sessions that never triggered the conflict surface.

## Hypotheses considered

### H1 — System prompt frames the bot AS Jack (first-person persona) — REJECTED

- **evidence against:** `src/prompts/system-prompt.ts:4-15` explicitly opens with `<role>You are a third-person biographer for Jack Cutrara... You are not Jack; you speak ABOUT Jack. You are addressing technical recruiters, hiring managers, and senior engineers...</role>` and `<tone>Third person ("Jack built", "Jack's approach", "he chose"). NEVER first person — you are not Jack.</tone>`. The persona instruction is correct.
- **status:** ELIMINATED — persona framing is explicitly third-person and explicitly identifies the audience as recruiters/engineers, not Jack himself.

### H2 — Recent CR-01 / WR-01..08 fixes regressed the system prompt construction — REJECTED

- **evidence against:** Read `src/pages/api/chat.ts` end-to-end. CR-01 changes (lines 100-159) only modify the `cache_metrics` log emission timing — they capture cache fields at `message_start` and defer the log to `message_delta`. They do NOT touch system-prompt construction, which still flows through `buildChatRequestArgs(portfolioContext, messages)` at line 113 -> `buildSystemPrompt(context)` at `chat-request-shape.ts:37`. WR-01..08 fixes per the recent commits (`fix(17): WR-04..08`) all targeted unrelated areas (DOMPurify hook dedup, NaN/percent rejection, worker stub log, CORS). Git log on `system-prompt.ts` shows no changes since `865a50f` (Phase 14-04). Git log on `chat-request-shape.ts` shows no recent changes either.
- **status:** ELIMINATED — neither file in the system-prompt construction path has been touched recently.

### H3 — First-person about/experience strings injected into the `<knowledge>` block override the third-person `<role>` framing — CONFIRMED

- **evidence for:**
  1. `system-prompt.ts:57-59` injects the entire context object verbatim as JSON into the `<knowledge>` block: `<knowledge>${JSON.stringify(context, null, 2)}</knowledge>`.
  2. `src/data/portfolio-context.json:178-184` ships these first-person string values inside that object:
     - `"experience": "I'm Jack — a junior software engineer who likes building systems that don't break at 3 a.m. I build small, production-grade services... Most of my projects start as 'I wonder how that actually works'... Right now I'm looking for a junior or entry-level role..."`
     - `"about": { "intro": "I'm Jack — a junior software engineer...", "p1": "I build small, production-grade services...", "p2": "I reach for the boring tool first...", "p3": "Right now I'm looking for a junior or entry-level role..." }`
  3. The `caseStudy` field on every project is also first-person prose. Grep `"## Problem\\n\\nI ..."`-style first-person openers in the merged JSON returns 6 matches — one per project. Example from `solsniper` (line 171): `"## Problem\\n\\nNew SPL tokens launch... I wanted an autonomous bot... I architected SolSniper as a single Node.js process..."`.
  4. The model has TWO conflicting voice signals in the same prompt — third-person instruction in `<role>`/`<tone>` (general policy) vs. dozens of first-person sentences in `<knowledge>` (concrete data, far longer surface area). When asked an underspecified question like "who am i", the model anchors on the most recent and voluminous voice signal — the first-person prose — and answers as if that "I" is the speaker addressing the listener (= "you are Jack").
  5. The greeting `Hey Jack. What would you like to know?` is the same failure mode in mirror form: the model has seen "I'm Jack" written from the speaker's POV throughout the knowledge block and infers the listener must be the addressee Jack normally speaks to (himself, in introspection) — so it greets the listener as Jack.

- **evidence against:** None. The system prompt instruction explicitly contradicts the data, but instructions are competing with ~30KB of first-person prose embedded as authoritative "knowledge". This is a known prompt-engineering anti-pattern — voice consistency between role framing and grounding data matters more than explicit voice rules when the data dominates by volume.

- **memory corroboration:** `feedback_no_generic_ai_design.md` is unrelated, but `project_voice_split.md` documents this exact contract: "MDX case studies, About page, homepage hero, and resume PDF speak in first person past tense ('I built X'). The chat widget is the ONLY surface that speaks in third person ('Jack built X')... do not repeat that mistake in Wave 4 case-study prompts." The memory predicted this failure mode.

- **status:** CONFIRMED — root cause.

## Root Cause

The chat widget's system prompt grounds the model in first-person prose authored for the website surface (per the CHAT-06 voice-split contract: site = first person, chat = third person). The biographer instruction in `<role>`/`<tone>` cannot reliably override the dominant voice signal of the embedded knowledge.

**Specific files + line ranges that produce the bug:**

- `src/data/portfolio-context.json:178-184` — the `experience` string and the `about.{intro,p1,p2,p3}` object are verbatim copies of `ABOUT_INTRO`/`ABOUT_P1`/`ABOUT_P3` from `src/data/about.ts:7-20`. All four fields use first-person voice ("I'm Jack", "I build", "I reach", "I read", "I like", "Right now I'm looking..."). These are the most "speaker-like" prose in the entire context — autobiographical, present tense, identity claims.

- `src/data/portfolio-context.json` — every project's `caseStudy` field (6 occurrences total, lines 77, 94, 132, 171, plus two more) is first-person past tense from the MDX bodies in `src/content/projects/*.mdx` ("I architected X", "I chose Y", "I wanted Z"). Lower per-sentence density than `about`, but much higher total volume.

- `scripts/build-chat-context.mjs:367-396` — the generator unconditionally copies `about.ts` exports into the merged JSON (`aboutBlock = { intro: parsed.ABOUT_INTRO, p1: parsed.ABOUT_P1, p2: parsed.ABOUT_P2, p3: parsed.ABOUT_P3 }`) and synthesizes the `experience` one-liner from `ABOUT_INTRO + ABOUT_P1 + ABOUT_P3` (line 394). The MDX `caseStudy` body is also passed through verbatim at `scripts/build-chat-context.mjs:258` (`caseStudy: body.trimEnd()`). No voice transformation step exists.

- `src/prompts/system-prompt.ts:57-59` — the consumer injects the entire `PortfolioContext` JSON into `<knowledge>` with no per-field rewriting: `<knowledge>${JSON.stringify(context, null, 2)}</knowledge>`. This is correct as a shape decision (data block, machine-readable), but it propagates the voice mismatch.

## Affected artifacts

| Path | What's wrong |
|---|---|
| `src/data/portfolio-context.json` (lines 178-184) | `about.{intro,p1,p2,p3}` and `experience` are first-person prose. The chat consumer needs third-person versions. |
| `src/data/portfolio-context.json` (caseStudy fields, 6 projects) | Each `caseStudy` body is first-person past tense from MDX. The chat consumer needs third-person versions OR a wrapper instructing the model to translate when quoting. |
| `src/data/about.ts` (lines 7-20) | Source of truth for the about prose — first-person by design (CHAT-06 voice-split contract: this is correct for the site). DO NOT change this file's voice; it powers the about page in first person. |
| `src/content/projects/*.mdx` | Source of truth for case studies — first-person by design (CHAT-06: correct for the site). DO NOT change voice; these render on the site as first-person case-study pages. |
| `scripts/build-chat-context.mjs` (lines 258, 367-396) | Generator copies first-person prose into the chat-knowledge JSON without voice transformation. Needs a transform step (deterministic rewrite or LLM-pass) for fields consumed by the chat. |
| `src/prompts/system-prompt.ts` (lines 4-15) | Persona instruction is correct in isolation but cannot beat the volume of first-person prose in `<knowledge>`. Could be hardened with an explicit anti-pattern callout (e.g., "the knowledge below contains autobiographical first-person prose written by Jack for his website — when you cite or paraphrase it, rewrite first-person ('I built X') as third-person ('Jack built X')"), but instruction-only mitigation is fragile. The data fix is the primary lever. |

## Missing pieces

The codebase has no mechanism to publish the same source-of-truth content in two voices for two surfaces. The CHAT-06 contract is documented (in `project_voice_split.md` memory and presumably `13-CONTEXT.md` D-09) but not enforced anywhere in the build pipeline. Specifically:

1. **No third-person variant of `about.ts`.** Either `src/data/about.ts` needs sibling exports (e.g., `ABOUT_INTRO_THIRD_PERSON` / `ABOUT_P1_THIRD_PERSON` / ...) authored manually, OR `scripts/build-chat-context.mjs` needs to apply a deterministic voice-transform when populating `about` and `experience` in the merged JSON, OR a new chat-only `src/data/about-chat.ts` should hold third-person prose authored by hand (highest fidelity).

2. **No third-person variant of MDX `caseStudy` bodies.** Same shape as #1 — either MDX files need a sibling third-person body field (e.g., a `caseStudyThirdPerson:` frontmatter field or a `<!-- CHAT-VOICE-START -->` fence below the existing `<!-- CASE-STUDY-END -->` fence), OR the generator transforms the body, OR a new sibling file under `Projects/<n>/chat-summary.md` provides hand-written third-person summaries the chat consumes instead of the case-study bodies.

3. **No CI check that fails the build when first-person markers leak into the chat-knowledge JSON.** A lint pass over the merged JSON looking for first-person leading-clause regex (e.g., `/\b(I'?m |I built|I architected|I chose|I wanted|I reach|I read|My approach)\b/`) in `about.*`, `experience`, and `caseStudy` would catch future regressions immediately. The token-budget guard at `scripts/build-chat-context.mjs:408-440` is the natural extension point.

4. **No regression test asserting the chat addresses an unknown visitor.** A test that posts a `messages: [{ role: "user", content: "hi" }]` request and asserts the response does NOT contain `Hey Jack` / `you're Jack` / `you are Jack` would have caught this. The existing chat tests in `tests/api/chat.test.ts` test the request-shape contract but not the response semantics.

## Closure path

A fix plan would, in order:

1. **Authoring (highest fidelity):** Add hand-written third-person versions of the `about` block (and ideally a chat-summary per project) — either as new exports in `about.ts` (e.g., `ABOUT_CHAT_INTRO`), a new `src/data/about-chat.ts`, or a `chat:` block in MDX frontmatter. The generator merges those into `about` / `experience` / `caseStudy` (or a parallel `caseStudyChat` field) when producing `portfolio-context.json`. Site code keeps reading `ABOUT_INTRO` etc.; chat path reads the third-person variants.

2. **Enforcement:** Extend `scripts/build-chat-context.mjs` with a first-person-leak guard (regex sweep over chat-bound fields, exit 2 on match) and a regression test against a synthetic visitor message that asserts the response does not address the user as Jack.

3. **Defense in depth:** Add an explicit anti-pattern callout in `src/prompts/system-prompt.ts` `<role>` so even if a future first-person string slips through, the model has an explicit instruction to translate ("knowledge below was authored by Jack in first person; rewrite as third person when citing").
