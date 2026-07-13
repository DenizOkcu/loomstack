# ADR 0001 — React and Koa as the v0.1 Golden Path

## Status

Accepted for v0.1.

## Context

loomstack needs one fullstack path that is familiar to coding agents and has explicit boundaries.

## Decision

loomstack v0.1 will use:

- React + Vite for frontend
- Koa for backend
- TypeScript across the stack

## Rationale

React has a large corpus of examples and strong agent familiarity.

Koa is minimal and explicit, making backend behavior easier for agents to inspect than highly abstracted fullstack runtimes.

The separation creates a clear model:

```txt
React = presentation
Koa = transport
features/* = behavior
```

## Consequences

Positive:

- clear frontend/backend boundary
- simple generated routing
- easy local development
- familiar TypeScript stack

Negative:

- no SSR in v0.1
- no Next.js ecosystem benefits
- more generated wiring than a meta-framework might need

## Non-goals

Do not add Vue, Svelte, Next.js, Express, Fastify, or Nest support before v0.1 validates the core thesis.
