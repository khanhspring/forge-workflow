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
3. **Specs link** — does `specs/` already exist? If so, determine how: a git submodule
   (check `.gitmodules` / `git submodule status`) or a junction/symlink (check if it's a
   reparse point / symlink, e.g. `git submodule status` reports nothing but the dir exists).
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
> - specs/: {not present / exists — git submodule / exists — junction or symlink}
> - GitHub Actions: {exists / not present}
> {if monorepo signals}: - Looks like a monorepo — detected sub-apps: {list of dir names}
>
> I'll use these as defaults — just confirm or correct as we go."

**If monorepo/multi-module signals were found**, note it in passing — no question needed:
> "This looks like a module with submodules ({names}). Submodule structure (ports, stack,
> paths) lives in the spec repo's `project.json`, not here — I'll cross-check against that
> once `specs/` is linked."

Submodule structure is never collected or stored in this repo's `.forge/module.json`. It's
configured once in the spec repo via `/forge-config` there, and every module skill reads it
from `specs/.forge/project.json` at runtime. This repo only needs to know its own module name.

---

## Step 2 — Questions (one at a time)

Ask one question per message. Wait for the answer before asking the next.
Where research already gives a confident answer, present it as a default to confirm
rather than asking from scratch.

**Q1 — Module name**
> "What's the module name for this repo?
> _(Must exactly match a `name` entry in the spec repo's `.forge/project.json`)_"

Do not suggest a default — module names must be exact matches. Warn clearly:
> "This name must match exactly. A mismatch will break `/forge-implement` and `/forge-done`."

If `specs/` was already detected in Step 1 (already linked), read
`{specs-path}/.forge/project.json` now and find the `modules[]` entry where `name` matches
this answer. If found, silently keep its `port`, `stack`, `type`, and `submodules[]` (if any)
for use in the Step 3 preview and the CLAUDE.md content written in Step 4 — do not re-ask for
any of it. If not found, note it and continue: "Heads up — `{module}` isn't in the spec repo's
`project.json` yet. Add it there with `/forge-config`, or continue and I'll leave stack/port
as TBD in CLAUDE.md for now." If `specs/` isn't linked yet, this lookup happens later, in
Step 4, right after the link is created.

**Q2 — Module description**
> "What does this module do? (one sentence)"

**Q3 — Spec repo link**

If `specs/` already exists, confirm what was detected in Step 1 instead of asking from scratch:
- Detected as a git submodule → "I see `specs/` is already a git submodule — is that the spec
  repo? (yes/no). If yes, what's the remote URL? (run `git remote -v` in `specs/` if unsure)"
- Detected as a junction/symlink → "I see `specs/` is already a local junction/symlink — what
  local path does it point at? (confirm or correct)"
- Set `spec_link_type` accordingly and skip straight to Q4.

If `specs/` does not exist, ask how to link it:
> "How should this repo link to the spec repo?
> 1. **Git submodule** (default) — versioned and works across machines/CI, but needs
>    `git submodule update --remote specs` to sync after spec repo changes.
> 2. **Junction / local link** — for when the spec repo and this module repo live on the same
>    machine (solo/local dev). `specs/` always reflects the live folder, no sync command needed —
>    but it won't survive being cloned elsewhere or used in CI, and skips version pinning."

- **If git submodule (or no answer / "default")**:
  > "What's the spec repo URL? (it will be added as a git submodule at `specs/`)"
  Set `spec_link_type: "submodule"`.
- **If junction/local link**:
  > "What's the local path to the spec repo folder? (absolute path, e.g. `D:\Workspace\my-specs`
  > or `/home/me/my-specs`)"
  Set `spec_link_type: "junction"` and `spec_source_path` to the given absolute path.

Note: port, stack, and submodule structure are never asked here — they come from the spec
repo's `project.json` (looked up in Q1 if `specs/` already existed, or in Step 4 right after
linking otherwise). `.forge/module.json` doesn't store any of it either way.

**Q4 — Principles**
> "What are the key architectural principles for this module?
> _(e.g. 'stateless', 'no business logic in controllers', 'repository pattern for DB access')
> Say 'none yet' to skip._"

