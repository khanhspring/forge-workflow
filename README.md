# Forge Workflow

A Claude Code skill toolkit for multi-repo microservices teams (2–5 devs).
It covers the full feature lifecycle: brainstorm → spec → tasks → API contract →
implementation → contract test → done.

Forge assumes two kinds of repos:

- **Spec repo** — planning, specs, and Specmatic OpenAPI contracts. The source of truth.
- **Module repos** — the actual code. Each pulls the spec repo in as a git submodule at `specs/`.

---

## Concepts

### Modules and submodules

A **module** is a deployable unit (service, app, worker). Each module lives in its own repo.

When a repo contains multiple related modules — for example a frontend monorepo with `admin`,
`landing`, and `portal` apps, or a Gradle multi-module project — those inner units are
**submodules**. Submodules share the parent's repo but each has its own port, stack, tasks,
and contracts. A submodule can be promoted to its own standalone repo at any time with no
changes to task files or contracts.

```
webapps repo  (module)
  ├── apps/admin    ← submodule: admin
  ├── apps/landing  ← submodule: landing
  └── apps/portal   ← submodule: portal

auth-server repo  (module)
  ├── hydra         ← submodule: hydra
  └── auth-ui       ← submodule: auth-ui

user-service repo  (module, no submodules)
```

### Config files

**Spec repo — `.forge/project.json`**

```json
{
  "project": "my-platform",
  "version": "1.0",
  "modules": [
    {
      "name": "user-service",
      "repo": "https://github.com/org/user-service",
      "type": "backend",
      "stack": ["Spring Boot 3", "Java 21"],
      "port": 8080,
      "description": "User management service"
    },
    {
      "name": "webapps",
      "repo": "https://github.com/org/webapps",
      "description": "Web app mono-repo",
      "submodules": [
        { "name": "admin",   "type": "frontend", "stack": ["React"],   "port": 3001, "path": "apps/admin" },
        { "name": "landing", "type": "frontend", "stack": ["Next.js"], "port": 3000, "path": "apps/landing" },
        { "name": "portal",  "type": "frontend", "stack": ["React"],   "port": 3002, "path": "apps/portal" }
      ]
    }
  ],
  "spec_repo": "https://github.com/org/specs",
  "contract_format": "openapi3",
  "contract_tool": "specmatic"
}
```

Modules with submodules have no `port` or `stack` at the parent level — those belong to each submodule.
Submodules have no `repo` field — they share the parent's.

**Module repo — `.forge/module.json`**

Single module:
```json
{
  "module": "user-service",
  "spec_submodule_path": "specs",
  "specmatic_version": "2.x",
  "test_base_url": "http://localhost:8080",
  "contract_glob": "specs/contracts/user-service/*.yaml"
}
```

Module with submodules:
```json
{
  "module": "webapps",
  "spec_submodule_path": "specs",
  "specmatic_version": "2.x",
  "submodules": [
    { "name": "admin",   "path": "apps/admin",   "test_base_url": "http://localhost:3001", "contract_glob": "specs/contracts/admin/*.yaml" },
    { "name": "landing", "path": "apps/landing",  "test_base_url": "http://localhost:3000", "contract_glob": "specs/contracts/landing/*.yaml" },
    { "name": "portal",  "path": "apps/portal",   "test_base_url": "http://localhost:3002", "contract_glob": "specs/contracts/portal/*.yaml" }
  ]
}
```

---

## Install

Two packages, one per repo type. Install once per developer — skills go to `~/.claude/skills/`
and work across all your repos.

**In your spec repo:**
```bash
npx @khanhspring/forge-spec
```

**In each module repo:**
```bash
npx @khanhspring/forge-module
```

Restart Claude Code after installing, then run `/forge-init` in any repo to get started.

### Updating

Re-run the same command to pull the latest version.

### How it works

Both packs coexist in `~/.claude/skills/` — each skill checks for `.forge/project.json` (spec)
or `.forge/module.json` (module) and only activates in the right repo type.

### Alternative: commit into the spec repo

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
| `/forge-init` | One-time setup — writes `.forge/project.json`, `CLAUDE.md`, `features/CHANGELOG.md` |
| `/forge-brainstorm [idea]` | Phase 1 — interrogate the idea (or extract from an existing doc), save `brainstorm.md` |
| `/forge-spec [slug]` | Phase 2 — write `features/{slug}/spec.md` |
| `/forge-tasks [slug]` | Phase 3 — write `features/{slug}/tasks.md`, grouped by module/submodule |
| `/forge-contract [slug]` | Phase 4 — generate Specmatic OpenAPI contracts |
| `/forge-close [slug] [module]` | Mark a module's tasks done after the module repo ships |
| `/forge-status` | Ordered feature dashboard with dependency tracking |
| `/forge-config` | View/edit modules, ports, stack, spec repo URL |

### Module repo (`module-skills/`)

| Skill | Purpose |
|-------|---------|
| `/forge-init` | One-time setup — adds `specs/` git submodule, writes `.forge/module.json`, `CLAUDE.md` |
| `/forge-tasks` | List pending tasks for this repo's module(s) across all features |
| `/forge-implement [slug]` | Research patterns, plan, then implement task by task |
| `/forge-contract-test` | Run Specmatic contract tests, or analyze pasted failures |
| `/forge-done [slug]` | Confirm tasks done + generate the module repo commit message |

