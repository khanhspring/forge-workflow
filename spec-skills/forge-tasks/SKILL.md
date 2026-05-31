---
name: "forge-tasks"
description: "Phase 3 of 4. Breaks an approved spec into a per-module task list and writes features/{slug}/tasks.md with checkboxes and acceptance criteria."
argument-hint: "Feature slug (e.g. 'user-registration')"
compatibility: "Requires spec repo with .forge/project.json and features/{slug}/spec.md"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-tasks/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Tasks — Spec Repo

Generate the task breakdown for a feature and write it to a dedicated file.

## Pre-check
- Feature slug from $ARGUMENTS. If empty, list available features in `features/` and ask which one.
- Read `features/{slug}/spec.md` — must exist, otherwise say "Run `/forge-spec {slug}` first."
- Check if `features/{slug}/tasks.md` already exists:
  - If yes → display it and ask: "Tasks already exist. Regenerate them? (yes/no)"
  - If no → generate and write.

## Task breakdown rules
- Group tasks by module using `### {module-name}` headings (use module names from `.forge/project.json`)
- Each task gets a unique ID: `TASK-N` (sequential across all modules)
- Tag each task with type: `[api]` / `[feat]` / `[ui]` / `[test]` / `[infra]`
- Write 1–3 acceptance criteria under each task
- Order tasks within each module by dependency (what must be done first)
- For frontend/consumer modules, reference the backend endpoint they integrate against

## Output file: `features/{slug}/tasks.md`

```markdown
# Tasks: {Feature Name}

**Feature:** {slug}
**Status:** Open
**Last updated:** {YYYY-MM-DD}
_(Status lifecycle: Open → Done, set by `/forge-close` when all modules finish)_

---

### {module-name} ({type})

- [ ] TASK-1 [api] {task title}
  - {acceptance criterion}
  - {acceptance criterion}

- [ ] TASK-2 [feat] {task title}
  - {acceptance criterion}

---

### {module-name} ({type})

- [ ] TASK-3 [ui] {task title}
  - {acceptance criterion}
```

## After writing — display summary

```
Tasks: {feature-slug}
══════════════════════════════════════════
### user-service (backend)
- [ ] TASK-1 [api] POST /users/register
- [ ] TASK-2 [feat] Password hashing

### web-app (frontend)
- [ ] TASK-3 [ui] Registration form component
══════════════════════════════════════════
3 tasks across 2 modules
```

## Gate
> "Tasks written to `features/{slug}/tasks.md`. Review and say **yes** to generate the API contract."

Do NOT generate contracts. Wait for confirmation.
