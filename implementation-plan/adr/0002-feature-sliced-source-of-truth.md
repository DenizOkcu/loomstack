# ADR 0002 — Feature-Sliced Source of Truth

## Status

Accepted for v0.1.

## Context

Coding agents perform poorly when product behavior is spread across routes, controllers, services, hooks, components, and utility modules with no canonical ownership.

## Decision

loom apps will use feature-sliced architecture. Product behavior lives under `features/*`.

Canonical feature structure:

```txt
features/<feature-id>/
  feature.yaml
  model.schema.ts
  permissions.policy.ts
  actions/*.action.ts
  queries/*.query.ts
  ui/*.view.tsx
  tests/*.test.ts
```

## Rationale

A feature folder gives agents a clear unit of ownership.

The framework can generate context per feature and report affected files with high confidence.

## Consequences

Positive:

- predictable edit paths
- easier scoped context
- simpler verification
- better code review

Negative:

- less flexible than arbitrary app structures
- may feel restrictive to human developers

## Enforcement

The verifier must enforce file naming, manifest consistency, and forbidden dependency boundaries.
