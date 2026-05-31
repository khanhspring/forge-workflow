---
name: "forge-tasks"
description: "Lists all tasks assigned to this module across every feature, with completion status, by scanning the spec submodule. Module repo task dashboard."
argument-hint: ""
compatibility: "Requires module repo with .forge/module.json and an initialized specs/ git submodule"
metadata:
  author: "forge-workflow"
  source: "module-skills/forge-tasks/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Tasks — Module Repo

Show all tasks assigned to this module across all features.

## Pre-check
- Read `.forge/module.json` for `module` and `spec_submodule_path`.
  If missing: "Run `/forge-init` to set up this module repo first."
- If `specs/` is not initialized: suggest `git submodule update --init --recursive`
- Optionally suggest `git submodule update --remote specs` to get the latest task status.

## Steps

Determine the set of task headings to look for:
- `module.json` has no `submodules` → look for `### {module}` (one heading).
- `module.json` has `submodules[]` → look for `### {submodule.name}` for each entry.
  Submodule task headings use the submodule's own name — no parent prefix — so they are
  identical to standalone module headings and can be promoted without touching tasks.md.

Scan `{spec_submodule_path}/features/*/tasks.md` → find all matching headings → extract tasks
with their checkbox state and the parent feature's `Status`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks for: {module}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: user-registration  [Open]
- [ ] TASK-1 [api] POST /users/register endpoint
- [ ] TASK-2 [feat] Password hashing + validation
- [x] TASK-3 [test] Unit tests for UserService

Feature: user-profile  [Open]
- [ ] TASK-5 [api] GET /users/{id} endpoint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2 features  ·  4 remaining  ·  1 done
```

For a module with submodules, group tasks by submodule under each feature:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks for: webapps  (submodules: admin · landing · portal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: user-registration  [Open]
  [admin]
  - [ ] TASK-3 [ui] Registration form
  [portal]
  - [ ] TASK-4 [ui] Registration confirmation page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 feature  ·  2 remaining  ·  0 done
```

If no tasks reference this module across any feature:
> "No tasks found for `{module}`. Either no feature targets this module yet, or the specs
> submodule is out of date — try `git submodule update --remote specs`."

After showing: "Tell me which feature to implement, or run `/forge-implement {slug}`."
