---
name: "forge-implement"
description: "Researches existing codebase patterns, clears ambiguities one at a time, challenges implementation concerns, then guides task-by-task implementation scoped to this module. No code written until plan is confirmed."
argument-hint: "Feature slug (e.g. 'user-registration')"
compatibility: "Requires module repo with .forge/module.json and an initialized specs/ git submodule"
metadata:
  author: "forge-workflow"
  source: "module-skills/forge-implement/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Implement

Understand the feature fully before writing a single line of code. Research existing
patterns, surface ambiguities, flag conflicts — then implement with confidence.

<HARD-GATE>
Do NOT write any code, create any files, or modify any existing files until you have
presented the Implementation Plan and the user has explicitly confirmed it.
</HARD-GATE>

---

## Pre-check

- Read `.forge/module.json` — if missing, say "Run `/forge-init` to set up this module repo first."
- Get `spec_submodule_path` from module.json.
- **Determine working scope:**
  - `module.json` has no `submodules` → scope = the module itself; use top-level `test_base_url` and `contract_glob`.
  - `module.json` has `submodules[]` → ask "Which submodule are you implementing? ({list submodule names})"
    then use that submodule's `path`, `test_base_url`, and `contract_glob`.
- Feature slug from $ARGUMENTS.
  - If empty, scan `{spec_submodule_path}/features/*/tasks.md` for `### {scope-name}` headings
    (module name for simple modules, submodule name for submodules), list features with pending
    tasks, ask which to implement.
- Check `git submodule status` — if specs/ is out of date, say:
  > "Your specs submodule may be out of date. Run `git submodule update --remote specs` first, or continue with the current version?"

---

## Step 1 — Load & Research Context

Load the feature documents silently:
- `{spec_submodule_path}/features/{slug}/spec.md` — requirements and flows
- `{spec_submodule_path}/features/{slug}/tasks.md` — task list for this module

If `tasks.md` is missing → stop: "No tasks found. Run `/forge-tasks {slug}` in the spec repo first."

**Determine which contract(s) apply to this scope:**
- The contract path is always `{spec_submodule_path}/contracts/{scope-name}/{slug}.yaml` where
  `{scope-name}` is the module name (for simple modules) or the submodule name (for submodules).
  Submodules use their own name — no parent prefix — so the path is identical to a standalone module.
- **If the contract exists** → this scope *provides* the API. Use it as the source of truth.
- **If it does NOT exist** (typical for frontend/consumer scopes) → scan
  `{spec_submodule_path}/contracts/*/{slug}.yaml` for sibling contracts. These are the APIs
  this scope *consumes*. Report:
  > "No contract for `{scope-name}` — consuming APIs from: {list providers}.
  > I'll use their contracts as the integration source of truth."
- If no contract exists anywhere for this feature → note it and continue with spec + tasks only.

Then research the existing codebase — do this before asking any questions:

1. **Read `CLAUDE.md`** — note architectural principles, conventions, and forbidden patterns.
2. **Find similar existing endpoints** — look for controllers/routes with similar patterns to what the contract defines. Note how they're structured.
3. **Find existing service/repository patterns** — how are services and data access layers organized in this codebase?
4. **Find existing test patterns** — how are unit and integration tests structured? What test utilities exist?
5. **Find existing error handling** — how does this service return errors? Does it match the `ApiError` schema (`shared/api-error.yaml`) in the contract — `code`, `message`, `traceId`, `details[]`?
6. **Find existing auth/middleware** — how is authentication enforced on existing endpoints?

Report findings before asking questions:

> "Before we start, here's what I found in the codebase:
> - Existing pattern: {e.g. 'Controllers use @RestController with @RequestMapping, services are injected via constructor'}
> - Test pattern: {e.g. 'Integration tests use @SpringBootTest with TestContainers'}
> - Error handling: {e.g. 'GlobalExceptionHandler returns ApiError with code + message + traceId — matches contract'}
> - Auth: {e.g. 'JwtAuthFilter applied to all /api/v1/** routes via SecurityConfig'}
> - Potential conflict: {any mismatch found — or 'None found'}
>
> I'll follow these patterns in the implementation."

---

