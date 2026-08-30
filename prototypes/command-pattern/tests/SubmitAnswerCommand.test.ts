import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitAnswerCommand } from "../src/commands/SubmitAnswerCommand.js";
import { AssessmentService } from "../src/domain/AssessmentService.js";
import {
  LearningSession,
  SessionActionNotAllowedError,
} from "../src/domain/LearningSession.js";
import { InMemoryAdaptiveEngine } from "../src/fakes/InMemoryAdaptiveEngine.js";
import { InMemoryLearnerService } from "../src/fakes/InMemoryLearnerService.js";

describe("SubmitAnswerCommand", () => {
  const learnerId = "learner-1";
  const nextAction = {
    type: "PRACTICE" as const,
    conceptId: "fractions",
    description: "Practice equivalent fractions",
  };

  let assessmentService: AssessmentService;
  let learnerService: InMemoryLearnerService;
  let adaptiveEngine: InMemoryAdaptiveEngine;

  beforeEach(() => {
    assessmentService = new AssessmentService({
      "question-1": { conceptId: "fractions", correctAnswer: "3/4" },
    });
    learnerService = new InMemoryLearnerService({
      learnerId,
      masteryByConcept: { fractions: 0.6 },
    });
    adaptiveEngine = new InMemoryAdaptiveEngine(nextAction);
  });

  function createCommand(session: LearningSession): SubmitAnswerCommand {
    return new SubmitAnswerCommand(
      {
        learnerId,
        questionId: "question-1",
        submittedAnswer: "3/4",
      },
      session,
      assessmentService,
      learnerService,
      adaptiveEngine,
    );
  }

  it("allows an ACTIVE session and records an Attempt", async () => {
    const session = new LearningSession(
      "session-1",
      "ACTIVE",
      () => new Date("2026-01-01T00:00:00.000Z"),
    );

    const result = await createCommand(session).execute();

    expect(result.attemptId).toBe("session-1-attempt-1");
    expect(session.recordedAttempts).toHaveLength(1);
  });

  it("calls AssessmentService", async () => {
    const evaluate = vi.spyOn(assessmentService, "evaluate");

    await createCommand(new LearningSession("session-1", "ACTIVE")).execute();

    expect(evaluate).toHaveBeenCalledOnce();
    expect(evaluate).toHaveBeenCalledWith({
      questionId: "question-1",
      submittedAnswer: "3/4",
    });
  });

  it("sends Evidence through LearnerServicePort and gets updated knowledge state", async () => {
    await createCommand(new LearningSession("session-1", "ACTIVE")).execute();

    expect(learnerService.sentEvidence).toHaveLength(1);
    expect(learnerService.sentEvidence[0]).toMatchObject({
      attemptId: "session-1-attempt-1",
      learnerId,
      questionId: "question-1",
      conceptId: "fractions",
      score: 1,
    });
    expect(learnerService.knowledgeStateRequests).toEqual([learnerId]);
  });

  it("consults AdaptiveEngine with the updated knowledge state", async () => {
    await createCommand(new LearningSession("session-1", "ACTIVE")).execute();

    expect(adaptiveEngine.requests).toHaveLength(1);
    expect(adaptiveEngine.requests[0]?.knowledgeState).toEqual({
      learnerId,
      masteryByConcept: { fractions: 0.6 },
    });
  });

  it("returns a StudyActionResult with assessment and next action", async () => {
    const result = await createCommand(new LearningSession("session-1", "ACTIVE")).execute();

    expect(result).toEqual({
      attemptId: "session-1-attempt-1",
      assessment: {
        conceptId: "fractions",
        isCorrect: true,
        score: 1,
        feedback: "Correct answer",
      },
      nextAction,
    });
  });

  it("rejects SubmitAnswer when the session is PAUSED", async () => {
    const command = createCommand(new LearningSession("session-1", "PAUSED"));
    const evaluate = vi.spyOn(assessmentService, "evaluate");

    await expect(command.execute()).rejects.toThrow(SessionActionNotAllowedError);
    expect(evaluate).not.toHaveBeenCalled();
    expect(learnerService.sentEvidence).toHaveLength(0);
    expect(adaptiveEngine.requests).toHaveLength(0);
  });
});
