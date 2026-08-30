import type { StudyCommand } from "./StudyCommand.js";
import type { AssessmentResult, AssessmentService } from "../domain/AssessmentService.js";
import type { LearningSession } from "../domain/LearningSession.js";
import type { LearnerServicePort } from "../ports/LearnerServicePort.js";
import type { AdaptiveEngine, LearningAction } from "../services/AdaptiveEngine.js";

export interface SubmitAnswerInput {
  learnerId: string;
  questionId: string;
  submittedAnswer: string;
}

export interface StudyActionResult {
  attemptId: string;
  assessment: AssessmentResult;
  nextAction: LearningAction;
}

/** ConcreteCommand: coordinates the workflow but owns none of its domain rules. */
export class SubmitAnswerCommand implements StudyCommand<StudyActionResult> {
  constructor(
    private readonly input: SubmitAnswerInput,
    private readonly session: LearningSession,
    private readonly assessmentService: AssessmentService,
    private readonly learnerService: LearnerServicePort,
    private readonly adaptiveEngine: AdaptiveEngine,
  ) {}

  async execute(): Promise<StudyActionResult> {
    this.session.ensureAnswerSubmissionAllowed();

    const assessment = this.assessmentService.evaluate({
      questionId: this.input.questionId,
      submittedAnswer: this.input.submittedAnswer,
    });

    const attempt = this.session.recordAttempt({
      learnerId: this.input.learnerId,
      questionId: this.input.questionId,
      submittedAnswer: this.input.submittedAnswer,
      assessment,
    });

    await this.learnerService.sendEvidence(attempt.toEvidence());
    const knowledgeState = await this.learnerService.getKnowledgeState(this.input.learnerId);
    const nextAction = await this.adaptiveEngine.recommendNextAction({
      sessionId: this.session.id,
      learnerId: this.input.learnerId,
      knowledgeState,
      latestAttempt: attempt,
    });

    return {
      attemptId: attempt.id,
      assessment,
      nextAction,
    };
  }
}
