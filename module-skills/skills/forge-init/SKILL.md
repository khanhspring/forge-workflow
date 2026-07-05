---
name: "forge-init"
description: "One-time initialization for a Forge module repo (backend or frontend). Researches existing repo state, then walks through setup conversationally one question at a time before writing any files."
argument-hint: "Optional: module name to skip the first prompt"
compatibility: "Run once in a module repo before any other forge skills. Safe to re-run — never overwrites existing files."
when_to_use: >
  ALWAYS activate when any of the following occur:
  - User says init, initialize, setup, set up, bootstrap, configure + repo/forge/project
  - User says "set this up", "get this started", "prepare this repo"
  - No .forge/module.json exists AND user wants to start implementing specs
  - User says "this is a new module repo" (or "service repo" / "code repo") or "add forge to this project"
  Do NOT activate if .forge/module.json already exists — repo is already initialized.
metadata:
  author: "forge-workflow"
  source: "module-skills/forge-init/SKILL.md"
user-invocable: true
disable-model-invocation: false
---

# Forge Init — Module Repo

Initialize this repo as a Forge module repo. It may contain one module (a dedicated service or
app) or multiple modules sharing the same repo to reduce overhead (a monorepo). Either way,
research first, then ask one question at a time before writing anything.

## Pre-check
If `.forge/module.json` already exists → say "Module repo already initialized." and stop.

---

## Step 1 — Research existing repo state

Before asking anything, silently scan the repo and note:

1. **Stack detection** — does `pom.xml`, `build.gradle`, `package.json`, `go.mod`, `requirements.txt`, or similar exist? What versions are declared?
2. **Port detection** — is a port configured in `application.yml`, `application.properties`, `.env`, `.env.example`, or `docker-compose.yml`?
3. **Specs submodule** — does `specs/` already exist as a directory or submodule?
4. **CI** — does `.github/workflows/` already exist? Any contract test workflow present?
5. **Existing CLAUDE.md** — already has project context written?
6. **Monorepo signals** — does `nx.json`, `turbo.json`, `lerna.json`, `pnpm-workspace.yaml`, or
   a `workspaces` key in `package.json` exist? Is there an `apps/` or `packages/` directory with
   multiple sub-directories each containing their own `package.json`, `pom.xml`, etc.?
   If yes, list the detected sub-apps (directory names).

Report findings before asking anything:

> "Here's what I found in this repo:
> - Stack: {detected stack — or 'not detected'}
> - Port: {detected port — or 'not found in config'}
> - specs/ submodule: {exists / not present}
> - GitHub Actions: {exists / not present}
> {if monorepo signals}: - Looks like a monorepo — detected sub-apps: {list of dir names}
>
> I'll use these as defaults — just confirm or correct as we go."

**If monorepo/multi-module signals were found**, ask immediately after the report:
> "This looks like a module with submodules ({names}).
> Should I configure them as submodules so each gets its own tasks and contracts? (yes / no)"

If yes → collect submodule details in Step 2-B before the main questions.
If no → proceed as a single module.

---

## Step 2-B — Submodule collection (only when confirmed)

Submodules share the parent module's repo — they are not separate repos.
Collect them one at a time. Pre-fill from what was detected and ask the user to confirm or correct:

- "Submodule name? _(Must match a `name` under this module's `submodules` in the spec repo's `project.json`; default: `{detected-dir-name}`)_"
- "Type? (backend / frontend / worker)"
- "Stack? (detected: {stack-if-found} — or enter manually)"
- "Port? _(each submodule has its own port — detected: {port-if-found})_"
- "Path within this repo? (default: `{detected-path}`)"

Confirm: "`{sub}` — {type} — {stack} — :{port} — {path}. Another submodule? (yes / no)"

**Rules enforced here:**
- Submodules have no `repo` field — they are in the same repo as the parent module
- Port is collected per submodule; the parent module has no `port`

After collecting all submodules, continue to Step 2 (Q4 port will be skipped automatically).

---

## Step 2 — Questions (one at a time)

Ask one question per message. Wait for the answer before asking the next.
Where research already gives a confident answer, present it as a default to confirm
rather than asking from scratch.

