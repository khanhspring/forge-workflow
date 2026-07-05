---
name: "forge-config"
description: "View and interactively update .forge/project.json (add/remove modules and submodules, ports, stack, spec repo URL) and CONTEXT.md (actors, glossary, principles, conventions). Asks one question at a time and previews changes before writing."
argument-hint: "Optional hint: 'add module', 'add submodule to webapps', 'update user-service port', 'edit principles'"
compatibility: "Requires spec repo with .forge/project.json"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-config/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Config

View and update the project configuration at `.forge/project.json`, and the
project-wide domain context at `CONTEXT.md`.

## Step 1 — Load & display

Read `.forge/project.json`.
If missing: "No project config found. Run `/forge-init` to set up this repo first."

Display the current config. Modules with submodules show one indented `↳` row per
submodule — the parent row has no port/stack (those belong to each submodule):

```
Project: {project-name}
Spec repo: {spec_repo}
Contract tool: {contract_tool}

Modules ({n}):
  · user-service    backend   Spring Boot 3, Java 21   :8081
  · webapps         (3 submodules)
    ↳ admin         frontend  React                    :3001   apps/admin
    ↳ landing       frontend  Next.js                  :3000   apps/landing
    ↳ portal        frontend  React                    :3002   apps/portal
```

## Step 2 — Determine the change

From $ARGUMENTS, infer the intent if given (e.g. "add module", "add submodule to webapps",
"update user-service port", "edit principles").
If empty, ask: "What do you want to change? (add a module / add a submodule to an existing
module / remove a module or submodule / update a field / change spec repo URL / edit project
context — actors, glossary, principles, conventions)"

## Step 3 — Collect details (one question at a time)

Ask one question per message — never batch.

**Adding a module** — ask in order, one at a time:
1. "Module name? (kebab-case, must be unique)"
2. "Type? (backend / frontend / worker / gateway)"
3. "Tech stack? (e.g. 'Spring Boot 3, Java 21')"
4. "Git repo URL? (or 'none')"
5. "Does `{name}` contain multiple submodules — e.g. a monorepo with several apps,
   or a Gradle multi-module build? (yes / no)"
   - **If yes** → collect submodules one at a time (see below). Skip step 6 —
     port and stack belong to each submodule, not the parent; drop the stack from step 3
     if it was given for the parent.
   - **If no** → continue.
6. "Local dev port?" _(skip when the module has submodules)_
7. "One-sentence description? (or 'none')"

**Adding a submodule** (to an existing module) — ask which module first if not given.

- If the parent is currently a **simple module** (no `submodules[]`), warn before converting:
  > "`{module}` is currently a standalone module. Adding a submodule converts it:
  > its `port` and `stack` move to the submodules — the parent keeps only `name`,
  > `repo`, and `description`. If `{module}` already has tasks or contracts under its
  > own name, those stay as-is and won't match a submodule name. Convert? (yes/no)"
  If yes, ask whether the existing port/stack should become the first submodule
  (asking for its `name` and `path`) or be discarded.
- Then collect each new submodule, one field at a time (same as `/forge-init`):
  1. "Submodule name? (kebab-case, unique across the whole project — not just within `{module}`)"
  2. "Type? (backend / frontend / worker)"
  3. "Stack?"
  4. "Port?"
  5. "Path within the `{module}` repo? (e.g. `apps/admin` or `auth-ui`)"
  6. "One sentence: what does it do? _(Skip with 'none')_"
- Confirm each: "`{sub}` — {type} — {stack} — :{port} — path: {path}. Another submodule? (yes / no)"

> **Submodule rules (same as `/forge-init`):**
> - No `repo` field on a submodule — it shares the parent module's repo
> - No `port` or `stack` on a parent that has submodules
> - Submodule names must be unique across the whole project — contracts live at
>   `contracts/{submodule}/` and tasks.md uses `### {submodule}` headings directly

**Removing a module or submodule:**
- Check whether any `features/*/tasks.md` has a `### {name}` section (module name for
  simple modules, submodule name for submodules).
  If so, warn: "`{name}` has tasks in {feature(s)}. Removing it from config won't delete those tasks. Remove anyway? (yes/no)"
