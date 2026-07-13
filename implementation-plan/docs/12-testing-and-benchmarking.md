# 12 — Testing and Benchmarking

Testing must prove both framework correctness and agent-operability.

## Test philosophy

loomstack should be tested as a product for agents, not just as a library.

Test the contracts agents rely on:

- generated files are deterministic
- context output is accurate
- verifier errors are precise
- CLI JSON is valid
- feature scaffolds are canonical
- route generation matches manifests
- forbidden patterns are caught

## Unit tests

Required unit test areas:

### Manifest parser

- valid manifest parses
- invalid YAML fails with structured error
- missing required fields fail
- feature ID mismatch fails
- duplicate route paths fail

### Feature scanner

- discovers features
- ignores non-feature folders
- resolves actions/queries/views
- reports missing files

### Generator

- app template generation
- feature scaffold generation
- React route generation
- Koa route generation
- registry generation
- context JSON generation
- deterministic sorting

### Verifier

- detects stale generated files
- detects manually modified generated files
- detects forbidden imports
- detects raw fetch in UI
- detects action/query mismatch with manifest

### CLI

- commands return correct exit codes
- `--json` emits valid JSON only
- human output contains useful next steps
- errors are stable and structured

## Snapshot tests

Use snapshots for generated source.

Important snapshots:

```txt
one-feature-react-routes.snapshot.tsx
one-feature-koa-routes.snapshot.ts
two-feature-action-registry.snapshot.ts
context-json.snapshot.json
graph-json.snapshot.json
```

Snapshots must be deterministic and easy to review.

## Integration tests

Create temporary test projects during tests.

Scenarios:

1. create app
2. create feature
3. add action/query/view fixture
4. generate
5. verify
6. assert success

Another scenario:

1. create app
2. create feature
3. intentionally add db import in UI
4. run verify
5. assert `loomstack2001`

## Example app tests

The `examples/manager-crm` app should function as an end-to-end fixture.

Required example features:

- people
- projects
- commitments

Required demo tasks:

- add a field to an entity
- add an action
- add a query
- add a route/view
- add a permission rule

## Benchmarking agent-operability

loomstack should include a benchmark plan comparing an loomstack app against an equivalent unconstrained React/Koa app.

### Benchmark setup

Create two apps:

1. `examples/manager-crm-loomstack`
2. `examples/manager-crm-plain-react-koa`

Both should implement equivalent features.

### Agent tasks

Use the same prompts in both apps:

1. Add due dates to commitments and sort overdue first.
2. Add private notes to people visible only to owners.
3. Add project risk level and filter high-risk projects.
4. Add a dashboard card for commitments due this week.
5. Add a delete confirmation flow for people.
6. Add an archived state to projects.
7. Add a query for overdue commitments grouped by person.
8. Add tests for permission enforcement.
9. Rename `role` to `title` on people.
10. Add a new feature called `organizations`.

### Metrics

Collect manually or via harness:

- task success/failure
- files read
- files edited
- irrelevant files edited
- failed test count
- repair loop count
- total token usage if available
- wall-clock time if available
- human intervention required

### Expected result

loomstack should reduce:

- irrelevant file reads
- architecture violations
- failed repair loops
- ambiguous edits

## Acceptance criteria for test suite

v0.1 should not be considered ready unless:

- all package tests pass
- generated files have snapshot coverage
- verifier catches at least five core violation types
- CLI JSON is tested
- example app can be generated and verified

## Non-goals for v0.1

- full browser E2E coverage
- performance load tests
- production security audits
- mutation testing
