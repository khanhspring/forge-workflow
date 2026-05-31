---
name: "forge-config"
description: "View and interactively update .forge/project.json: add or remove modules, update ports, change stack info, or update the spec repo URL. Asks one question at a time and previews changes before writing."
argument-hint: "Optional hint: 'add module', 'update user-service port', 'remove web-app'"
compatibility: "Requires spec repo with .forge/project.json"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-config/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Config

View and update the project configuration at `.forge/project.json`.

## Step 1 — Load & display

Read `.forge/project.json`.
If missing: "No project config found. Run `/forge-init` to set up this repo first."

Display the current config:

```
Project: {project-name}
Spec repo: {spec_repo}
Contract tool: {contract_tool}

Modules ({n}):
  · user-service    backend   Spring Boot 3, Java 21   :8081
  · web-app         frontend  React, TypeScript         :3000
```

## Step 2 — Determine the change

From $ARGUMENTS, infer the intent if given (e.g. "add module", "update user-service port").
If empty, ask: "What do you want to change? (add a module / remove a module / update a field / change spec repo URL)"

## Step 3 — Collect details (one question at a time)

Ask one question per message — never batch.

**Adding a module** — ask in order, one at a time:
1. "Module name? (kebab-case, must be unique)"
2. "Type? (backend / frontend / worker / gateway)"
3. "Tech stack? (e.g. 'Spring Boot 3, Java 21')"
4. "Local dev port?"
5. "Git repo URL? (or 'none')"
6. "One-sentence description? (or 'none')"

**Removing a module:**
- Check whether any `features/*/tasks.md` has a `### {module}` section.
  If so, warn: "`{module}` has tasks in {feature(s)}. Removing it from config won't delete those tasks. Remove anyway? (yes/no)"
- Otherwise confirm: "Remove `{module}` from the project? (yes/no)"

**Updating a field:**
- Show the current value, then ask for the new one:
  "`{module}.{field}` is currently `{old}`. What should it be?"

**Changing spec repo URL:**
- "Current spec_repo is `{old}`. New URL?"

## Step 4 — Preview & gate

Show the before/after of exactly what will change:

```
Change preview:
  modules[user-service].port:  8081  →  8090
```

> "Apply this change to `.forge/project.json`? Say **yes** to write, or tell me what to adjust."

Wait for confirmation. Do not write before the user says yes.

## Step 5 — Write & confirm

Apply the change, preserving all other fields and formatting.
Confirm: "Updated `.forge/project.json` — {summary of what changed}."

If a module name changed, warn:
> "Heads up: `{module}` is referenced by the module repo's `.forge/module.json` and by
> `### {module}` headings in tasks.md. Update those to match, or `/forge-implement` and
> `/forge-close` will break."

## Schema Reference

```jsonc
{
  "project": "my-project",        // short slug, no spaces
  "version": "1.0",
  "modules": [
    {
      "name": "user-service",     // kebab-case, matches module.json in module repos
      "repo": "git@github.com:org/user-service.git",
      "type": "backend",          // backend | frontend | worker | gateway
      "stack": ["Spring Boot 3", "Java 21"],
      "port": 8081,
      "description": ""           // optional, one sentence
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
- `module.name` must be kebab-case and unique
- `module.name` must match the `module` field in the module repo's `.forge/module.json`
- Never silently remove a module that has tasks referencing it — warn first
