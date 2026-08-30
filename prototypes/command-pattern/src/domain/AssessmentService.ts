export interface AssessmentRequest {
  questionId: string;
  submittedAnswer: string;
}

export interface AssessmentResult {
  conceptId: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

interface AnswerKeyEntry {
  conceptId: string;
  correctAnswer: string;
}

/** Domain service: assessment rules live here, outside the Command. */
export class AssessmentService {
  constructor(private readonly answerKey: Readonly<Record<string, AnswerKeyEntry>>) {}

  evaluate(request: AssessmentRequest): AssessmentResult {
    const expected = this.answerKey[request.questionId];

    if (!expected) {
      throw new Error(`Unknown question: ${request.questionId}`);
    }

    const isCorrect = request.submittedAnswer.trim() === expected.correctAnswer.trim();

    return {
      conceptId: expected.conceptId,
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? "Correct answer" : "Review the concept and try again",
    };
  }
}
