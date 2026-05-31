---
name: "forge-init"
description: "One-time initialization for a Forge spec repo. Walks through setup conversationally one question at a time, then writes .forge/project.json, CLAUDE.md, and directory scaffolding on confirmation."
argument-hint: "Optional: project name to skip the first prompt"
compatibility: "Run once in a spec repo before any other forge skills. Safe to re-run — never overwrites existing files."
when_to_use: >
  ALWAYS activate when any of the following occur:
  - User says init, initialize, setup, set up, bootstrap, configure + repo/forge/project
  - User says "set this up", "get this started", "prepare this repo"
  - No .forge/project.json exists AND user wants to start planning features or writing specs
  - User says "this is a new spec repo" or "add forge to this project"
  Do NOT activate if .forge/project.json already exists — repo is already initialized.
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-init/SKILL.md"
user-invocable: true
disable-model-invocation: false
---

# Forge Init — Spec Repo

Initialize this repo as a Forge spec repo. Ask questions one at a time, build up the
config through conversation, then write everything in one go after confirmation.

## Pre-check
If `.forge/project.json` already exists → say "Spec repo already initialized." and stop.

---

## Phase 1 — Project identity

Ask one question at a time. Wait for each answer before asking the next.

**Q1.** "What's the project name? (kebab-case slug, e.g. `my-platform`)"

**Q2.** "What does this project do? (1–2 sentences)"

**Q3.** "What's the spec repo remote URL?
_(Skip with 'none' if it's not set up yet — you can add it later with `/forge-config`)_"

---

## Phase 2 — Modules

Collect modules one at a time. Each module is gathered field by field.

Start with:
> "Now let's add the services and apps that make up this project. First module — what's its name? (kebab-case, e.g. `user-service`)"

For each module, ask these in order (one question per message):

1. **Name** — already asked above
2. **Type** — "Is `{name}` a backend service, frontend app, or something else?
   _(backend / frontend / worker / gateway)_"
3. **Stack** — "What's the tech stack for `{name}`? (e.g. `Spring Boot 3, Java 21` or `React, TypeScript`)"
4. **Port** — "What port does `{name}` run on locally?"
5. **Repo URL** — "What's the git repo URL for `{name}`?
   _(Skip with 'none' if not set up yet)_"
6. **Description** — "One sentence: what does `{name}` do?
   _(Skip with 'none')_"

After collecting all fields for a module, confirm it back:

> "Got it:
> `{name}` — {type} — {stack} — :{port} — {repo or 'no repo yet'}
> {description}
> Is that right?"

Then ask:
> "Any more modules to add? (yes / no)"

If yes, repeat from step 1 of this phase for the next module.
If no, move to Phase 3.

---

## Phase 3 — Principles & conventions

Ask one at a time. "None" or "not yet" are valid answers — these sections can be filled
in later with `/forge-config`.

**Q1.** "What are the core principles or rules for this project?
_(e.g. 'API contract before implementation', 'no breaking changes without versioning')
Say 'none yet' to skip._"

**Q2.** "Any coding or API conventions the whole team should follow?
_(e.g. 'all endpoints versioned under /api/v1', 'use kebab-case for URL paths')
Say 'none yet' to skip._"

**Q3.** "Anything explicitly out of scope or forbidden across services?
_(e.g. 'no direct DB access across service boundaries', 'no sync inter-service calls')
Say 'none yet' to skip._"

---

## Phase 4 — Preview & gate

Show a full preview of what will be written:

```
Ready to initialize. Here's what I'll create:

.forge/project.json
  project: {name}
  modules: {n} module(s): {comma-separated names}
  spec_repo: {url or "not set"}

CLAUDE.md
  Description: {description}
  Modules: {n} listed
  Principles: {list or "none yet"}
  Conventions: {list or "none yet"}
  Out of scope: {list or "none yet"}

features/.gitkeep
contracts/.gitkeep
.gitignore  ← append Forge entries
```

> "Does this look right? Say **yes** to initialize, or tell me what to change."

Wait for confirmation. Do not write anything before the user says yes.

---

## Phase 5 — Write files

Write `.forge/project.json`:
```json
{
  "project": "{project-name}",
  "version": "1.0",
  "modules": [
    {
      "name": "{module-name}",
      "repo": "{repo-url}",
      "type": "backend|frontend|worker|gateway",
      "stack": ["{stack}"],
      "port": {port},
      "description": "{description}"
    }
  ],
  "spec_repo": "{spec-repo-url}",
  "contract_format": "openapi3",
  "contract_tool": "specmatic"
}
```

Write `CLAUDE.md`:
```markdown
# {project-name}

{description}

## Modules
| Name | Type | Stack | Port |
|------|------|-------|------|
| {name} | {type} | {stack} | {port} |

## Forge Workflow
1. `/forge-brainstorm` — explore and define a feature
2. `/forge-spec`       — write the spec
3. `/forge-tasks`      — break into per-module tasks
4. `/forge-contract`   — generate Specmatic OpenAPI contracts
5. `/forge-close {slug} {module}` — mark a module's tasks done (after module repo ships)

Utilities: `/forge-status` (feature dashboard) · `/forge-config` (edit modules/ports)

## Principles
{list each as a bullet — or "None defined yet."}

## Conventions
{list each as a bullet — or "None defined yet."}

## Out of Scope / Forbidden
{list each as a bullet — or "None defined yet."}

## Structure
- `features/{slug}/brainstorm.md` — approved brainstorm summary
- `features/{slug}/spec.md`       — requirements, flows, API list
- `features/{slug}/tasks.md`      — per-module task breakdown with checkboxes
- `contracts/{module}/{slug}.yaml` + `schemas/` + `shared/` — Specmatic OpenAPI 3.0 contracts
```

Create:
- `features/.gitkeep`
- `contracts/.gitkeep`

Append to `.gitignore` if not present:
```
# Forge
.forge/secrets
```

Run `git status` and confirm:
> "Spec repo initialized. Run `/forge-brainstorm` to plan your first feature."

---

## Rules
- One question per message — never ask multiple questions at once
- Never write files before the user says yes in Phase 4
- Never overwrite existing files
- All written files must be complete — no unfilled placeholders
- If the user provides multiple answers in one message, accept them gracefully and move forward
