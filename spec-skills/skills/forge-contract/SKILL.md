---
name: "forge-contract"
description: "Phase 4 of 4. Researches existing contracts for patterns, clarifies ambiguous API design decisions, challenges against REST best practices, then generates a multi-file Specmatic-compatible OpenAPI 3.0 contract on confirmation."
argument-hint: "Feature slug (e.g. 'user-registration')"
compatibility: "Requires spec repo with .forge/project.json, features/{slug}/spec.md, and features/{slug}/tasks.md"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-contract/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Contract

Phase 4 of 4. Understand the API design fully before writing any YAML.
Research existing contracts, surface ambiguities, challenge against best practices —
then generate a contract that implementors and consumers can trust.

<HARD-GATE>
Do NOT write any contract files until you have presented a contract outline
and the user has explicitly confirmed it.
</HARD-GATE>

---

## Pre-check

- Feature slug from $ARGUMENTS, or ask: "Which feature do you want to generate a contract for?"
- Read `features/{slug}/spec.md` — must exist, otherwise stop.
- Read `features/{slug}/tasks.md` — must exist, otherwise say "Run `/forge-tasks {slug}` first."
- Read `.forge/project.json` — build a flat list of **contract targets**:
  - Module with no submodules → target name = `{module.name}`, contract path = `contracts/{module.name}/`
  - Module with submodules → target name = each `{submodule.name}`, contract path = `contracts/{submodule.name}/`
  - Submodules use their own name as the target — identical to a standalone module — so they can be
    promoted to a separate repo later with no contract path changes.

---

## Step 1 — Research Context

Before asking anything, research silently:

1. **Existing contracts for this module** — scan `contracts/{module}/` for existing YAML files.
   Note: field naming convention (camelCase vs snake_case), URL prefix, existing shared schemas,
   existing error format, auth patterns, pagination shape.

2. **Shared schemas** — does `contracts/{module}/shared/` exist with `api-error.yaml`,
   `pagination-meta.yaml`, or other reusables? If yes, `$ref` to them — do not redefine.

3. **Other module contracts in this feature** — any sibling modules with contracts already written?
   Note shared data models for consistency.

4. **Related feature contracts** — earlier features for the same module with schemas to extend
   (e.g. an existing `UserResponse` that this feature adds fields to).

5. **Spec API endpoint list** — extract every endpoint from `spec.md` API Endpoints table.

6. **Tasks** — extract `[api]` tagged tasks per backend module from `tasks.md`.

Report findings:

> "Here's what I found:
> - Existing contracts: {files or 'none yet'}
> - Shared schemas available: {list or 'none — will create'}
> - Reusable schemas: {e.g. 'UserResponse in user-auth.yaml' or 'none'}
> - Endpoints to contract: {list}
> - Convention: {camelCase/snake_case, /api/v1/ prefix, etc.}
> - Conflicts: {any mismatch or 'none'}"

---

## Step 2 — Clarifying Questions (one at a time)

Ask ONE question at a time. Only ask about genuine ambiguities not answered by spec or existing contracts.

- **HTTP method** — PUT (full replace) or PATCH (partial update)? POST with server ID or PUT with client ID?
- **Sync vs async** — immediate result (201) or acknowledged and processed later (202)?
- **Pagination** — which list endpoints need it? page+size, cursor, or offset?
- **Field types** — IDs: UUID or string? Dates: date-time or date? Enum values?
- **Required vs optional** — which request fields are mandatory?
- **Auth scope** — all endpoints require bearer, or are some public?
- **Error cases** — 403 Forbidden distinct from 401? 409 Conflict needed? 422 for business rules?

Use the research flag for anything needing external investigation:
> "🔍 **Research needed:** {what's unclear}. (a) pause, (b) assume, or (c) flag and move on?"

Skip if all decisions are clear.

---

## Step 3 — Challenge Round

Flag at least 2 best-practice concerns specific to this feature before drafting:

