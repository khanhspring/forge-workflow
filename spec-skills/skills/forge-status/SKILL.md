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

Show the current status of all features in this spec repo, in changelog order.

## Steps

1. Read `features/CHANGELOG.md`.
   - If missing or empty (no data rows): "No features yet. Run `/forge-brainstorm` to plan your first feature."
   - Parse each row: `#`, `slug`, `description`, `status`, `modules`, `depends on`.

2. For each row — in changelog order — determine its **live state** by checking the files
   (overrides the stored status for in-progress detail):

   | Files present | Live state |
   |---|---|
   | Nothing in `features/{slug}/` | 🔵 Brainstormed |
   | `brainstorm.md` only | 🔵 Brainstormed |
   | `spec.md` exists, no `tasks.md` | 🟡 Draft |
   | `tasks.md` exists, no contract | 🟠 Open |
   | Contract exists, unchecked tasks remain | 🟣 Implementing |
   | All tasks checked (or `Status: Done` in tasks.md) | ✅ Done |

3. For 🟣 Implementing features, read `tasks.md` and compute per-module completion
   (ticked vs total under each `### {target}` heading).

4. Flag any `Depends on` entries where the dependency is not yet ✅ Done — mark with ⚠️.

## Output Format

```
Feature Status — {project}
══════════════════════════════════════════════════════════════════
 #   Slug                Status         Modules           Depends on
──────────────────────────────────────────────────────────────────
 1   user-auth           ✅ Done         user-service       —
 2   payment-flow        🟣 Implementing  user-service 2/3   #1
 3   notification-prefs  🟠 Open          user-service       #1
 4   search-filters      🟡 Draft         user-service       —
 5   bulk-export         🔵 Brainstormed  —                  #3 ⚠️ not done yet
══════════════════════════════════════════════════════════════════
5 features  ·  1 done  ·  1 implementing  ·  3 in planning
```

The ⚠️ flag means "this feature's dependency is not yet Done — reconsider starting it."

## What to Show Next
After the table, suggest the next action for each non-done feature (in changelog order):
- 🔵 Brainstormed → `/forge-spec {slug}`
- 🟡 Draft → `/forge-tasks {slug}`
- 🟠 Open → `/forge-contract {slug}`
- 🟣 Implementing → "Module repos: `/forge-implement {slug}` → `/forge-done` → `/forge-close {slug} {module}`"
