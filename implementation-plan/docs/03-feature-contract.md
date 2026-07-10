# 03 — Feature Contract

loom applications are composed of declared features.

A feature is a self-contained product capability with a manifest, schema, policies, actions, queries, UI, and tests.

## Canonical feature structure

```txt
features/<feature-id>/
  feature.yaml
  AGENTS.md
  model.schema.ts
  permissions.policy.ts
  actions/
    *.action.ts
  queries/
    *.query.ts
  ui/
    *.view.tsx
    *.component.tsx
    *.form.tsx
  tests/
    *.test.ts
```

## `feature.yaml`

The feature manifest is the first source of truth for the feature.

Example:

```yaml
id: people
name: People
description: Manage people, roles, and relationship context.

entities:
  - Person

routes:
  - id: people-list
    path: /people
    view: PeopleListView
  - id: person-detail
    path: /people/:id
    view: PersonDetailView

actions:
  - createPerson
  - updatePerson
  - deletePerson

queries:
  - listPeople
  - getPerson

permissions:
  read: authenticated
  write: owner
```

## Manifest schema

The manifest parser should validate this shape:

```ts
export interface FeatureManifest {
  id: string
  name: string
  description?: string
  entities: string[]
  routes: FeatureRoute[]
  actions: string[]
  queries: string[]
  permissions?: Record<string, string>
}

export interface FeatureRoute {
  id: string
  path: string
  view: string
}
```

## Manifest rules

- `id` must match the folder name.
- `id` must be kebab-case.
- `name` must be present.
- route IDs must be unique within a feature.
- route paths must be unique across the app.
- action names must match exported action names.
- query names must match exported query names.
- views must match exported view names.
- entities must match schema entity names.

## Feature-local `AGENTS.md`

Each feature should include a local instruction file generated or updated by loom.

Example:

```md
# People Feature Agent Instructions

## Purpose

This feature manages people and relationship context.

## Source of truth

- Manifest: `feature.yaml`
- Schema: `model.schema.ts`
- Permissions: `permissions.policy.ts`

## Rules

- Add mutations in `actions/*.action.ts`.
- Add reads in `queries/*.query.ts`.
- Add route-level UI in `ui/*.view.tsx`.
- Do not access the database from UI files.
- Update tests after changing schema, actions, queries, or policies.

## Verify

Run:

```bash
pnpm loom verify feature people
```
```

## Feature ownership

A file belongs to a feature if it is under `features/<feature-id>`.

Cross-feature imports should be restricted. For v0.1, avoid cross-feature imports except through generated registries or explicitly allowed shared schemas.

## Actions

Actions represent mutations.

Action files must:

- live in `actions/*.action.ts`
- export exactly one primary action
- use `action({ ... })`
- define `name`, `input`, `output`, and `run`
- validate input and output through schemas

## Queries

Queries represent reads.

Query files must:

- live in `queries/*.query.ts`
- export exactly one primary query
- use `query({ ... })`
- define `name`, `input` if needed, `output`, and `run`
- avoid mutations

## Views

Views represent route-level screens.

View files must:

- live in `ui/*.view.tsx`
- export one primary view
- use `view({ ... })`
- declare route-level query dependencies
- not call raw fetch
- not import database modules

## Components and forms

Supporting UI files may use:

```txt
*.component.tsx
*.form.tsx
```

They should not import backend/database code.

## Tests

Feature tests should be colocated:

```txt
features/<feature-id>/tests/*.test.ts
```

Minimum tests for a feature:

- action behavior
- query behavior
- permission behavior when permissions exist
- schema validation where meaningful

## Agent workflow for adding a field

When an agent adds a field to an entity:

1. Read `feature.yaml`.
2. Read `model.schema.ts`.
3. Run `loom affected features/<feature>/model.schema.ts --json` if available.
4. Edit schema.
5. Update affected create/update actions.
6. Update affected queries.
7. Update forms/views.
8. Update tests.
9. Run `loom verify feature <feature> --json`.
10. Repair all reported errors.

## Agent workflow for adding a new feature

1. Run `loom create feature <name>`.
2. Edit `feature.yaml`.
3. Define schema.
4. Add actions.
5. Add queries.
6. Add views.
7. Add tests.
8. Run `loom generate` if generation is separate.
9. Run `loom verify`.
