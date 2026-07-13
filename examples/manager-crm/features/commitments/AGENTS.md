# Commitments Feature Agent Instructions

## Purpose

Commitments product capability.

## Source of truth

- Manifest: `feature.yaml`
- Schema: `model.schema.ts`
- Permissions: `permissions.policy.ts`

## Rules

- Mutations belong in `actions/*.action.ts`.
- Reads belong in `queries/*.query.ts`.
- Route UI belongs in `ui/*.view.tsx`.
- Never import database or Koa modules from UI.
- Never call raw fetch from UI.
- Update tests with every contract change.

## Verify

`pnpm loomstack verify feature commitments --json`
