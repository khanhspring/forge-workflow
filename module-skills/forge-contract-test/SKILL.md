---
name: "forge-contract-test"
description: "Outputs the specmatic test command to verify the running service against its contracts. If test output is pasted as argument, analyzes each failure with endpoint, mismatch type, and a one-line fix."
argument-hint: "Paste specmatic test failure output to analyze, or leave empty to get the test command"
compatibility: "Requires module repo with .forge/module.json; service must be running at test_base_url for live testing"
metadata:
  author: "forge-workflow"
  source: "module-skills/forge-contract-test/SKILL.md"
user-invocable: true
disable-model-invocation: true
---

# Forge Contract Test

Run or analyze Specmatic contract tests for this module.

## Pre-check
- Read `.forge/module.json` for `contract_glob` and `test_base_url`.
  If missing, say "Run forge-init to set up this module repo first."

## If $ARGUMENTS is empty — Output the test command

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract Tests: {module}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make sure your server is running at {test_base_url}, then run:

  specmatic test \
    --contract "{contract_glob}" \
    --testBaseURL {test_base_url}

Contracts under test:
{list files matching contract_glob}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## If $ARGUMENTS contains test output — Analyze failures

For each failure, provide:
1. Which endpoint failed (method + path)
2. What the mismatch is (missing field / wrong type / wrong status code / unexpected field)
3. Where to fix it in the implementation (specific file/method if determinable from stack)
4. One-line fix suggestion

Format:
```
❌ POST /api/v1/users/register
   Issue: Response missing required field `createdAt` (string, date-time)
   Fix: Add `createdAt` to the RegisterResponse DTO and include it in the response

❌ GET /api/v1/users/{id}
   Issue: Returns 200 when user not found — contract expects 404
   Fix: Add a not-found check before returning the response
```

## Rule
Never suggest changing the contract to fix a failing test.
If the contract looks wrong: "Raise this in the spec repo — don't work around it here."