---

## Workflow

```
SPEC REPO
  /forge-init                      (once)
  /forge-brainstorm  →  features/{slug}/brainstorm.md  +  CHANGELOG row added
  /forge-spec        →  features/{slug}/spec.md         (Status: Draft)
  /forge-tasks       →  features/{slug}/tasks.md
  /forge-contract    →  contracts/{module}/{slug}.yaml   (Status: Ready)
        │
        │  git push  →  module repos: git submodule update --remote specs
        ▼
MODULE REPO
  /forge-init                      (once)
  /forge-implement {slug}          implement this module's (or submodule's) tasks
  /forge-contract-test             verify against the contract
  /forge-done {slug}               commit message
        │
        ▼
SPEC REPO
  /forge-close {slug} {module}     tick tasks; when all done → Status: Done, CHANGELOG updated
        │
        ▼
  module repos: git submodule update --remote specs   (sync task status)
```

Each phase has a confirmation gate — nothing is written until you approve it.

---

## Feature tracking

### `features/CHANGELOG.md`

A persistent, ordered record of all features — updated automatically by skills.
Modelled on Liquibase migrations: sequence matters, dependencies are explicit.

```markdown
| # | Slug              | Description                  | Status       | Modules                    | Depends on |
|---|-------------------|------------------------------|--------------|----------------------------|------------|
| 1 | user-auth         | User sign-up & verification  | Done         | user-service, admin        | —          |
| 2 | org-management    | Create and manage orgs       | Ready        | user-service, admin        | #1         |
| 3 | team-invitations  | Invite users to an org       | Implementing | user-service, portal, admin| #2         |
| 4 | audit-log         | Track all user actions       | Draft        | user-service               | #2         |
```

**Status lifecycle:** `Brainstormed → Draft → Ready → Implementing → Done`

| Skill | CHANGELOG action |
|-------|-----------------|
| `/forge-brainstorm` | Appends row, assigns `#`, records `Depends on` |
| `/forge-spec` | Updates `Modules` + advances status to `Draft` |
| `/forge-contract` | Advances status to `Ready` |
| `/forge-close` | Advances status to `Done` (when all modules complete) |

### `/forge-status` — ordered dashboard

Reads `CHANGELOG.md` for ordering, derives live detail from actual files, and flags
dependencies that aren't done yet with ⚠️.

```
Feature Status — my-platform
══════════════════════════════════════════════════════════════════
 #   Slug               Status          Modules              Depends on
──────────────────────────────────────────────────────────────────
 1   user-auth          ✅ Done          user-service          —
 2   org-management     🟠 Open          user-service, admin   #1
 3   team-invitations   🔵 Brainstormed  —                     #2 ⚠️ not done yet
══════════════════════════════════════════════════════════════════
3 features  ·  1 done  ·  1 in planning  ·  1 open
```

---

## File layout (spec repo)

```
.forge/
  project.json          ← modules, submodules, spec repo URL

features/
  CHANGELOG.md          ← ordered feature list with status and dependencies
  {slug}/
    brainstorm.md       ← approved brainstorm summary
    spec.md             ← requirements, actors, data model, flows, API list
    tasks.md            ← per-module task breakdown with checkboxes

contracts/
  {module}/             ← standalone module or submodule (flat — same path either way)
    {slug}.yaml         ← main contract: paths + $refs only
    schemas/            ← one file per request/response/enum object
    shared/             ← api-error.yaml, pagination-meta.yaml (reused across features)
```

Submodule contracts live at `contracts/{submodule}/` — not `contracts/{module}/{submodule}/`.
This means a submodule promoted to its own repo needs zero contract path changes.

---

## Task headings

Tasks in `tasks.md` use a flat `### {name}` heading for both modules and submodules:

```markdown
### user-service (backend)
- [ ] TASK-1 [api] POST /users/register

### admin (frontend)          ← submodule of webapps, headed by its own name
- [ ] TASK-2 [ui] Registration form
```

A submodule promoted to its own repo needs no changes to any `tasks.md` file.

---

## Working with existing documents

`/forge-brainstorm` accepts content from Confluence pages, Google Docs, or any design
document. Paste the content at the start — the skill extracts what's covered, asks only
about genuine gaps, then runs its challenge and approach steps before writing `brainstorm.md`.

---

## Key rules

- **Contract is the source of truth.** Never change a contract to fix a failing test — fix the code.
- **Never skip phases.** brainstorm → spec → tasks → contract, in order.
- **Names must match exactly.** `module.name` in `project.json` must match `module` in `module.json`. Submodule names must be unique across the whole project.
- **Submodules share their parent's repo.** No `repo` field on submodules; no `port` on the parent.
- **Run `git submodule update --remote specs`** before starting a feature, and after `/forge-close`.
- **Check `Depends on` in CHANGELOG.md** before starting a feature — don't begin work on a feature whose dependency isn't Done yet.
