import type { AdaptiveContext, AdaptiveEngine, NextLearningAction } from "../services/AdaptiveEngine.js";

export class InMemoryAdaptiveEngine implements AdaptiveEngine {
  async chooseNextLearningAction(context: AdaptiveContext): Promise<NextLearningAction> {
    if (context.knowledgeState.mastery >= 0.8) {
      return {
        type: "PRACTICE",
        conceptId: context.assessment.conceptId,
        description: "Solve a fraction comparison exercise",
      };
    }
    return {
      type: "EXPLAIN_DIFFERENTLY",
      conceptId: context.assessment.conceptId,
      description: "Review the concept with a different explanation",
    };
  }
}
