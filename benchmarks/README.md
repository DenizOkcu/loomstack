# Agent-operability benchmark

Run every prompt against `examples/manager-crm` and an equivalent unconstrained React/Koa app. Give agents the same model, prompt, time, and tool access. Record success, files read/edited, irrelevant edits, failed checks, repair loops, tokens, elapsed time, and human intervention.

Before each loomstack task, the agent may use `loomstack context feature`, `loomstack affected`, and scoped verification. Reset both repositories to identical baseline commits between tasks.

| # | Prompt | Expected loomstack edit path |
|---|---|---|
| 1 | Add due dates to commitments and show overdue commitments first. | `commitments/feature.yaml`, schema, create action, list query, view, tests |
| 2 | Add private notes to people visible only to owners. | people schema, create/update actions, read query, policy, view, tests |
| 3 | Add project risk level and filter high-risk projects. | projects schema, create/update actions, list query, view, tests |
| 4 | Add a dashboard card for commitments due this week. | commitments due-soon query/test plus dashboard manifest/view |
| 5 | Add a delete confirmation flow for people. | people delete action, form/component/view, tests, manifest action |
| 6 | Add archived state to projects. | projects schema, archive action, queries/views/tests, manifest action |
| 7 | Add overdue commitments grouped by person. | commitments query/output schema/view/test and manifest query |
| 8 | Add tests for permission enforcement. | feature policy and colocated tests only |
| 9 | Rename `title` to `position` on people. | people schema, actions, queries, view, tests |
| 10 | Add an organizations feature. | new canonical `features/organizations/*` vertical slice |

For detailed paths and result recording, use [`tasks.json`](tasks.json).
