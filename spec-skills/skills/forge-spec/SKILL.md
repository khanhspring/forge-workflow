---
name: "forge-spec"
description: "Phase 2 of 4. Researches existing specs for patterns, resolves brainstorm assumptions and open questions, challenges requirement gaps, then writes features/{slug}/spec.md on confirmation."
argument-hint: "Feature slug (e.g. 'user-registration')"
compatibility: "Requires spec repo with .forge/project.json and a completed forge-brainstorm (brainstorm.md on disk, or a summary in the current session)"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-spec/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Spec

Phase 2 of 4. Turn the brainstorm into a precise, unambiguous spec — no vague language,
no unresolved assumptions, every requirement testable.

<HARD-GATE>
Do NOT write `spec.md` until you have presented a spec outline and the user has
explicitly confirmed it. Do NOT add tasks or generate contracts at any point.
</HARD-GATE>

---

## Pre-check

- Find the brainstorm summary, in this order:
  1. A Brainstorm Summary in the current conversation, OR
  2. `features/{slug}/brainstorm.md` on disk (written by `/forge-brainstorm` after approval).
  If neither exists: "Run `/forge-brainstorm {slug}` first — the spec is written from the brainstorm summary."
- Read `.forge/project.json` for module list.
- Feature slug from $ARGUMENTS, or derive from the brainstorm slug.
- Check if `features/{slug}/spec.md` already exists.
  If yes: "A spec already exists for `{slug}`. Do you want to overwrite it? (yes/no)"

---

## Step 1 — Research Context

Before asking anything, research silently:

1. **Existing specs** — scan `features/*/spec.md` for:
   - REQ-N numbering style (do they restart at REQ-1 per feature, or is there a global counter?)
   - How Non-Functional requirements are typically written
   - Any related feature whose requirements this feature extends or depends on

2. **CLAUDE.md** — note project principles and conventions.
   Any principle that implies a requirement for this feature?
   (e.g. "API contract before implementation" → this feature needs a contract requirement)

3. **Brainstorm open items** — extract from the brainstorm summary:
   - Any item listed under **Open Questions** that wasn't resolved
   - Any item listed under **Assumptions** that needs to become an explicit requirement or be validated
   - Any item listed under **Research Needed** that is still pending

Report findings:

> "Before drafting, here's what I found:
> - Related features: {list or 'none'}
> - Unresolved from brainstorm: {open questions / assumptions — or 'none, all clear'}
> - CLAUDE.md principles that apply: {list or 'none'}
> - Naming convention: {e.g. 'REQ-N restarts per feature'}"

---

## Step 2 — Resolve Brainstorm Carry-overs (one at a time)

If any open questions or assumptions were found in Step 1, resolve them before writing.
Ask one at a time.

For each unresolved open question:
> "The brainstorm left this open: '{question}'. How should the spec handle it?"

For each assumption:
> "The brainstorm assumed: '{assumption}'. Should this become a MUST requirement,
> a SHOULD requirement, or stay as a noted constraint?"

For each pending research item:
> "The brainstorm flagged this as needing research: '{item}'.
> Do you have an answer, or should we proceed with a stated assumption?"

Skip this step if the brainstorm had no open items.

---

## Step 3 — Clarifying Questions (one at a time)

Ask only about things genuinely unclear for writing precise requirements.
Do not re-ask things already answered in the brainstorm.

Areas to clarify if still unclear:

- **Requirement priorities** — is any requirement truly optional (MAY) vs expected (SHOULD) vs non-negotiable (MUST)?
- **NFR targets** — does this feature have measurable non-functional requirements? (response time, uptime, data retention, rate limits)
- **Error flows** — is every failure case from the brainstorm represented as a named error flow?
- **Boundary conditions** — any edge cases from the brainstorm challenge round that need to be requirements?
- **Out of scope** — anything that came up in brainstorm that should be explicitly excluded?

Skip if everything is already clear.

---

## Step 4 — Challenge Round

Before presenting the outline, flag at least 2 concerns about the spec content:

> "Before I draft the outline, a couple of things to flag:
>
> **[Concern 1]:** {e.g. 'The brainstorm mentioned rate limiting as a constraint, but there's
> no NFR for it — should I add one with a specific target, or leave it out of scope?'}
>
> **[Concern 2]:** {e.g. 'REQ for "validate email format" is vague — a developer could
> implement this 5 different ways. Should the spec define the validation rule explicitly
> (RFC 5322, or just presence of @), or leave it to the implementor?'}
>
> How should these be handled?"

Choose concerns specific to this feature's brainstorm — not generic warnings.
Wait for resolution before presenting the outline.

---

## Step 5 — Spec Outline & Gate

Present a structured outline before writing the full spec:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spec Outline: {Feature Name}  [{slug}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modules: {list}

REQUIREMENTS
  Functional ({n})
    REQ-1 [MUST]   {description}
    REQ-2 [MUST]   {description}
    REQ-3 [SHOULD] {description}
  Non-Functional ({n})
    NFR-1  {requirement} — target: {value}

USER FLOWS
  Happy Path: {name}
  Error Flow: {name}
  Error Flow: {name}

API ENDPOINTS
  {METHOD} {path}  →  {module}

ASSUMPTIONS & CONSTRAINTS
  - {constraint or assumption — or 'none'}

OUT OF SCOPE
  - {item}

OPEN QUESTIONS
  - {any remaining — or 'none'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End with:
> "Does this outline look right? Say **yes** to write the spec, or tell me what to change."

Wait for confirmation. Do not write `spec.md` before the user says yes.

---

## Step 6 — Write spec.md

Create `features/{feature-slug}/spec.md`:

```markdown
# Feature: {Feature Name}

**ID:** {feature-slug}
**Status:** Draft
**Created:** {YYYY-MM-DD}
**Modules:** {comma-separated module names}

---

## Overview
{2–3 sentences. What it does and why it matters.}

---

## Actors & Permissions
{Carried from the brainstorm. One row per role.}

| Actor    | Can do                          | Access scope                        |
|----------|---------------------------------|-------------------------------------|
| {role}   | {what they can do}              | {e.g. own records only / all / read-only} |

---

## Requirements

### Functional

| ID    | Requirement   | Priority  |
|-------|---------------|-----------|
| REQ-1 | {description} | [MUST]    |
| REQ-2 | {description} | [SHOULD]  |

### Non-Functional

| ID    | Requirement          | Target   |
|-------|----------------------|----------|
| NFR-1 | {e.g. response time} | {target} |

---

## Data Model
{Carried from the brainstorm's Data & State. Entities and what persists — no DB schema, conceptual only.}

| Entity   | Created by | Key fields (conceptual)        | Persists |
|----------|------------|--------------------------------|----------|
| {entity} | {actor/op} | {field, field, field}          | {yes/no} |

Cross-module data: {what is shared with or derived from other modules — or "None"}

---

## User Flows

### Happy Path: {name}
1. {step}
2. {step}

### Error Flow: {name}
1. {trigger}
2. {system behavior}

---

## API Endpoints

| Method | Path | Module | Contract |
|--------|------|---------|----------|
| POST   | /api/v1/{resource} | {module} | *(generated in forge-contract)* |

---

## Assumptions & Constraints
{Carried from the brainstorm's Constraints and any assumptions resolved as "noted constraint".}
- **Constraint:** {hard constraint — e.g. "must authenticate via existing SSO"}
- **Assumption:** {unvalidated assumption} — _risk if wrong: {impact}_
- (write "None" if empty)

---

## Out of Scope
- {explicit exclusion}

---

## Open Questions
- [ ] {any remaining unresolved item — omit section if empty}
```

### Writing rules
- `Status:` starts at `Draft` (lifecycle: Draft → Ready after contract → Done after close)
- Carry **Actors & Permissions**, **Data Model**, and **Assumptions & Constraints** forward from the brainstorm — do not drop them
- Every requirement must have a unique REQ-N or NFR-N ID
- Use [MUST] / [SHOULD] / [MAY] — no vague language like "should probably" or "ideally"
- Requirements must be testable — a developer should know unambiguously when one is met
- No code, no DB schema, no implementation details (Data Model is conceptual entities only)
- API section lists endpoint names only — no request/response schema
- Every error flow from the brainstorm must appear as a named Error Flow
- Keep it scannable — a developer should understand the feature in 5 minutes

---

## Step 7 — Update changelog & gate

After writing `spec.md`, update `features/CHANGELOG.md`:
- Find the row where `Slug` = `{slug}`
- Update `Status` → `Draft`
- Update `Modules` → comma-separated list of modules from the spec's **Modules** header
- If the row doesn't exist (spec written without going through forge-brainstorm), append it:
  `| — | {slug} | {overview first sentence} | Draft | {modules} | — |`

Then say:
> "Spec written to `features/{slug}/spec.md`. Review it and say **yes** to generate the task breakdown."

Do NOT add tasks to spec.md — tasks go in `features/{slug}/tasks.md` via `/forge-tasks`.
Do NOT generate contracts. Wait for confirmation.