**Q1 — Module name** _(skip if Step 2-B was run)_
> "What's the module name for this repo?
> _(Must exactly match a `name` entry in the spec repo's `.forge/project.json`)_"

Do not suggest a default — module names must be exact matches. Warn clearly:
> "This name must match exactly. A mismatch will break `/forge-implement` and `/forge-done`."

**Q2 — Module description**
> "What does this module do? (one sentence)"

**Q3 — Spec repo URL**

If `specs/` already exists:
> "I see a `specs/` directory already — is that the spec repo submodule? (yes/no)
> If yes, what's the remote URL? (run `git remote -v` in `specs/` if unsure)"

If not:
> "What's the spec repo URL? (it will be added as a git submodule at `specs/`)"

**Q4 — Port** _(skip entirely if Step 2-B was run — port belongs to each submodule, not the module)_

If port was detected in Step 1:
> "I found port `{port}` in your config — is that the right local dev port? (yes / enter different port)"

If not detected:
> "What port does this module run on locally?"

**Q5 — Tech stack**

If stack was detected in Step 1:
> "Looks like this is a `{detected stack}` module — is that right? Anything to add?"

If not detected:
> "What's the tech stack? (e.g. 'Spring Boot 3, Java 21' or 'React, TypeScript')"

**Q6 — Principles**
> "What are the key architectural principles for this module?
> _(e.g. 'stateless', 'no business logic in controllers', 'repository pattern for DB access')
> Say 'none yet' to skip._"

**Q7 — Conventions**
> "Any coding conventions the team follows in this repo?
> _(e.g. 'constructor injection only', 'all public methods must have unit tests', 'no magic strings')
> Say 'none yet' to skip._"

**Q8 — Never**
> "Anything developers should never do in this codebase?
> _(e.g. 'no direct DB calls from the API layer', 'never change a contract to fix a failing test')
> Say 'none yet' to skip._"

**Q9 — GitHub Actions CI**

If `.github/workflows/` already exists with a contract test:
> "I see a CI workflow already exists — skip adding another? (yes to skip)"

If not present:
> "Add a GitHub Actions contract test workflow? (yes/no)"
> _(Backend modules that serve an API benefit most; a frontend that only consumes can skip.)_

---

## Step 3 — Preview & gate

Show a full preview of everything that will be created or run:

```
Ready to initialize. Here's what I'll do:

{if specs/ not present}
  git submodule add {spec-repo-url} specs
  git submodule update --init --recursive

.forge/module.json
  {if single app}
  module:        {module-name}
  test_base_url: http://localhost:{port}
  contract_glob: specs/contracts/{module-name}/*.yaml
  {if submodules}
  submodules:
    {sub-name}  path:{path}  :{port}  contract: specs/contracts/{sub-name}/*.yaml
    ...

CLAUDE.md
  Module:       {module-name}
  Description:  {description}
  Stack:        {stack}  Port: {port}
  Principles:   {list or "none yet"}
  Conventions:  {list or "none yet"}
  Never:        {list or "none yet"}

{if yes} .github/workflows/contract-test.yml
.gitignore  ← append Forge entries
```

End with:
> "Does this look right? Say **yes** to initialize, or tell me what to change."

Wait for confirmation. Do not write files or run git commands before the user says yes.

---

## Step 4 — Write files

Run (if specs/ not already present):
```bash
git submodule add {spec-repo-url} specs
git submodule update --init --recursive
```

Write `.forge/module.json`:

**For a single-app module** (no sub-apps):
```json
{
  "module": "{module-name}",
  "spec_submodule_path": "specs",
  "specmatic_version": "2.x",
  "test_base_url": "http://localhost:{port}",
  "contract_glob": "specs/contracts/{module-name}/*.yaml"
}
```

**Module with submodules** — no top-level `port` or `test_base_url`; each submodule owns those.
Submodules have no `repo` field — they are in the same repo as the parent module:
```json
{
  "module": "{module-name}",
  "spec_submodule_path": "specs",
  "specmatic_version": "2.x",
  "submodules": [
    {
      "name": "{sub-name}",
      "path": "{relative-path}",
      "test_base_url": "http://localhost:{port}",
      "contract_glob": "specs/contracts/{sub-name}/*.yaml"
    }
  ]
}
```

Write `CLAUDE.md`:
```markdown
# {module-name}

{description}

_(Single app: show Stack + Port inline. Monorepo: replace with a table.)_

**Stack:** {stack}  **Port:** {port}

— or for a monorepo —

| Module | Stack | Port | Path |
|--------|-------|------|------|
| {name} | {stack} | {port} | {path} |

## Forge Workflow
1. `/forge-tasks`         — see all pending tasks for this repo's module(s)
2. `/forge-implement`     — implement a feature task by task
3. `/forge-contract-test` — run Specmatic contract tests
4. `/forge-done`          — confirm tasks done + generate commit message
5. (then in the spec repo) `/forge-close {slug} {module}` — mark tasks done there

## Spec repo
Linked via git submodule at `specs/`.
Run `git submodule update --remote specs` before starting a new feature,
and again after `/forge-close` is run in the spec repo to sync task status.
Project-wide domain context (actors, glossary, principles) lives at `specs/CONTEXT.md`
— read it before implementing.

## Principles
{list each as a bullet — or "None defined yet."}

## Conventions
{list each as a bullet — or "None defined yet."}

## Never
{list each as a bullet — or "None defined yet."}
```

If GitHub Actions was requested, write `.github/workflows/contract-test.yml`:
```yaml
name: Contract Tests
on: [push, pull_request]
jobs:
  contract-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - name: Run contract tests
        run: |
          specmatic test \
            --contract "specs/contracts/{module-name}/*.yaml" \
            --testBaseURL ${{ env.SERVICE_URL }}
```

Append to `.gitignore` if not present:
```
# Forge
.forge/secrets
```

Run `git status` and confirm:
> "Module repo initialized. Run `/forge-tasks` to see what needs to be built."

---

## Rules
- One question per message — never ask multiple questions at once
- Never write files or run git commands before the user says yes in Step 3
- Never overwrite existing files
- All written files must be complete — no unfilled placeholders
- `module` in module.json must exactly match the name in the spec repo's project.json
- **Extract, don't re-ask**: if the user's answer contains information for upcoming fields
  (e.g. "it's a NestJS app on port 3000 at apps/auth-ui"), extract and fill those fields
  silently — only ask about what is genuinely missing. Never ask a question the user has
  already answered, even indirectly.
- If the user provides multiple answers in one message, accept them gracefully and move forward
