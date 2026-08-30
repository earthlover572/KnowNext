import type { Attempt } from "../domain/Attempt.js";
import type { KnowledgeState } from "../ports/LearnerServicePort.js";

export interface LearningAction {
  type: "PRACTICE" | "REVIEW" | "ADVANCE";
  conceptId: string;
  description: string;
}

export interface NextActionRequest {
  sessionId: string;
  learnerId: string;
  knowledgeState: KnowledgeState;
  latestAttempt: Attempt;
}

/** Collaborator responsible for pedagogical decisions. */
export interface AdaptiveEngine {
  recommendNextAction(request: NextActionRequest): Promise<LearningAction>;
}
