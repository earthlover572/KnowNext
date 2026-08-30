import type { AssessmentResult } from "./AssessmentService.js";
import type { Evidence } from "../ports/LearnerServicePort.js";

export interface AttemptData {
  id: string;
  sessionId: string;
  learnerId: string;
  questionId: string;
  submittedAnswer: string;
  assessment: AssessmentResult;
  occurredAt: Date;
}

/** A minimal domain record created and retained by the LearningSession. */
export class Attempt {
  private constructor(private readonly data: AttemptData) {}

  static record(data: AttemptData): Attempt {
    return new Attempt(data);
  }

  get id(): string {
    return this.data.id;
  }

  get assessment(): AssessmentResult {
    return this.data.assessment;
  }

  toEvidence(): Evidence {
    return {
      attemptId: this.data.id,
      sessionId: this.data.sessionId,
      learnerId: this.data.learnerId,
      questionId: this.data.questionId,
      conceptId: this.data.assessment.conceptId,
      submittedAnswer: this.data.submittedAnswer,
      score: this.data.assessment.score,
      occurredAt: this.data.occurredAt,
    };
  }
}