## Step 2 — Clarifying Questions (one at a time)

Ask questions ONE at a time. Only ask about things that are genuinely ambiguous or
missing — do not ask about things already answered by the spec, contract, or codebase.

Areas to clarify if unclear:

- **Ambiguous acceptance criteria** — any task AC that could be implemented multiple ways
- **Missing dependencies** — e.g. "TASK-3 requires sending an email but I don't see an email service in the codebase — is this in scope or should it be stubbed?"
- **Conflicting patterns** — e.g. "The contract uses snake_case field names but all existing DTOs use camelCase — which should we follow?"
- **Task ordering** — if task dependencies aren't obvious from the task list
- **Data ownership** — if the feature touches data owned by another module, how should that be accessed?

If a question cannot be answered without research outside this conversation, use the
research flag pattern:

> "🔍 **Research needed:** {what needs to be found out — e.g. 'whether the payment service supports idempotency keys'}
> Want to (a) pause and check, (b) proceed with an assumption, or (c) flag it and move on?"

If all tasks and the contract are clear, skip this step and say so.

---

## Step 3 — Challenge Round

Before presenting the plan, flag at least 2 implementation concerns specific to what
you've read. These should be real conflicts or risks, not generic warnings.

> "Before I lay out the plan, a couple of things to flag:
>
> **[Concern 1]:** {e.g. 'The contract requires `createdAt` as date-time in the response,
> but the existing User entity doesn't have this field — we'll need to add it or compute it.
> Does that sound right?'}
>
> **[Concern 2]:** {e.g. 'TASK-2 (password hashing) and TASK-1 (register endpoint) are listed
> independently, but TASK-1 depends on TASK-2 being done first. I'll do TASK-2 first — agreed?'}
>
> How should these be handled?"

Wait for resolution before presenting the plan.

---

## Step 4 — Implementation Plan & Gate

Present the full plan and wait for confirmation before writing any code:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implementation Plan: {Feature Name}
Module: {module}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASKS (in order)
  1. TASK-2 [feat] Password hashing + validation
     → {implementation approach}
  2. TASK-1 [api]  POST /users/register endpoint
     → {implementation approach, files to touch}
  3. TASK-3 [test] Unit tests for UserService
     → {what will be tested}

KEY DECISIONS
  - {pattern chosen and why, e.g. 'Following existing constructor injection pattern'}
  - {any assumption recorded}

FILES TO TOUCH
  - {file path} — {what changes}
  - {file path} — {what changes}

CONTRACT  ({provide | consume})
  {METHOD} {path} — {key fields to implement, or to send/expect when consuming}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End with:
> "Does this plan look right? Say **yes** to start, or tell me what to change."

Do NOT write any code until the user confirms.

---

## Step 5 — Implement Task by Task

Work through tasks in the agreed order. For each task:

- State which task you're starting: "Starting TASK-2: {title}"
- Use the contract YAML for exact field names, types, and response shapes
- Follow the patterns found in Step 1 — no new patterns unless discussed
- Write tests alongside the implementation, not after
- When a task is done, confirm: "TASK-2 done. Moving to TASK-1 — ready?"

If a new ambiguity surfaces mid-implementation:
> "Unexpected: {what came up}. I'd suggest {option A} or {option B}. Which do you prefer?"
Wait for the answer before continuing.

---

## Rules
- Contract is the source of truth for API shape — never change it to fix a failing test
- When **providing** an API: match the contract's request/response exactly
- When **consuming** an API (frontend/client): send requests and parse responses exactly as the
  consumed contract defines — treat its shapes as fixed, code defensively against its error responses
- If the contract looks wrong: "This looks like a contract issue — raise a PR in the spec repo"
- Only implement tasks under `### {scope-name}` in tasks.md (module name or submodule name) — flag any cross-scope work
- Follow existing codebase patterns found in Step 1 — consistency over personal preference
- No code before the user confirms the plan in Step 4

## Parallel FE+BE Flow (mention when relevant)
If a consumer module needs the API before the provider has built it:
> "The provider's contract at `specs/contracts/{backend-module}/{slug}.yaml` fully defines the
> API — you can build and test against it (e.g. a stub server) before the backend is ready."
