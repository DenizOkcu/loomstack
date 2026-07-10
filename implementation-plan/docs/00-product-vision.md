# 00 — Product Vision

## Category

loom defines the category **Agent-Operable Fullstack Framework**.

An Agent-Operable Fullstack Framework is a web application framework whose architecture, conventions, commands, errors, and documentation are designed so autonomous coding agents can understand, modify, verify, and extend applications with minimal ambiguity.

## Positioning

loom is not “a framework with AI features.”

loom is a framework where the primary operator is a coding agent and the human defines intent.

The framework is designed around this exchange:

```txt
Human: Add private notes to people. Only the owner can read and edit them.
Agent: Queries the framework context, edits the canonical files, runs verification, repairs errors, reports result.
```

## Main user

The buyer/user is still a human developer or technical founder. The primary operator during implementation tasks is an AI coding agent.

loom serves users who want to delegate larger code changes to agents without constant correction.

## Core product promise

> loom reduces the search space for coding agents.

This should result in:

- fewer wrong-file edits
- fewer inconsistent patterns
- fewer failed repair loops
- less context window waste
- faster task completion
- easier code review
- more reliable generated features

## Why existing frameworks are insufficient

Human-first frameworks optimize for expressiveness, ecosystem breadth, and developer preference.

Agents do not benefit from excessive expressiveness. Agents benefit from strong contracts.

Common issues in human-first frameworks:

- many valid places to put business logic
- mixed server/client behavior
- route conventions that are implicit
- handwritten glue code
- inconsistent project structures
- error messages optimized for humans, not automated repair
- documentation disconnected from actual repository state

loom solves these by making the application inspectable, enforceable, and repairable.

## Design manifesto

1. Every feature is a declared unit.
2. Every pattern has one canonical implementation.
3. Every boundary is explicit.
4. Every command has machine-readable output.
5. Every error includes a repair path.
6. Every repository generates agent context.
7. Every convention is enforced, not merely documented.
8. Every task has a known edit path.
9. Every generated file is marked.
10. Every architectural rule is testable.

## v0.1 product scope

loom v0.1 should prove that a coding agent can reliably modify a fullstack app by following framework-generated context.

It does not need broad ecosystem support. It needs one excellent golden path.

## North-star task

Given an example loom app, an agent should be able to complete this task reliably:

> Add a due date to commitments and sort overdue commitments first.

The agent should know:

- which feature owns commitments
- which schema file defines the model
- which actions accept input
- which query controls list order
- which UI view renders the list
- which tests must change
- which command verifies the task

## Success metric

loom succeeds if the same coding agent performs better in an loom project than in an equivalent unconstrained React/Koa project.

Measure:

- files read
- files edited
- irrelevant files touched
- verification failures
- repair loop count
- token usage
- task success rate
- human intervention needed

## Naming

Working CLI/package name: `loom`.

Possible public names:

- Axiom
- SpecStack
- Operable
- AgentRails
- Railforge
- Framepath

Implementation docs should use `loom` until a final name is chosen.
