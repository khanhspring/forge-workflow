---
name: "forge-brainstorm"
description: "Phase 1 of 4. Interrogates a feature idea through structured questioning, a challenge round, and 2–3 design approaches before writing a gated summary. Proactively researches existing context and surfaces research-blocked items before writing the spec."
argument-hint: "Feature idea to brainstorm (e.g. 'user notifications')"
compatibility: "Requires spec repo with .forge/project.json"
metadata:
  author: "forge-workflow"
  source: "spec-skills/forge-brainstorm/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Brainstorm

Phase 1 of 4. Your job is to fully understand a feature before any spec is written.
The goal is zero ambiguity — every concern surfaced, every edge case accounted for,
every unknown either resolved or explicitly accepted as an assumption.

<HARD-GATE>
Do NOT generate a spec, break down tasks, or write any contracts in this phase.
The only files this skill writes are `features/{slug}/brainstorm.md` and one row in
`features/CHANGELOG.md`, and only AFTER the user has explicitly approved the Brainstorm
Summary at the gate (Step 7).
"Simple" features are where unexamined assumptions cause the most wasted work — no feature
skips this phase.
</HARD-GATE>

---

## Step 0 — Check for existing external context

Before anything else, check if the user has provided external content to work from.
Signals: they paste a block of text, mention "we have a Confluence page / Google Doc / proposal /
PRD / design doc", or say "here's the draft".

**If external content is present (pasted inline):**
Extract everything you can from it — map it to the mandatory question areas in Step 2.
Note what is covered, what is missing, and what is ambiguous.
Report back:
> "I've read your {doc type}. Here's what I extracted:
> ✅ Covered: {list of areas — problem, actors, happy path, etc.}
> ❓ Missing or unclear: {list of gaps}
> ⚠️ Ambiguous: {anything that could be read two ways}
>
> I'll ask only about the gaps. Sound good?"

**If the user mentions a doc but hasn't pasted it:**
> "I can't access external URLs directly — could you paste the relevant content here?
> Even a rough copy-paste is fine; I'll extract what I need."

**If no external content** — proceed straight to Step 1.

---

## Step 1 — Load & Research Context

Before asking the user anything, research the existing codebase silently:

1. Read `.forge/project.json` — note module names, types, stacks, ports.
2. Scan `features/*/spec.md` — are there related or similar features already specced?
   Note any patterns, naming conventions, or prior decisions relevant to this idea.
3. Scan `contracts/*/` — are there existing API contracts this feature will touch or extend?
   Note existing endpoint shapes, error formats, auth patterns.
4. Read `CONTEXT.md` — note the actors, domain glossary, principles, conventions, and
   forbidden patterns that will constrain design choices. Use glossary terms verbatim
   in your questions and in the summary — never invent synonyms for existing domain terms.

Report your findings before starting questions:

> "Before we dive in, here's what I found in the codebase:
> - [relevant existing feature or contract, or "No related features found"]
> - [relevant principle or constraint from CONTEXT.md, or "No constraints found"]
>
> I'll use this as context. Here's my understanding of the feature: {1–2 sentence restatement}
> Is that right?"

Then check scope:

> If the idea spans multiple unrelated concerns: "This sounds like 2–3 separate features.
> Shall we split and brainstorm each one, or treat it as a single feature?"

---

## Step 2 — Mandatory questions (one at a time)

These MUST all be answered before moving to Step 4. Ask one at a time.
**Skip any area already covered by Step 0 extraction or Step 1 research.**
Only ask about genuine gaps — never re-ask what the user already provided.

**If a question hits an unknown** — something the user can't answer without researching —
use the Research Flag pattern (see Research Handling below).

**1. Problem & users**
- What specific pain does this solve?
- Who experiences it, and how often?
- What happens today without this feature?

**2. Actors & permissions**
- Who are the actors? (end user / admin / system / external service)
- Does each actor have different access levels or see different data?
- Is any part restricted by role or ownership? (e.g. "users can only edit their own records")

