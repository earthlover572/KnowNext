import type { ActivityId, ConceptId } from "./types.js";

export interface AssessmentInput {
  readonly activityId: ActivityId;
  readonly conceptId: ConceptId;
  readonly submittedAnswer: string;
}

export interface AssessmentResult {
  readonly conceptId: ConceptId;
  readonly isCorrect: boolean;
  readonly score: number;
  readonly feedback: string;
}

export interface AssessmentService {
  assess(input: AssessmentInput): Promise<AssessmentResult>;
}

export class ExactAnswerAssessmentService implements AssessmentService {
  constructor(private readonly answers: ReadonlyMap<ActivityId, string>) {}

  async assess(input: AssessmentInput): Promise<AssessmentResult> {
    const expected = this.answers.get(input.activityId);
    if (expected === undefined) {
      throw new Error(`No answer key for activity ${input.activityId}`);
    }

    const isCorrect = input.submittedAnswer.trim() === expected.trim();
    return {
      conceptId: input.conceptId,
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? "Correct answer" : "Try again",
    };
  }
}
