import type { AssessmentResult, AssessmentService } from "../domain/AssessmentService.js";
import { DuplicateActionError, EvidencePropagationError } from "../domain/errors.js";
import type { LearningSession } from "../domain/LearningSession.js";
import type { ActivityId, AttemptId, ClientActionId } from "../domain/types.js";
import type { LearnerServicePort } from "../ports/LearnerServicePort.js";
import type { AdaptiveEngine, NextLearningAction } from "../services/AdaptiveEngine.js";
import type { StudyCommand } from "./StudyCommand.js";

export interface SubmitAnswerInput {
  readonly clientActionId: ClientActionId;
  readonly activityId: ActivityId;
  readonly submittedAnswer: string;
  readonly expectedSessionVersion: number;
}

export interface StudyActionResult {
  readonly attemptId: AttemptId;
  readonly assessment: AssessmentResult;
  readonly nextAction: NextLearningAction;
}

export interface SubmitAnswerDependencies {
  readonly session: LearningSession;
  readonly assessmentService: AssessmentService;
  readonly learnerService: LearnerServicePort;
  readonly adaptiveEngine: AdaptiveEngine;
  readonly now?: () => Date;
}

export class SubmitAnswerCommand implements StudyCommand<StudyActionResult> {
  private readonly now: () => Date;

  constructor(
    private readonly input: SubmitAnswerInput,
    private readonly dependencies: SubmitAnswerDependencies,
  ) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async execute(): Promise<StudyActionResult> {
    const { session } = this.dependencies;
    let attempt = session.findAttempt(this.input.clientActionId);

    if (
      attempt
      && (attempt.activityId !== this.input.activityId
        || attempt.submittedAnswer !== this.input.submittedAnswer)
    ) {
      throw new DuplicateActionError();
    }

    if (!attempt) {
      session.assertCanSubmit(this.input.activityId, this.input.expectedSessionVersion);
      const assessment = await this.dependencies.assessmentService.assess({
        activityId: this.input.activityId,
        conceptId: session.currentActivity.conceptId,
        submittedAnswer: this.input.submittedAnswer,
      });

      const attemptNumber = session.attempts.length + 1;
      attempt = session.acceptAttempt(
        {
          id: `${session.id}-attempt-${attemptNumber}` as AttemptId,
          clientActionId: this.input.clientActionId,
          activityId: this.input.activityId,
          conceptId: session.currentActivity.conceptId,
          submittedAnswer: this.input.submittedAnswer,
          assessment,
          acceptedAt: this.now(),
        },
        this.input.expectedSessionVersion,
      );
    }

    const completedAction = session.findNextAction(this.input.clientActionId);
    if (completedAction) {
      return { attemptId: attempt.id, assessment: attempt.assessment, nextAction: completedAction };
    }

    if (attempt.evidence === "PENDING") {
      try {
        await this.dependencies.learnerService.recordEvidence({
          originAttemptId: attempt.id,
          learnerId: session.learnerId,
          conceptId: attempt.conceptId,
          score: attempt.assessment.score,
          observedAt: this.now(),
        });
        attempt.markEvidenceRecorded();
      } catch (cause) {
        throw new EvidencePropagationError(attempt.id, { cause });
      }
    }

    const knowledgeState = await this.dependencies.learnerService.getKnowledgeState(
      session.learnerId,
      attempt.conceptId,
    );
    const nextAction = await this.dependencies.adaptiveEngine.chooseNextLearningAction({
      assessment: attempt.assessment,
      knowledgeState,
    });
    session.recordNextAction(this.input.clientActionId, nextAction);

    return { attemptId: attempt.id, assessment: attempt.assessment, nextAction };
  }
}
