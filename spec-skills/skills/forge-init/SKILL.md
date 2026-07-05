---
name: "forge-init"
description: "One-time initialization for a Forge spec repo. Walks through setup conversationally one question at a time — project identity, project details, modules, principles — then writes .forge/project.json, CONTEXT.md, CLAUDE.md, and directory scaffolding on confirmation."
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

## Phase 2 — Project details

These answers become `CONTEXT.md` — the project-wide domain context that
`/forge-brainstorm` and `/forge-spec` read before planning, and that module repos
see at `specs/CONTEXT.md` during implementation. Getting this right once saves
re-explaining the project in every feature conversation.

Start by offering the shortcut:
> "If you have a project overview doc (README, pitch doc, Confluence page), paste it
> and I'll extract these answers — otherwise I'll ask a few short questions."

If a doc is pasted, extract what's covered and ask only about genuine gaps.
Otherwise ask one question at a time:

**Q1.** "Who uses this system? List the actors/roles and what each one does.
_(e.g. 'customer — places orders; admin — manages the catalog; billing-worker — system actor')_"

**Q2.** "What are the core domain concepts, in your team's own words?
_(e.g. 'Order, Quote, Fulfillment — a Quote becomes an Order when accepted')_
These become the domain glossary — the exact terms specs and contracts will use."

**Q3.** "What's the business goal — what does success look like for this project?
_(1–2 sentences, or 'skip')_"

**Q4.** "What's the current state? Greenfield, or are there existing systems this
replaces or integrates with?
_(e.g. 'replacing a legacy PHP monolith; auth stays in Keycloak')_"

Keep this phase capped at these four areas — deep per-feature questioning is
`/forge-brainstorm`'s job, not init's.

---

## Phase 3 — Modules

Collect modules one at a time. Each module is gathered field by field.

Start with:
> "Now let's add the services and apps that make up this project. First module — what's its name? (kebab-case, e.g. `user-service`)"

For each module, ask these in order (one question per message):

1. **Name** — already asked above
2. **Type** — "Is `{name}` a backend service, frontend app, or something else?
   _(backend / frontend / worker / gateway)_"
3. **Stack** — "What's the tech stack for `{name}`? (e.g. `Spring Boot 3, Java 21` or `React, TypeScript`)"
4. **Repo URL** — "What's the git repo URL for `{name}`?
   _(Skip with 'none' if not set up yet)_"
5. **Submodules** — scan the user's answers so far for signals: words like "monorepo", "multi-module",
   "Gradle modules", a comma-separated list of app names, etc.
   **If signals present**, ask:
   > "It sounds like `{name}` contains multiple submodules ({detected names if any}).
   > Should I configure them separately? (yes / no)"
   **If yes** → collect submodules one at a time (see below). Skip step 6 — port belongs to each submodule, not the parent.
   **If no or no signals** → continue to step 6.
6. **Port** _(skip when module has submodules)_ — "What port does `{name}` run on locally?"
7. **Description** — "One sentence: what does `{name}` do? _(Skip with 'none')_"

**Submodule collection** (repeat for each):
- "Submodule name? (kebab-case)"
- "Type? (backend / frontend / worker)"
- "Stack?"
- "Port?"
- "Path within the `{name}` repo? (e.g. `apps/admin` or `auth-ui`)"
- "One sentence: what does it do? _(Skip with 'none')_"

Confirm each: "`{sub}` — {type} — {stack} — :{port} — path: {path}. Another submodule? (yes / no)"

> **Rules for submodules:**
> - No `repo` field — submodules share the parent module's repo
> - No `port` on the parent module — port belongs to each submodule
> - `type` and `stack` are per-submodule (may differ from the parent)

After collecting all submodules (or just module fields), confirm:

> "Got it:
> `{name}` — {type} — {repo or 'no repo yet'}
> {if no submodules: stack + port}
> {if submodules: list each as `  ↳ {sub} — {type} — {stack} — :{port} — {path}`}
> {description}
> Is that right?"

Then ask:
> "Any more modules to add? (yes / no)"

If yes, repeat from step 1 of this phase for the next module.
If no, move to Phase 4.

---

## Phase 4 — Principles & conventions

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

## Phase 5 — Preview & gate

Show a full preview of what will be written:

```
Ready to initialize. Here's what I'll create:

.forge/project.json
  project: {name}
  modules: {n} module(s): {comma-separated names}
  spec_repo: {url or "not set"}

CONTEXT.md
  Description: {description}
  Actors: {n} listed
  Domain glossary: {n} terms
  Business goal: {one line or "skipped"}
  Current state: {one line}
  Principles: {list or "none yet"}
  Conventions: {list or "none yet"}
  Out of scope: {list or "none yet"}

CLAUDE.md
  Modules: {n} listed
  Forge workflow + structure + pointer to CONTEXT.md

features/CHANGELOG.md
contracts/.gitkeep
.gitignore  ← append Forge entries
```

