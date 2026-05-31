# Contract Best Practices

Conventions to enforce when generating Specmatic OpenAPI 3.0 contracts.
Read this together with `contract-template.yaml` (the skeleton).

## File structure

```
contracts/
  {module}/
    {feature-slug}.yaml          ← main file: info + paths + $refs only
    schemas/
      create-{resource}-request.yaml
      update-{resource}-request.yaml
      {resource}-response.yaml
      {resource}-summary.yaml
      {resource}-reference.yaml
      enums/
        {resource}-status.yaml   ← one file per enum
    shared/                      ← shared across all features in this module
      api-error.yaml
      api-error-detail.yaml
      pagination-meta.yaml
```

The main contract file contains only `info`, `servers`, `security`, `paths`, and
`components` with `$ref` entries pointing to the schema files.
Never inline a complex schema in the main file.

## Schema segregation — never reuse if even one field differs

| Schema | Purpose | Rules |
|--------|---------|-------|
| `Create{Resource}Request` | POST body | No `id`, no `createdAt`/`updatedAt`. Only fields the client sets. Required fields required. |
| `Update{Resource}Request` | PATCH body | All fields optional. No `id`, no timestamps. At least one field must be present (use `minProperties: 1`). |
| `Replace{Resource}Request` | PUT body | Required fields required. No `id`, no timestamps. |
| `{Resource}Response` | GET single | Full object. All server-set fields included (`id`, timestamps). |
| `{Resource}Summary` | GET list item | Lightweight — key fields only (id, name, status, createdAt). No nested objects. |
| `{Resource}Reference` | POST 201 body | Minimal reference: `id` (uuid) only. Optionally add `href` (the resource URL). |

## HTTP method rules

| Operation | Method | Path |
|-----------|--------|------|
| Create resource | `POST` | `/api/v1/{resources}` |
| Get single | `GET` | `/api/v1/{resources}/{id}` |
| Get list | `GET` | `/api/v1/{resources}` |
| Partial update | `PATCH` | `/api/v1/{resources}/{id}` |
| Full replace | `PUT` | `/api/v1/{resources}/{id}` |
| Delete | `DELETE` | `/api/v1/{resources}/{id}` |
| Custom action | `POST` | `/api/v1/{resources}/{id}/{action}` |

- Never use `GET` to mutate state
- Never put verbs in resource paths (`/deactivateUser` ❌ → `POST /users/{id}/deactivation` ✅)
- Max 2 nesting levels: `/users/{userId}/addresses/{addressId}` MAX
- Custom actions as sub-resource nouns: `/activation`, `/suspension`, `/password-reset`

## URL path rules

- Plural nouns: `/users` not `/user`
- Kebab-case for multi-word segments: `/user-profiles`, `/order-items`
- Version prefix: `/api/v1/`
- No trailing slashes
- IDs always in path, not query string, when addressing a specific resource
- UUIDs only — never expose sequential integer IDs in paths

## Status code rules

| Case | Code |
|------|------|
| Successful GET | `200 OK` |
| Successful POST (resource created) | `201 Created` |
| Async operation accepted | `202 Accepted` |
| Successful PATCH / PUT / DELETE (no body) | `204 No Content` |
| Validation failure (client fixable) | `400 Bad Request` |
| Not authenticated (missing/invalid token) | `401 Unauthorized` |
| Authenticated but not authorized | `403 Forbidden` |
| Resource not found | `404 Not Found` |
| Duplicate / state conflict | `409 Conflict` |
| Business rule violation (semantically invalid) | `422 Unprocessable Entity` |
| Rate limit exceeded | `429 Too Many Requests` |
| Unexpected server error | `500 Internal Server Error` |

## Consistent error object

All error responses across all endpoints use `ApiError`.
Never define a custom error shape per endpoint.

