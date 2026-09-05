import { ActivityMismatchError, SessionNotActiveError, StaleSessionError } from "./errors.js";
import { Attempt, type AttemptData } from "./Attempt.js";
import type { NextLearningAction } from "../services/AdaptiveEngine.js";
import type { ActivityId, ClientActionId, ConceptId, LearnerId, SessionId } from "./types.js";

export type SessionState = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface CurrentActivity {
  readonly id: ActivityId;
  readonly conceptId: ConceptId;
}

export class LearningSession {
  private readonly attemptsByAction = new Map<ClientActionId, Attempt>();
  private readonly resultsByAction = new Map<ClientActionId, NextLearningAction>();
  private sessionVersion = 0;

  constructor(
    public readonly id: SessionId,
    public readonly learnerId: LearnerId,
    private sessionState: SessionState,
    private readonly activity: CurrentActivity,
  ) {}

  get state(): SessionState { return this.sessionState; }
  get version(): number { return this.sessionVersion; }
  get currentActivity(): CurrentActivity { return this.activity; }
  get attempts(): readonly Attempt[] { return [...this.attemptsByAction.values()]; }

  findAttempt(clientActionId: ClientActionId): Attempt | undefined {
    return this.attemptsByAction.get(clientActionId);
  }

  findNextAction(clientActionId: ClientActionId): NextLearningAction | undefined {
    return this.resultsByAction.get(clientActionId);
  }

  assertCanSubmit(activityId: ActivityId, expectedVersion: number): void {
    if (this.sessionState !== "ACTIVE") throw new SessionNotActiveError(this.sessionState);
    if (this.activity.id !== activityId) throw new ActivityMismatchError();
    if (this.sessionVersion !== expectedVersion) {
      throw new StaleSessionError(expectedVersion, this.sessionVersion);
    }
  }

  acceptAttempt(data: AttemptData, expectedVersion: number): Attempt {
    const existing = this.attemptsByAction.get(data.clientActionId);
    if (existing) return existing;

    // Revalidate at the synchronous commit boundary. Assessment may have awaited
    // while another action advanced the session version.
    this.assertCanSubmit(data.activityId, expectedVersion);

    const attempt = new Attempt(data);
    this.attemptsByAction.set(data.clientActionId, attempt);
    this.sessionVersion += 1;
    return attempt;
  }

  recordNextAction(clientActionId: ClientActionId, action: NextLearningAction): void {
    this.resultsByAction.set(clientActionId, action);
  }
}