**Q5 — Conventions**
> "Any coding conventions the team follows in this repo?
> _(e.g. 'constructor injection only', 'all public methods must have unit tests', 'no magic strings')
> Say 'none yet' to skip._"

**Q6 — Never**
> "Anything developers should never do in this codebase?
> _(e.g. 'no direct DB calls from the API layer', 'never change a contract to fix a failing test')
> Say 'none yet' to skip._"

**Q7 — GitHub Actions CI**

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

{if specs/ not present, spec_link_type = submodule}
  git submodule add {spec-repo-url} specs
  git submodule update --init --recursive

{if specs/ not present, spec_link_type = junction}
  {Windows}  mklink /J specs "{spec-source-path}"
  {macOS/Linux}  ln -s "{spec-source-path}" specs
  append `specs/` to .gitignore  (junction contents aren't tracked by this repo)

.forge/module.json
  module:              {module-name}
  spec_submodule_path: specs
  spec_link_type:      {submodule | junction}
  {if junction} spec_source_path: {spec-source-path}

CLAUDE.md
  Module:       {module-name}
  Description:  {description}
  Stack/Port:   {from spec repo's project.json, or "TBD — set via /forge-config in the spec repo"}
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

Run (if specs/ not already present), based on the chosen `spec_link_type`:

**`submodule`:**
```bash
git submodule add {spec-repo-url} specs
git submodule update --init --recursive
```

**`junction`:**
```bash
# Windows
mklink /J specs "{spec-source-path}"
# macOS/Linux
ln -s "{spec-source-path}" specs
```
Then append `specs/` to `.gitignore` — a junction/symlink's contents belong to the spec repo,
not this one, and must not be tracked or committed here.

If the Q1 lookup didn't already happen (i.e. `specs/` was just created above, not already
present in Step 1), read `{spec_submodule_path}/.forge/project.json` now and find the
`modules[]` entry where `name` matches the module name from Q1. Use its `port`, `stack`, and
`submodules[]` (if any) to fill the CLAUDE.md content below. If the module still isn't found
there, write "TBD — set via `/forge-config` in the spec repo" for the stack/port line instead.

Write `.forge/module.json` — same shape whether or not the module has submodules in the spec
repo, since submodule structure is never duplicated here:
```json
{
  "module": "{module-name}",
  "spec_submodule_path": "specs",
  "spec_link_type": "submodule"
}
```
`spec_link_type` is `"submodule"` (default) or `"junction"`. When `"junction"`, also write
`"spec_source_path": "{absolute-local-path}"` so the link can be recreated if it's ever lost.

Write `CLAUDE.md`. `{stack}`/`{port}`/`{path}` below come from the spec repo's `project.json`
lookup above (or "TBD" if not found there yet) — never from a question asked in this skill:
```markdown
# {module-name}

{description}

_(Single app: show Stack + Port inline. Monorepo: replace with a table, one row per submodule
found in the spec repo's project.json.)_

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
_(submodule)_ Linked via git submodule at `specs/`.
Run `git submodule update --remote specs` before starting a new feature,
and again after `/forge-close` is run in the spec repo to sync task status.

_(junction)_ Linked via local junction/symlink at `specs/` → `{spec-source-path}`.
Always reflects the live spec repo folder — no sync command needed. This only works while
both repos are on the same machine; switch to a git submodule (`/forge-init` again, or
re-run link setup) before cloning this repo elsewhere or using it in CI.

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
- `module.json` never stores `port`, `stack`, or submodule structure — those live only in the
  spec repo's `project.json`; every module skill resolves them at runtime by reading
  `specs/.forge/project.json`
- **Extract, don't re-ask**: if the user's answer contains information for upcoming fields
  (e.g. "it's a NestJS app on port 3000 at apps/auth-ui"), extract and fill those fields
  silently — only ask about what is genuinely missing. Never ask a question the user has
  already answered, even indirectly.
- If the user provides multiple answers in one message, accept them gracefully and move forward
