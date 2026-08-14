---
name: "forge-done"
description: "Confirms all tasks for this module are complete and generates the module repo commit message. Module repo only — run /forge-close in the spec repo afterward to mark tasks done there."
argument-hint: "Feature slug (e.g. 'user-registration')"
compatibility: "Requires module repo with .forge/module.json and an initialized specs/ link (git submodule or junction)"
metadata:
  author: "forge-workflow"
  source: "module-skills/forge-done/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Done — Module Repo

Close out the implementation side of a feature: confirm all tasks are complete
and generate the module repo commit message.

This skill owns the module repo only. Updating task checkboxes in the spec repo
is handled separately by `/forge-close` in the spec repo.

---

## Pre-check

- Read `.forge/module.json` for `module` and `spec_submodule_path`.
  If missing, say "Run `/forge-init` to set up this module repo first."
- Feature slug from $ARGUMENTS. If empty, ask: "Which feature are you done with?"

---

## Step 1 — Read task list (read-only from specs/)

Read `{spec_submodule_path}/features/{slug}/tasks.md`.

- If `module.json` has no `submodules` key: find the `### {module}` section.
- If `module.json` has `submodules[]`: find the `### {submodule.name}` section for each entry;
  show them grouped by submodule name in Step 2.

If `tasks.md` is missing:
> "No tasks file found at `specs/features/{slug}/tasks.md`.
> Run `/forge-tasks {slug}` in the spec repo first."

Note: `specs/` is read-only from here regardless of link type — task checkboxes cannot be
updated from this repo. That is handled by `/forge-close` in the spec repo.

---

## Step 2 — Confirm completion

Show the task list:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks: {module} / {feature-slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [x] TASK-1 [api] POST /users/register endpoint
- [ ] TASK-2 [feat] Password hashing + validation
- [x] TASK-3 [test] Unit tests for UserService
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- All already ticked in submodule → note it and proceed.
- Some unticked → ask: "Are these actually finished? Say **yes** to proceed or tell me what's still in progress."

Wait for confirmation before continuing.

---

## Step 3 — Generate commit message

**Module with no submodules:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commit message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
feat({module}): implement {feature-slug}

- TASK-1: {title}
- TASK-2: {title}

Spec:     specs/features/{slug}/spec.md
Contract: specs/contracts/{module}/{slug}.yaml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then remind:
> "Once committed and pushed, go to the spec repo and run:
> `/forge-close {slug} {module}`"

**Module with submodules (tasks grouped by submodule):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commit message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
feat(webapps): implement {feature-slug}

[admin]
- TASK-3: {title}
[portal]
- TASK-4: {title}

Spec: specs/features/{slug}/spec.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then remind — one `/forge-close` per submodule, using the **submodule name directly**
(no parent prefix — same command you'd use if it were a standalone module):
> "/forge-close {slug} admin
> /forge-close {slug} portal"