> "Before the outline, a couple of things to flag:
>
> **[Concern 1]:** {e.g. 'The spec says GET /users — list endpoints need pagination.
> Should I add page+size query params and a paginated response wrapper?'}
>
> **[Concern 2]:** {e.g. 'The spec says "update user" — is this a full replace (PUT)
> or partial update (PATCH)? PATCH is safer for partial updates and what the spec implies.'}
>
> How should these be handled?"

Wait for resolution before the outline.

---

## Step 4 — Contract Outline & Gate

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract Outline: {feature-slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module: {module}  Port: {port}

FILES TO GENERATE
  contracts/{module}/{slug}.yaml        ← main contract
  contracts/{module}/schemas/
    create-{resource}-request.yaml
    update-{resource}-request.yaml      ← if update endpoint
    {resource}-response.yaml            ← for GET single
    {resource}-summary.yaml             ← for GET list items
    {resource}-reference.yaml           ← for POST 201 response
    enums/{resource}-status.yaml        ← if status/type enum
  contracts/{module}/shared/            ← create if not exists
    api-error.yaml
    api-error-detail.yaml
    pagination-meta.yaml                ← if list endpoint

ENDPOINTS
  POST /api/v1/{resources}
    Auth: bearer
    Request:  Create{Resource}Request (no id, no timestamps)
    201:      {Resource}Reference (id: uuid only)
    400:      ApiError (with details[])
    401:      ApiError
    409:      ApiError  ← if duplicate possible

  GET /api/v1/{resources}
    Auth: bearer
    Query: page: int, size: int, sort: string, order: asc|desc
    200:  { data: {Resource}Summary[], pagination: PaginationMeta }
    401:  ApiError

  GET /api/v1/{resources}/{id}
    Auth: bearer
    200:  {Resource}Response (full object)
    401:  ApiError
    404:  ApiError

  PATCH /api/v1/{resources}/{id}
    Auth: bearer
    Request: Update{Resource}Request (all fields optional)
    204:  (no body)
    400:  ApiError (with details[])
    401:  ApiError
    403:  ApiError  ← if ownership check
    404:  ApiError

  DELETE /api/v1/{resources}/{id}
    Auth: bearer
    204:  (no body)
    401:  ApiError
    403:  ApiError
    404:  ApiError

ASSUMPTIONS
  - {any recorded assumption}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> "Does this outline look right? Say **yes** to generate, or tell me what to change."

---

## Step 5 — Generate the contract files

Now read both reference files in this skill's folder:
- `reference/best-practices.md` — schema segregation, HTTP methods, status codes, the
  `ApiError` / `ApiErrorDetail` / `PaginationMeta` shared schemas, enum rules, naming conventions
- `reference/contract-template.yaml` — the main-contract skeleton (paths + `components/responses`)

Then generate every file from the approved outline:
1. The main contract `contracts/{module}/{slug}.yaml` — use the template skeleton, keeping only
   `info` + `paths` + `$ref`s (no inline schemas).
2. One file per schema under `schemas/` (and `schemas/enums/` for enums), per the segregation table.
3. The `shared/` files (`api-error.yaml`, `api-error-detail.yaml`, `pagination-meta.yaml`) —
   only if they don't already exist for this module (reuse if present, per Step 1 research).

Apply every rule in `best-practices.md`. Hard requirements:
- Every endpoint has at least one `examples` block (Specmatic needs them for stubs)
- `operationId` unique across the file; relative `$ref` paths only
- Match the field naming convention found in Step 1 (camelCase vs snake_case)
- Create endpoint → 201 + `Location` header + `{Resource}Reference` (id only); update/delete → 204 no body

---

## Step 6 — Update spec.md

Update the API Endpoints table in `features/{slug}/spec.md`:

```markdown
| POST   | /api/v1/{resources}      | {module} | [contract](../../contracts/{module}/{slug}.yaml) |
| GET    | /api/v1/{resources}      | {module} | [contract](../../contracts/{module}/{slug}.yaml) |
| GET    | /api/v1/{resources}/{id} | {module} | [contract](../../contracts/{module}/{slug}.yaml) |
| PATCH  | /api/v1/{resources}/{id} | {module} | [contract](../../contracts/{module}/{slug}.yaml) |
| DELETE | /api/v1/{resources}/{id} | {module} | [contract](../../contracts/{module}/{slug}.yaml) |
```

Also advance the spec status: change the `**Status:**` line in `features/{slug}/spec.md`
from `Draft` to `Ready` (planning complete — ready for implementation).

Update `features/CHANGELOG.md`: find the row for `{slug}` and set `Status` → `Ready`.

---

## Step 7 — Completion

> "Done. Feature `{slug}` contracts generated:
>
> contracts/{module}/
>   {slug}.yaml
>   schemas/  ({n} schema files)
>   shared/   (api-error, pagination-meta)
>
> Run `/forge-implement {slug}` in each module repo to start implementation."
