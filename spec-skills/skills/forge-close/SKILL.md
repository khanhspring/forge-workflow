---
name: "forge-close"
description: "Marks a module's tasks as done in features/{slug}/tasks.md, generates the spec repo commit message, and checks whether all modules have completed — closing the feature if so."
argument-hint: "Feature slug and module name (e.g. 'user-registration user-service')"
compatibility: "Requires spec repo with .forge/project.json and features/{slug}/tasks.md"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-close/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Close — Spec Repo

Mark a module's implementation tasks as done in the spec repo.
Run this after `/forge-done` in the module repo.

---

## Pre-check

- Read `.forge/project.json` — get module list.
  If missing: "Run `/forge-init` to set up this spec repo first."
- Parse $ARGUMENTS:
  - First word → feature slug
  - Second word → module name
  - If slug missing → ask: "Which feature are you closing?"
  - If module missing → ask: "Which module are you marking as done?
    _(Available modules: {list from project.json})_"
- Read `features/{slug}/tasks.md` — must exist.
  If missing: "No tasks file found. Run `/forge-tasks {slug}` first."
- Validate module name exists in `### {module}` section of tasks.md.
  If not found: "No tasks for `{module}` in `{slug}`. Check the module name matches exactly."

---

## Step 1 — Show current task state

Display the module's current tasks:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Closing: {module} / {feature-slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [ ] TASK-1 [api] POST /users/register endpoint
- [ ] TASK-2 [feat] Password hashing + validation
- [x] TASK-3 [test] Unit tests for UserService
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If all tasks are already ticked:
> "All tasks for `{module}` are already marked done. Nothing to update."
Check overall feature status (Step 3) and stop.

Otherwise ask:
> "Mark all {n} tasks for `{module}` as done? Say **yes** to update, or tell me which ones to skip."

Wait for confirmation before writing.

---

## Step 2 — Update tasks.md

In `features/{slug}/tasks.md`, tick all confirmed tasks under `### {module}`:
- Change `- [ ]` → `- [x]` for each confirmed task
- Leave any explicitly skipped tasks untouched
- Update the `**Last updated:**` date at the top of the file to today

Show a diff summary:
```
Updated features/{slug}/tasks.md:
- [x] TASK-1 [api] POST /users/register endpoint  ← ticked
- [x] TASK-2 [feat] Password hashing + validation  ← ticked
- [x] TASK-3 [test] Unit tests for UserService  (was already done)
```

---

## Step 3 — Check overall feature completion

Scan ALL `### {module}` sections in `tasks.md`.
Count ticked vs unticked tasks per module:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feature progress: {feature-slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [x] user-service — 3/3 tasks done
- [ ] web-app — 0/2 tasks done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If all modules are complete:**
Update `features/{slug}/tasks.md` header status to `Done`
and `features/{slug}/spec.md` header status to `Done`.
Update `features/CHANGELOG.md`: find the row for `{slug}` and set `Status` → `Done`.

> "🎉 All modules done — feature `{slug}` is complete."

**If modules still remain:**

List what's left:
> "{module} still has {n} task(s) remaining.
> Once they run `/forge-done {slug}` in their module repo,
> they can run `/forge-close {slug} {module}` here to close out."

---

## Step 4 — Generate commit message

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commit message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
chore(tasks): mark {module} done for {feature-slug}

Completed tasks:
- TASK-1: {title}
- TASK-2: {title}
- TASK-3: {title}

{if all modules done}
Feature {feature-slug} fully implemented across all modules.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then remind:
> "After committing and pushing, module repos should run:
> `git submodule update --remote specs`
> to sync the updated task status."
