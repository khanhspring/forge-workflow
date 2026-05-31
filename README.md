# Forge Workflow

A Claude Code skill toolkit for multi-repo microservices teams (2–5 devs).
It covers the full feature lifecycle: brainstorm → spec → tasks → API contract →
implementation → contract test → done.

Forge assumes two kinds of repos:

- **Spec repo** — planning, specs, and Specmatic OpenAPI contracts. The source of truth.
- **Module repos** — the actual code, one module each (backend or frontend). Each pulls the spec repo in as a git submodule at `specs/`.

The two skill packs in this repo map to those two repo types.

---

## Install

Two packages, one per repo type. Install once per developer — skills go to `~/.claude/skills/` and work across all your repos.

**In your spec repo:**
```bash
npx @khanhspring/forge-spec
```

**In each module repo (backend or frontend):**
```bash
npx @khanhspring/forge-module
```

Restart Claude Code after installing, then run `/forge-init` in any repo to get started.

### Updating

Re-run the same command to pull the latest version:
```bash
npx @khanhspring/forge-spec
npx @khanhspring/forge-module
```

### How it works

Both packs can coexist in `~/.claude/skills/` — each skill checks for `.forge/project.json` (spec) or `.forge/module.json` (module) and only activates in the right repo type.

### Alternative: commit into the spec repo

If you want skills version-controlled and auto-available on clone:
```bash
mkdir -p .claude/skills
cp -r node_modules/@khanhspring/forge-spec/* .claude/skills/
git add .claude/skills/ && git commit -m "chore: add forge spec skills"
```

---

## Skills

### Spec repo (`spec-skills/`)
| Skill | Purpose |
|-------|---------|
| `/forge-init` | One-time setup — writes `.forge/project.json`, `CLAUDE.md`, scaffolding |
| `/forge-brainstorm [idea]` | Phase 1 — interrogate the idea, save `features/{slug}/brainstorm.md` |
| `/forge-spec [slug]` | Phase 2 — write `features/{slug}/spec.md` |
| `/forge-tasks [slug]` | Phase 3 — write `features/{slug}/tasks.md`, grouped by module |
| `/forge-contract [slug]` | Phase 4 — generate Specmatic OpenAPI contracts |
| `/forge-close [slug] [module]` | Mark a module's tasks done after the module repo ships |
| `/forge-status` | Dashboard of every feature's phase |
| `/forge-config` | View/edit modules, ports, stack, spec repo URL |

### Module repo (`module-skills/`)
| Skill | Purpose |
|-------|---------|
| `/forge-init` | One-time setup — adds `specs/` submodule, writes `.forge/module.json`, `CLAUDE.md` |
| `/forge-tasks` | List pending tasks for this module across all features |
| `/forge-implement [slug]` | Research patterns, plan, then implement task by task |
| `/forge-contract-test` | Run Specmatic contract tests, or analyze pasted failures |
| `/forge-done [slug]` | Confirm tasks done + generate the module repo commit message |

---

## Workflow

```
SPEC REPO
  /forge-init                      (once)
  /forge-brainstorm  →  features/{slug}/brainstorm.md
  /forge-spec        →  features/{slug}/spec.md         (Status: Draft)
  /forge-tasks       →  features/{slug}/tasks.md
  /forge-contract    →  contracts/{module}/{slug}.yaml (Status: Ready)
        │
        │  git push  →  module repos: git submodule update --remote specs
        ▼
MODULE REPO
  /forge-init                      (once)
  /forge-implement {slug}          implement this module's tasks
  /forge-contract-test             verify against the contract
  /forge-done {slug}               commit message
        │
        ▼
SPEC REPO
  /forge-close {slug} {module}     tick tasks; when all modules done → Status: Done
        │
        ▼
  module repos: git submodule update --remote specs   (sync task status)
```

Each phase has a confirmation gate — nothing is written until you approve it.

---

## Feature folder layout (spec repo)

```
features/{slug}/
  brainstorm.md   ← approved brainstorm summary (survives across sessions)
  spec.md         ← requirements, actors, data model, flows, API list
  tasks.md        ← per-module task breakdown with checkboxes (the live file)

contracts/{module}/
  {slug}.yaml     ← main contract: paths + $refs only
  schemas/        ← one file per request/response/enum object
  shared/         ← api-error.yaml, pagination-meta.yaml (reused across features)
```

---

## Key rules

- **Contract is the source of truth.** Never change a contract to fix a failing test — fix the code.
- **Never skip phases.** brainstorm → spec → tasks → contract, in order.
- **`module.name` must match** between `project.json` (spec repo) and `module.json` (module repo).
- **Run `git submodule update --remote specs`** before starting a feature, and after `/forge-close`.
- Tasks are scoped per module — each module only implements tasks under its own `### {module}` heading.
