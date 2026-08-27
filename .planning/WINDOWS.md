---
schema_version: 1
open_count: 0
waived_count: 0
fixed_count: 1
total_count: 1
last_updated: 2026-08-27T21:43:02.373Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | quick/260827-o01 | unrun-verify | src/pages/about.astro |  | Task 3 human-check visual sign-off on / and /about (curly apostrophe, education block spacing after transfer-line removal) not performed | fixed |  | 2026-08-27T21:34:14.610Z | 2026-08-27T21:43:02.373Z |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "quick/260827-o01",
    "file": "src/pages/about.astro",
    "line": null,
    "description": "Task 3 human-check visual sign-off on / and /about (curly apostrophe, education block spacing after transfer-line removal) not performed",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-27T21:34:14.610Z",
    "resolved_at": "2026-08-27T21:43:02.373Z"
  }
]
````
