---
name: "forge-status"
description: "Scans features/ and shows phase status for every feature: 🔵 brainstorming, 🟡 spec written, 🟠 tasks ready, ✅ contract complete. Suggests the next forge command for each in-progress feature."
argument-hint: ""
compatibility: "Requires spec repo with .forge/project.json"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-status/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Status

Show the current status of all features in this spec repo.

## Steps

1. Scan the `features/` directory. If empty or missing, say "No features yet. Run `/forge-brainstorm` to plan your first feature."

2. For each feature folder, determine its state (check in order, top to bottom):
   - No `brainstorm.md` and no `spec.md` → 🔵 Brainstorming
   - `brainstorm.md` exists, no `spec.md` → 🔵 Brainstormed
   - `spec.md` exists, no `tasks.md` → 🟡 Spec written
   - `tasks.md` exists, no contract file in `contracts/{any-module}/{slug}.yaml` → 🟠 Tasks ready
   - Contract exists, but `tasks.md` has unchecked tasks → 🟣 Implementing
   - Contract exists and all tasks in `tasks.md` are checked → ✅ Done

3. For features in Implementing, read `tasks.md` and compute per-module completion
   (ticked vs total under each `### {module}` heading) for the detail line.

4. Also check `contracts/` for orphaned contracts (contract file exists but no matching feature folder) and flag them.

## Output Format

```
Feature Status — {project} spec repo
══════════════════════════════════════════════════════

✅  user-auth           Done — all modules complete
🟣  payment-flow        Implementing — user-service 2/3, web-app 0/2
🟠  notification-prefs  Tasks ready — contract pending
🟡  search-filters      Spec written — tasks pending
🔵  bulk-export         Brainstormed — spec pending

══════════════════════════════════════════════════════
5 features  ·  1 done  ·  1 implementing  ·  3 planning
```

## What to Show Next
After the table, suggest the next action for each non-done feature:
- Brainstorming/Brainstormed → "Run `/forge-spec {slug}` to write the spec"
- Spec written → "Run `/forge-tasks {slug}` to generate the task breakdown"
- Tasks ready → "Run `/forge-contract {slug}` to generate the API contract"
- Implementing → "Module repos run `/forge-implement {slug}`, then `/forge-done` → `/forge-close {slug} {module}`"
