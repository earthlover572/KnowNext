import { Attempt } from "./Attempt.js";
import type { AssessmentResult } from "./AssessmentService.js";

export type LearningSessionStatus = "ACTIVE" | "PAUSED";

export class SessionActionNotAllowedError extends Error {
  constructor(sessionId: string, status: LearningSessionStatus) {
    super(`Session ${sessionId} cannot accept answers while it is ${status}`);
    this.name = "SessionActionNotAllowedError";
  }
}

interface RecordAttemptInput {
  learnerId: string;
  questionId: string;
  submittedAnswer: string;
  assessment: AssessmentResult;
}

/** Receiver with only the minimal status guard required by this prototype. */
export class LearningSession {
  private readonly attempts: Attempt[] = [];

  constructor(
    readonly id: string,
    private status: LearningSessionStatus,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  ensureAnswerSubmissionAllowed(): void {
    if (this.status !== "ACTIVE") {
      throw new SessionActionNotAllowedError(this.id, this.status);
    }
  }

  recordAttempt(input: RecordAttemptInput): Attempt {
    const attempt = Attempt.record({
      id: `${this.id}-attempt-${this.attempts.length + 1}`,
      sessionId: this.id,
      learnerId: input.learnerId,
      questionId: input.questionId,
      submittedAnswer: input.submittedAnswer,
      assessment: input.assessment,
      occurredAt: this.clock(),
    });

    this.attempts.push(attempt);
    return attempt;
  }

  get recordedAttempts(): readonly Attempt[] {
    return this.attempts;
  }
}