- Otherwise confirm: "Remove `{name}` from the project? (yes/no)"
- If removing the **last submodule** of a module, ask: "That's the last submodule of
  `{module}`. Convert it back to a standalone module (needs a port and stack), or remove
  the whole module?"

**Updating a field:**
- Show the current value, then ask for the new one:
  "`{module}.{field}` is currently `{old}`. What should it be?"
- Submodule fields use the path `{module}.submodules[{sub}].{field}` — e.g.
  "`webapps.submodules[admin].port` is currently `3001`. What should it be?"
- Refuse to set `port` or `stack` on a parent with submodules, or `repo` on a
  submodule — explain the rule instead.

**Changing spec repo URL:**
- "Current spec_repo is `{old}`. New URL?"

**Editing project context (`CONTEXT.md`):**
- Read `CONTEXT.md`. If missing, offer to create it with the template from `/forge-init`
  Phase 6, asking the Phase 2 and Phase 4 questions to fill it.
- Ask which section: "Which section? (What This Project Is / Business Goal / Actors /
  Domain Glossary / Current State / Principles / Conventions / Out of Scope)"
- Show the section's current content, then ask what to add, change, or remove.
- Context edits go to `CONTEXT.md` only — never to CLAUDE.md or project.json.

## Step 4 — Preview & gate

Show the before/after of exactly what will change:

```
Change preview:
  modules[user-service].port:  8081  →  8090
```

Adding a submodule:
```
Change preview:
  modules[webapps].submodules  +  { name: reports, type: frontend,
                                    stack: [React], port: 3003, path: apps/reports }
```

Converting a simple module to one with submodules, show the moved fields too:
```
Change preview:
  modules[webapps].port   3000  →  (removed — moves to submodules)
  modules[webapps].stack  [React]  →  (removed — moves to submodules)
  modules[webapps].submodules  +  { name: admin, ... }
```

For CONTEXT.md edits, show the section before/after instead.

> "Apply this change to `{file}`? Say **yes** to write, or tell me what to adjust."

Wait for confirmation. Do not write before the user says yes.

## Step 5 — Write & confirm

Apply the change, preserving all other fields, sections, and formatting.
Confirm: "Updated `{file}` — {summary of what changed}."

If a module or submodule name changed, warn:
> "Heads up: `{name}` is referenced by the module repo's `.forge/module.json`, by
> `### {name}` headings in tasks.md, and by the `contracts/{name}/` folder. Update
> those to match, or `/forge-implement` and `/forge-close` will break."

## Schema Reference

```jsonc
{
  "project": "my-project",        // short slug, no spaces
  "version": "1.0",
  "modules": [
    // Module WITHOUT submodules — port and stack on the module itself:
    {
      "name": "user-service",     // kebab-case, matches module.json in module repos
      "repo": "git@github.com:org/user-service.git",
      "type": "backend",          // backend | frontend | worker | gateway
      "stack": ["Spring Boot 3", "Java 21"],
      "port": 8081,
      "description": ""           // optional, one sentence
    },
    // Module WITH submodules — NO port/stack/type on the parent;
    // each submodule owns type, stack, port, path; NO repo on submodules:
    {
      "name": "webapps",
      "repo": "git@github.com:org/webapps.git",
      "description": "Web app mono-repo",
      "submodules": [
        {
          "name": "admin",        // kebab-case, unique across the WHOLE project
          "type": "frontend",     // backend | frontend | worker
          "stack": ["React"],
          "port": 3001,
          "path": "apps/admin",   // relative path inside the parent repo
          "description": ""       // optional, one sentence
        }
      ]
    }
  ],
  "spec_repo": "git@github.com:org/specs.git",
  "contract_format": "openapi3",
  "contract_tool": "specmatic"
}
```

## Rules
- One question per message — never batch
- Never write before the user confirms the preview in Step 4
- `module.name` must be kebab-case and unique; submodule names must be unique across
  the whole project (contracts and task headings use the submodule name directly)
- `module.name` must match the `module` field in the module repo's `.forge/module.json`;
  submodule names must match the `submodules[].name` entries there
- A module has EITHER `port`+`stack` OR `submodules[]` — never both; submodules never
  have a `repo` field
- Never silently remove a module or submodule that has tasks referencing it — warn first
