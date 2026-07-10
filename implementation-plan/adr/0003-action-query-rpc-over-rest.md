# ADR 0003 — Action/Query RPC over REST for Internal App Transport

## Status

Accepted for v0.1.

## Context

REST route design introduces naming and mapping ambiguity. Agents must infer how HTTP routes map to feature behavior.

loom already models behavior as actions and queries.

## Decision

loom v0.1 will use internal action/query RPC endpoints:

```txt
POST /_loom/actions/<actionName>
POST /_loom/queries/<queryName>
```

REST generation may be added later as an optional public API feature.

## Rationale

RPC maps directly to files and registries:

```txt
features/people/actions/create-person.action.ts -> /_loom/actions/createPerson
features/people/queries/list-people.query.ts -> /_loom/queries/listPeople
```

This is easier for coding agents to understand and verify.

## Consequences

Positive:

- less routing ambiguity
- simpler generated clients
- easier error reporting
- direct mapping to action/query contracts

Negative:

- less conventional public API shape
- may need REST generation later for external consumers

## Enforcement

Feature behavior must not be implemented through manual Koa routes in v0.1.