> "Does this look right? Say **yes** to initialize, or tell me what to change."

Wait for confirmation. Do not write anything before the user says yes.

---

## Phase 6 — Write files

Write `.forge/project.json`:

Module **without** submodules — `port` and `stack` on the module itself:
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

Module **with** submodules — no `port` on the module; each submodule owns its `port`, `stack`,
`type`, and `path`; no `repo` on submodules (they share the parent's repo):
```json
{
  "project": "{project-name}",
  "version": "1.0",
  "modules": [
    {
      "name": "{module-name}",
      "repo": "{repo-url}",
      "description": "{description}",
      "submodules": [
        {
          "name": "{sub-name}",
          "type": "backend|frontend|worker",
          "stack": ["{stack}"],
          "port": {port},
          "path": "{relative-path-in-repo}",
          "description": "{description}"
        }
      ]
    }
  ],
  "spec_repo": "{spec-repo-url}",
  "contract_format": "openapi3",
  "contract_tool": "specmatic"
}
```

Write `CONTEXT.md` — the single source of truth for project-wide domain context.
Fill every section from the Phase 1, 2, and 4 answers; write "None defined yet." only
where the user explicitly skipped:
```markdown
# {project-name} — Project Context

> Domain context for all planning and implementation. `/forge-brainstorm` and
> `/forge-spec` read this before any feature work; module repos see it at
> `specs/CONTEXT.md`. Keep it current via `/forge-config`.

## What This Project Is
{description — 2–4 sentences built from the user's answers, not just the one-liner}

## Business Goal
{goal — or "Not defined yet."}

## Actors
| Actor | Who they are | What they do in the system |
|-------|--------------|----------------------------|
| {role} | {description} | {responsibilities} |

## Domain Glossary
| Term | Meaning |
|------|---------|
| {term} | {definition in the team's own words} |

## Current State
{greenfield / existing systems, integrations, migration notes}

## Principles
{list each as a bullet — or "None defined yet."}

## Conventions
{list each as a bullet — or "None defined yet."}

## Out of Scope / Forbidden
{list each as a bullet — or "None defined yet."}
```

Write `CLAUDE.md` — operational only; domain context lives in `CONTEXT.md`, never
duplicate it here:
```markdown
# {project-name}

{description — the 1–2 sentence version}

## Project Context
Actors, domain glossary, principles, and conventions live in `CONTEXT.md`.
Read it before any brainstorm, spec, or planning work.

## Modules
| Name | Type | Stack | Port |
|------|------|-------|------|
| {name} | {type} | {stack} | {port} |

_(For modules with submodules, expand the table with one row per submodule.
Indent the submodule name with `↳` and omit port/stack from the parent row.)_

| Name | Type | Stack | Port | Path |
|------|------|-------|------|------|
| {module} | — | — | — | — |
| ↳ {sub} | {type} | {stack} | {port} | {path} |

## Forge Workflow
1. `/forge-brainstorm` — explore and define a feature
2. `/forge-spec`       — write the spec
3. `/forge-tasks`      — break into per-module tasks
4. `/forge-contract`   — generate Specmatic OpenAPI contracts
5. `/forge-close {slug} {module}` — mark a module's tasks done (after module repo ships)

Utilities: `/forge-status` (feature dashboard) · `/forge-config` (edit modules/ports/context)

## Structure
- `CONTEXT.md`                    — project-wide domain context (actors, glossary, principles)
- `features/{slug}/brainstorm.md` — approved brainstorm summary
- `features/{slug}/spec.md`       — requirements, flows, API list
- `features/{slug}/tasks.md`      — per-module task breakdown with checkboxes
- `contracts/{module}/{slug}.yaml` + `schemas/` + `shared/` — Specmatic OpenAPI 3.0 contracts
```

Create `features/CHANGELOG.md`:
```markdown
# Feature Changelog

Ordered list of all features. Add entries via `/forge-brainstorm`; update via `/forge-spec`,
`/forge-contract`, and `/forge-close`. Use `Depends on` to declare what must ship first.

| # | Slug | Description | Status | Modules | Depends on |
|---|------|-------------|--------|---------|------------|
```

Create:
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
- Never write files before the user says yes in Phase 5
- Each fact lives in exactly one file: domain context in `CONTEXT.md`, machine config
  in `.forge/project.json`, workflow instructions in `CLAUDE.md` — never duplicate
  content across them
- Never overwrite existing files
- All written files must be complete — no unfilled placeholders
- **Extract, don't re-ask**: if the user's answer contains information for upcoming fields
  (e.g. "user-service, Spring Boot 3, port 8080, backend"), extract and fill those fields
  silently — only ask about what is genuinely missing. Never ask a question the user has
  already answered, even indirectly.
- If the user provides multiple answers in one message, accept them gracefully and move forward
