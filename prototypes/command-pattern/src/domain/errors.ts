import type { AttemptId } from "./types.js";

export class SessionNotActiveError extends Error {
  constructor(state: string) {
    super(`Cannot submit an answer while the session is ${state}`);
    this.name = "SessionNotActiveError";
  }
}

export class StaleSessionError extends Error {
  constructor(expected: number, actual: number) {
    super(`Stale session version: expected ${expected}, current version is ${actual}`);
    this.name = "StaleSessionError";
  }
}

export class ActivityMismatchError extends Error {
  constructor() {
    super("The submitted activity is not the session's current activity");
    this.name = "ActivityMismatchError";
  }
}

export class DuplicateActionError extends Error {
  constructor() {
    super("The clientActionId was already used with a different answer payload");
    this.name = "DuplicateActionError";
  }
}

export class EvidencePropagationError extends Error {
  constructor(
    public readonly attemptId: AttemptId,
    options: ErrorOptions,
  ) {
    super(`Attempt ${attemptId} was saved, but its evidence is pending`, options);
    this.name = "EvidencePropagationError";
  }
}
