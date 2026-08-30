# Command Pattern prototype for KnowNext

Minimal, isolated TypeScript prototype of the GoF **Command** pattern applied to a study action in KnowNext's Learning Service.

## Problem before Command

Without Command, a frontend, BFF, or controller would need to know the complete answer-submission workflow: validate a session, assess an answer, record an attempt, publish evidence, retrieve the learner's updated knowledge state, and ask for the next learning action. That couples an entry point to domain collaborators and makes the workflow difficult to invoke or test independently.

`SubmitAnswerCommand` encapsulates that sequence behind `StudyCommand.execute()`. The application-layer `StudyActionInvoker` depends only on this interface and simply delegates execution. Domain rules remain in their proper collaborators: assessment in `AssessmentService`, action validation and attempt registration in `LearningSession`, learner integration behind `LearnerServicePort`, and pedagogical selection behind `AdaptiveEngine`.

No artificial `Receiver` class is used. The real receivers/collaborators are the domain objects and services themselves.

## Main flow

`SubmitAnswerCommand.execute()`:

1. asks `LearningSession` to validate the action;
2. asks `AssessmentService` to evaluate the submitted answer;
3. asks the session to create and register an `Attempt` in memory;
4. sends the resulting `Evidence` through `LearnerServicePort`;
5. obtains the updated knowledge state through the same port;
6. asks `AdaptiveEngine` for the next learning action;
7. returns a `StudyActionResult` containing the assessment and next action.

The external learner service and adaptive engine are replaced by configurable in-memory fakes. There is no database, HTTP, BFF, PostgreSQL, Drizzle, real AI, or external call. Session status is deliberately a simple union (`ACTIVE | PAUSED`); State and Memento are not implemented.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install

From the repository root:

```bash
cd prototypes/command-pattern
npm install
```

## Run the executable demo

```bash
npm run demo
```

## Run automated tests

```bash
npm test
```

## Optional static type check

```bash
npm run typecheck
```

The tests cover the ACTIVE and PAUSED session paths, calls to assessment, evidence delivery, knowledge-state retrieval, the adaptive-engine request, the returned result, and the invoker's dependency-free delegation to an arbitrary `StudyCommand`.