**3. Happy path**
- Walk through the exact steps from trigger to completion.
- What does the user see/receive at the end?

**4. Data & state**
- What data is created, read, updated, or deleted?
- What persists after the action completes?
- Is any of this shared with or derived from other modules?

**5. Failure cases** — ask explicitly about each:
- Invalid or missing input → what happens?
- The same request submitted twice (idempotency)?
- A downstream service or dependency is unavailable?
- The user doesn't have permission?
- Partial failure mid-flow — is rollback needed?

**6. Modules & APIs**
- Which modules are involved?
- Does this extend existing APIs or is it net-new?
- Does anything need to be deprecated or changed?

---

## Step 3 — Conditional questions (ask if not already answered)

- **Integrations** — emails, push notifications, webhooks, third-party APIs?
- **Async / background work** — any deferred or eventually consistent parts?
- **Scale & performance** — volume expectations or SLA requirements?
- **Consistency** — similar existing feature to follow for patterns?

Skip any that are clearly irrelevant.

---

## Research Handling

Use this pattern whenever a question surfaces something that cannot be answered
through discussion alone.

### When the user doesn't know the answer

> "🔍 **Research needed:** {what needs to be found out}
>
> To answer this, you'd need to: {specific action — e.g. 'check if Stripe supports partial
> refunds in your plan', 'ask the product team what the UX should be', 'look at how
> user-service currently handles token expiry'}
>
> How do you want to proceed?
> **(a) Pause here** — I'll give you a research checklist and we resume when you have answers
> **(b) Proceed with an assumption** — I'll state an explicit assumption and flag it for validation
> **(c) Keep going** — we'll leave this as an open question and resolve it before writing the spec"

### When Claude can research it

If the answer can be found by reading existing files in the repo:

> "🔍 Let me check the existing codebase for this — one moment."

Read the relevant file(s), then report what you found and whether it resolves the question.

### Research pause

If the user chooses **(a) Pause**:

Output a research checklist:

```
⏸ Brainstorm paused — research needed before continuing.

Research checklist:
  □ {item 1} — {where to look / who to ask}
  □ {item 2} — {where to look / who to ask}

Resume by coming back and saying: "forge-brainstorm {slug} — resuming with answers:
  - {item 1}: [your answer]
  - {item 2}: [your answer]"
```

Stop here. Do not continue the brainstorm until the user resumes with answers.

### Proceed with assumption

If the user chooses **(b) Assumption**:

State it explicitly and add it to the Assumptions section in the summary:

> "✅ Assumption recorded: {clear statement of what we're assuming}
> This will need validation before or during implementation."

---

## Step 4 — Challenge round

Actively probe for hidden problems. Raise at least 2 concerns specific to the answers given:

> "Before I propose approaches, I want to flag a couple of things:
>
> **[Concern 1]:** {specific concern from the conversation}
>
> **[Concern 2]:** {specific concern from the conversation}
>
> How should these be handled?"

Wait for resolution before moving on. If a concern can't be resolved without research,
apply the Research Handling pattern.

---

## Step 5 — Propose approaches

Propose **2–3 design approaches** with trade-offs. Base them on the researched context
from Step 1 — flag if an approach conflicts with existing patterns or CONTEXT.md principles.

```
I see 2–3 ways to approach this:

**Option A (Recommended): {name}**
{1–2 sentences}
✓ {pro}  ✗ {con}
{note if consistent/inconsistent with existing patterns}

**Option B: {name}**
{1–2 sentences}
✓ {pro}  ✗ {con}

**Option C: {name}** (if relevant)
{1–2 sentences}
✓ {pro}  ✗ {con}

I'd go with Option A because {reason}. What do you think?
```

After the user picks, ask one follow-up:
> "What's the main risk you see with this approach? Anything that makes you hesitant?"

Resolve concerns before moving on.

---

## Step 6 — Synthesize

Write the brainstorm summary in the conversation (no file):

