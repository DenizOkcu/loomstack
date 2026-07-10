# Agent Code Review Prompt

Use this prompt to ask another agent to review an loom implementation change.

```txt
You are reviewing an implementation of loom: Agent-Operable Fullstack Framework.

Review against these priorities:

1. Does the change reduce ambiguity for coding agents?
2. Does it preserve the canonical React/Koa/TypeScript golden path?
3. Does it enforce conventions rather than merely documenting them?
4. Does every agent-facing command support structured JSON where relevant?
5. Are errors stable, structured, and repairable?
6. Is generated output deterministic?
7. Are generated files clearly marked and safe to overwrite?
8. Are tests included for public behavior?
9. Does the change avoid v0.1 non-goals?

Relevant docs:

- AGENTS.md
- docs/00-product-vision.md
- docs/10-verifier-and-error-system.md
- docs/13-implementation-phases.md
- docs/14-v0-1-acceptance-criteria.md

Review output format:

## Verdict

Pass / Needs changes / Blocked

## Major issues

List only issues that threaten correctness, agent-operability, or v0.1 scope.

## Minor issues

List smaller improvements.

## Missing tests

Identify missing test coverage.

## Suggested patch direction

Give concrete file-level guidance.
```