**`shared/api-error.yaml`:**
```yaml
type: object
required: [code, message, traceId]
properties:
  code:
    type: string
    description: "Machine-readable error code (SCREAMING_SNAKE_CASE)"
    example: "VALIDATION_ERROR"
  message:
    type: string
    description: "Human-readable summary"
    example: "Validation failed for 1 field(s)"
  traceId:
    type: string
    format: uuid
    description: "Unique request trace ID for debugging and support"
    example: "123e4567-e89b-12d3-a456-426614174000"
  details:
    type: array
    description: "Field-level errors — present on 400, omitted otherwise"
    items:
      $ref: "./api-error-detail.yaml"
```

**`shared/api-error-detail.yaml`:**
```yaml
type: object
required: [field, code, message]
properties:
  field:
    type: string
    description: "JSON path to the invalid field"
    example: "email"
  code:
    type: string
    description: "Field-level error code"
    example: "INVALID_FORMAT"
  message:
    type: string
    description: "What is wrong and how to fix it"
    example: "Must be a valid email address"
```

**Common error codes to use consistently:**

| Code | When |
|------|------|
| `VALIDATION_ERROR` | 400 — one or more fields invalid (use with `details[]`) |
| `INVALID_FORMAT` | 400 — field detail: wrong format |
| `REQUIRED_FIELD` | 400 — field detail: missing required field |
| `INVALID_VALUE` | 400 — field detail: value not in allowed set |
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `ALREADY_EXISTS` | 409 — duplicate |
| `STATE_CONFLICT` | 409 — operation not valid in current state |
| `BUSINESS_RULE_VIOLATION` | 422 — semantically invalid |
| `RATE_LIMIT_EXCEEDED` | 429 |
| `INTERNAL_ERROR` | 500 |

## Enum rules

- Every enum is a separate file under `schemas/enums/`
- Values in SCREAMING_SNAKE_CASE: `ACTIVE`, `PENDING_VERIFICATION`, `SOFT_DELETED`
- Always `$ref` to the enum file — never inline enum values
- Include a `description` on the enum schema and on each value via `x-enum-descriptions`

**Example `schemas/enums/user-status.yaml`:**
```yaml
type: string
description: "Lifecycle status of a user account"
enum:
  - ACTIVE
  - PENDING_VERIFICATION
  - SUSPENDED
  - DELETED
x-enum-descriptions:
  ACTIVE: "Account is active and can log in"
  PENDING_VERIFICATION: "Email not yet verified"
  SUSPENDED: "Account suspended by admin"
  DELETED: "Soft-deleted, not visible to users"
example: "ACTIVE"
```

## Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| Schema names | PascalCase | `CreateUserRequest`, `UserResponse` |
| Properties | camelCase | `firstName`, `createdAt`, `isActive` |
| Enum values | SCREAMING_SNAKE_CASE | `PENDING_VERIFICATION` |
| Operation IDs | camelCase verb+noun | `createUser`, `listUsers`, `getUserById` |
| File names | kebab-case | `create-user-request.yaml` |
| Error codes | SCREAMING_SNAKE_CASE | `VALIDATION_ERROR` |

## Additional rules

- Never return `null` fields — omit absent optional fields from responses
- IDs are always `type: string, format: uuid` — never integer
- Dates always `type: string, format: date-time` (ISO 8601 with timezone)
- List endpoints always support `page` (int, default 1), `size` (int, default 20, max 100)
- List responses always include `PaginationMeta`: `page`, `size`, `total`, `totalPages`
- POST 201 response includes `Location` header pointing to the created resource URL

**`shared/pagination-meta.yaml`:**
```yaml
type: object
required: [page, size, total, totalPages]
properties:
  page:
    type: integer
    description: "Current page (1-based)"
    example: 1
  size:
    type: integer
    description: "Items per page"
    example: 20
  total:
    type: integer
    description: "Total number of items"
    example: 142
  totalPages:
    type: integer
    description: "Total number of pages"
    example: 8
```

## Specmatic rules

- Every endpoint MUST have at least one `examples` block — Specmatic uses these for stubs
- `operationId` must be unique across the entire file
- Include `format` for every applicable property: `uuid`, `date`, `date-time`, `email`, `uri`
- One main contract file per module per feature — never one file per endpoint
- All `$ref` paths must be relative (e.g. `./schemas/user-response.yaml`, `../shared/api-error.yaml`)
