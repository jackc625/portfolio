# Voice Guide

The site speaks in Jack's voice. The chat widget speaks ABOUT Jack.

## Voice by Surface

| Surface | Person | Tense | Tone |
|---------|--------|-------|------|
| About page | First | Present (current self) + past (work) | Direct, plain |
| Homepage hero / lead | First | Present (positioning) | Confident, restrained |
| MDX case studies | First | Past (shipped work) | Engineering-journal |
| Resume PDF | First | Past (achievements) | Standard resume conventions |
| Chat widget responses | **Third** | Past + present | Helpful third-party assistant (see Phase 14) |

## Engineering-Journal Tone (Case Studies)

Reference: `src/content/projects/seatwatch.mdx` post-Phase 13 rewrite is the
canonical example.

- **Concrete numbers, not adjectives.** "48,000 lines of TypeScript" beats
  "large codebase."
- **Named systems.** "the dual-strategy booking engine" beats "an advanced
  booking system."
- **Tradeoffs visible.** Don't paper over compromises; they're load-bearing.
- **Lessons surfaced.** Every case study ends on what changed in your head,
  not what shipped.

See `src/content/projects/seatwatch.mdx` — its 5 H2s (Problem, Approach &
Architecture, Tradeoffs, Outcome, Learnings) and named-systems prose are the
structural and stylistic standard for every case study.

## The Four Hard Rules (D-11)

### Rule 1: No hype / AI-tells banlist

Never use the following without a specific, on-page justification:

- revolutionary
- seamless
- leverage (as a verb)
- robust
- scalable (unless paired with a number — "scalable to 50 concurrent users")
- "dive deeper"
- "elevate"
- "supercharge"
- emoji of any kind in body prose
- em-dash abuse: prefer paired em-dashes (open/close); avoid three or more in a single paragraph

### Rule 2: Numbers or don't claim it

Every performance, scale, reliability, or quality claim requires a number or
must be removed.

| Don't write | Do write |
|-------------|----------|
| "Lightning fast" | "Sub-second p99 response time" or delete |
| "Highly available" | "99.9% uptime over 6 months" or delete |
| "Robust error handling" | "Handles 14 distinct failure modes (see code)" or delete |
| "Battle-tested" | "Processed 2,400 real bookings in production" or delete |

### Rule 3: Past tense for shipped work

| Don't write | Do write |
|-------------|----------|
| "I build production systems" (about completed work) | "I built …" |
| "The system handles distributed locks" (when complete) | "The system handled …" |
| "Each request validates input" (when shipped) | "Each request validated input" |

Present tense is reserved for active / ongoing work and timeless system
descriptions ("The architecture separates concerns…").

### Rule 4: Named systems over abstractions

| Don't write | Do write |
|-------------|----------|
| "an advanced booking system" | "the dual-strategy booking engine" |
| "smart caching" | "the per-user identity cache" |
| "a rate limiter" | "the token-bucket rate limiter" |
| "error recovery" | "the per-symbol circuit breaker" |

Every non-trivial subsystem gets a proper noun. The proper noun appears in code
(class name, file name, log line) so readers can grep from the prose to the
implementation.
