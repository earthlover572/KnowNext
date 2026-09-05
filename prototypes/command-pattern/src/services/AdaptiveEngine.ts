import type { AssessmentResult } from "../domain/AssessmentService.js";
import type { ConceptId } from "../domain/types.js";
import type { KnowledgeState } from "../ports/LearnerServicePort.js";

export type LearningActionType =
  | "TEACH"
  | "EXPLAIN_DIFFERENTLY"
  | "EXAMPLE"
  | "ANALOGY"
  | "PRACTICE"
  | "REINFORCE"
  | "ASSESS"
  | "BACKTRACK"
  | "ADVANCE"
  | "REVISIT";

export interface NextLearningAction {
  readonly type: LearningActionType;
  readonly conceptId: ConceptId;
  readonly description: string;
}

export interface AdaptiveContext {
  readonly assessment: AssessmentResult;
  readonly knowledgeState: KnowledgeState;
}

export interface AdaptiveEngine {
  chooseNextLearningAction(context: AdaptiveContext): Promise<NextLearningAction>;
}
