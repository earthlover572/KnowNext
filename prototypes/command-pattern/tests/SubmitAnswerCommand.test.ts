import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitAnswerCommand } from "../src/commands/SubmitAnswerCommand.js";
import type { AssessmentService } from "../src/domain/AssessmentService.js";
import {
  DuplicateActionError,
  EvidencePropagationError,
  SessionNotActiveError,
  StaleSessionError,
} from "../src/domain/errors.js";
import { LearningSession, type SessionState } from "../src/domain/LearningSession.js";
import { activityId, clientActionId, conceptId, learnerId, sessionId } from "../src/domain/types.js";
import { InMemoryLearnerService } from "../src/fakes/InMemoryLearnerService.js";
import type { AdaptiveEngine, NextLearningAction } from "../src/services/AdaptiveEngine.js";

const ids = {
  activity: activityId("activity-1"),
  concept: conceptId("fractions"),
  action: clientActionId("action-1"),
};

function fixture(state: SessionState = "ACTIVE") {
  const calls: string[] = [];
  const session = new LearningSession(
    sessionId("session-100"), learnerId("learner-1"), state,
    { id: ids.activity, conceptId: ids.concept },
  );
  const assessmentService: AssessmentService = {
    assess: vi.fn(async () => {
      calls.push("assess");
      return { conceptId: ids.concept, isCorrect: true, score: 1, feedback: "Correct answer" };
    }),
  };
  const learnerService = new InMemoryLearnerService();
  const originalRecord = learnerService.recordEvidence.bind(learnerService);
  learnerService.recordEvidence = vi.fn(async (evidence) => {
    calls.push("evidence");
    return originalRecord(evidence);
  });
  const originalGet = learnerService.getKnowledgeState.bind(learnerService);
  learnerService.getKnowledgeState = vi.fn(async (learner, concept) => {
    calls.push("knowledge");
    return originalGet(learner, concept);
  });
  const adaptiveEngine: AdaptiveEngine = {
    chooseNextLearningAction: vi.fn(async (): Promise<NextLearningAction> => {
      calls.push("adapt");
      return { type: "PRACTICE", conceptId: ids.concept, description: "Practice" };
    }),
  };
  const makeCommand = (
    expectedSessionVersion = 0,
    action = ids.action,
  ) => new SubmitAnswerCommand(
    {
      clientActionId: action,
      activityId: ids.activity,
      submittedAnswer: "1/2",
      expectedSessionVersion,
    },
    { session, assessmentService, learnerService, adaptiveEngine },
  );
  return { session, assessmentService, learnerService, adaptiveEngine, makeCommand, calls };
}

describe("SubmitAnswerCommand", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("coordinates assessment, durable attempt, evidence, knowledge and adaptation in order", async () => {
    const f = fixture();
    const result = await f.makeCommand().execute();
    expect(result).toMatchObject({
      attemptId: "session-100-attempt-1",
      assessment: { isCorrect: true, score: 1 },
      nextAction: { type: "PRACTICE" },
    });
    expect(f.calls).toEqual(["assess", "evidence", "knowledge", "adapt"]);
    expect(f.session.attempts).toHaveLength(1);
    expect(f.learnerService.evidence).toHaveLength(1);
  });

  it("rejects submit while paused", async () => {
    const f = fixture("PAUSED");
    await expect(f.makeCommand().execute()).rejects.toBeInstanceOf(SessionNotActiveError);
    expect(f.session.attempts).toHaveLength(0);
  });

  it("rejects a stale new action", async () => {
    const f = fixture();
    await expect(f.makeCommand(7).execute()).rejects.toBeInstanceOf(StaleSessionError);
  });

  it("is idempotent for the same clientActionId", async () => {
    const f = fixture();
    const first = await f.makeCommand().execute();
    const second = await f.makeCommand().execute();
    expect(second).toEqual(first);
    expect(f.session.attempts).toHaveLength(1);
    expect(f.learnerService.evidence).toHaveLength(1);
    expect(f.assessmentService.assess).toHaveBeenCalledOnce();
    expect(f.adaptiveEngine.chooseNextLearningAction).toHaveBeenCalledOnce();
  });

  it("rejects reuse of a clientActionId with a different payload", async () => {
    const f = fixture();
    await f.makeCommand().execute();
    const conflicting = new SubmitAnswerCommand(
      {
        clientActionId: ids.action,
        activityId: ids.activity,
        submittedAnswer: "different answer",
        expectedSessionVersion: 0,
      },
      {
        session: f.session,
        assessmentService: f.assessmentService,
        learnerService: f.learnerService,
        adaptiveEngine: f.adaptiveEngine,
      },
    );
    await expect(conflicting.execute()).rejects.toBeInstanceOf(DuplicateActionError);
    expect(f.session.attempts).toHaveLength(1);
  });

  it("preserves the attempt and does not adapt when Learner fails", async () => {
    const f = fixture();
    f.learnerService.failNextRecord = true;
    await expect(f.makeCommand().execute()).rejects.toBeInstanceOf(EvidencePropagationError);
    expect(f.session.attempts).toHaveLength(1);
    expect(f.session.attempts[0]?.evidence).toBe("PENDING");
    expect(f.learnerService.getKnowledgeState).not.toHaveBeenCalled();
    expect(f.adaptiveEngine.chooseNextLearningAction).not.toHaveBeenCalled();
  });

  it("recovers forward without duplicating the attempt after Learner recovers", async () => {
    const f = fixture();
    f.learnerService.failNextRecord = true;
    await expect(f.makeCommand().execute()).rejects.toBeInstanceOf(EvidencePropagationError);
    const result = await f.makeCommand().execute();
    expect(result.attemptId).toBe("session-100-attempt-1");
    expect(f.session.attempts).toHaveLength(1);
    expect(f.learnerService.evidence).toHaveLength(1);
    expect(f.assessmentService.assess).toHaveBeenCalledOnce();
  });

  it("Learner records evidence idempotently by attemptId", async () => {
    const f = fixture();
    await f.makeCommand().execute();
    const evidence = f.learnerService.evidence[0];
    expect(evidence).toBeDefined();
    await f.learnerService.recordEvidence(evidence!);
    expect(f.learnerService.evidence).toHaveLength(1);
  });

  it("retries adaptation without resending evidence after Adaptive Engine fails", async () => {
    const f = fixture();
    vi.mocked(f.adaptiveEngine.chooseNextLearningAction)
      .mockRejectedValueOnce(new Error("Adaptive Engine unavailable"))
      .mockResolvedValueOnce({ type: "PRACTICE", conceptId: ids.concept, description: "Practice" });

    await expect(f.makeCommand().execute()).rejects.toThrow("Adaptive Engine unavailable");
    expect(f.session.attempts[0]?.evidence).toBe("RECORDED");
    await expect(f.makeCommand().execute()).resolves.toMatchObject({ nextAction: { type: "PRACTICE" } });
    expect(f.learnerService.recordEvidence).toHaveBeenCalledOnce();
    expect(f.adaptiveEngine.chooseNextLearningAction).toHaveBeenCalledTimes(2);
  });

  it("rejects the second concurrent action committed against a stale version", async () => {
    const f = fixture();
    const first = f.makeCommand(0, clientActionId("concurrent-1"));
    const second = f.makeCommand(0, clientActionId("concurrent-2"));

    const outcomes = await Promise.allSettled([first.execute(), second.execute()]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    const rejection = outcomes.find((outcome) => outcome.status === "rejected");
    expect(rejection).toMatchObject({ status: "rejected", reason: expect.any(StaleSessionError) });
    expect(f.session.attempts).toHaveLength(1);
  });
});