```
## Brainstorm Summary: {Feature Name}
**Slug:** {kebab-case-slug}
**Approach:** {chosen option name}

### Problem
{1–2 sentences}

### Actors & Permissions
- **{Role}**: {what they do and what they can access}

### Happy Path
1. {step}
2. {step}

### Data & State
- {what is created/read/updated/deleted}
- {what persists and where}

### Edge Cases & Failures
- **{case}**: {handling}

### Constraints
- {constraint — or "None identified"}

### Modules Involved
- **{module-name}** ({type}): {responsibility in this feature}

### Out of Scope
- {explicitly excluded items}

### Assumptions
- {assumption}: {what it means if this is wrong}
- (empty if no assumptions were made)

### Research Needed
- {item}: {what to check and where}
- (empty if nothing is pending)

### Open Questions
- {unresolved concern — must be empty or moved to Research Needed before spec is written}
```

**Self-review before presenting:**
- Any requirement readable two ways → pick one interpretation, state it explicitly
- Any happy path step with no failure case → add it
- Any "nice to have" → move to Out of Scope
- Any contradiction between sections → resolve it
- Anything in Open Questions that's actually a research item → move it to Research Needed
- Open Questions not truly empty → do not write "None"

Do not mention the self-review to the user.

---

## Step 7 — Gate

Check all three blocking sections before accepting "yes":

**If Open Questions is not empty:**
> "Let's resolve these before writing the spec:
> - {question}
> How would you handle each?"
Do NOT proceed until resolved.

**If Research Needed is not empty:**
> "There are items that need research before the spec can be finalized:
> - {item}: {where to look}
>
> Do you want to:
> **(a) Pause and research first** — I'll give you the checklist
> **(b) Proceed and treat these as assumptions** — I'll add them to the spec as risks to validate"

Wait for the user's choice. If (a), output the research checklist and stop.
If (b), convert each item to an explicit assumption in the summary.

**If Assumptions is not empty, warn:**
> "Note: this spec will include {n} assumption(s) that need validation:
> - {assumption}: {risk if wrong}"

**Once all three sections are resolved or accepted:**
> "Does this capture the feature correctly? Clarify anything above, or say **yes** to save it and move to the spec."

---

## Step 8 — Persist the summary (after approval only)

Once the user says **yes**:

**8a — Assign sequence number and ask about dependencies**

Read `features/CHANGELOG.md`. Count existing rows to get the next `#`.

Ask (one message):
> "Does this feature depend on any other feature being shipped first?
> _(Enter slugs like `user-registration`, or 'none')_"

**8b — Write `features/{slug}/brainstorm.md`**

```markdown
# Brainstorm: {Feature Name}

**Slug:** {slug}
**Approach:** {chosen option name}
**Captured:** {YYYY-MM-DD}

{the full Brainstorm Summary body from Step 6 — all sections}
```

**8c — Append row to `features/CHANGELOG.md`**

Add a new row — status `Brainstormed`, modules left blank until forge-spec fills them:
```
| {n} | {slug} | {one-line from Problem section} | Brainstormed | — | {depends or —} |
```

Then hand off:
> "Saved to `features/{slug}/brainstorm.md` and added to the changelog as #{n}.
> Run `/forge-spec {slug}` to write the spec."

---

## Rules
- One question per message — never list multiple at once
- Prefer multiple-choice when options are predictable
- Cover all Step 2 mandatory areas — but fill from Step 0 extraction first; only ask for genuine gaps
- Never skip the challenge round (Step 4) — even when a doc covers everything, challenge it
- Never skip the approaches step (Step 5) — a doc may have a chosen approach but alternatives should still be surfaced
- YAGNI: move anything non-core to Out of Scope
- The ONLY file written is `features/{slug}/brainstorm.md`, and only after approval (Step 8)
- Do NOT skip Step 1 research — always check existing context first
- Do NOT ask questions that could be answered by reading the existing codebase or the pasted doc
