import type { LearnerServicePort, KnowledgeEvidence, KnowledgeState } from "../ports/LearnerServicePort.js";
import type { AttemptId, ConceptId, LearnerId } from "../domain/types.js";

export class InMemoryLearnerService implements LearnerServicePort {
  private readonly evidenceByAttempt = new Map<AttemptId, KnowledgeEvidence>();
  public failNextRecord = false;

  get evidence(): readonly KnowledgeEvidence[] {
    return [...this.evidenceByAttempt.values()];
  }

  async recordEvidence(evidence: KnowledgeEvidence): Promise<void> {
    if (this.failNextRecord) {
      this.failNextRecord = false;
      throw new Error("Learner Service unavailable");
    }
    this.evidenceByAttempt.set(evidence.originAttemptId, evidence);
  }

  async getKnowledgeState(learnerId: LearnerId, conceptId: ConceptId): Promise<KnowledgeState> {
    const relevant = this.evidence.filter(
      (item) => item.learnerId === learnerId && item.conceptId === conceptId,
    );
    const mastery = relevant.length === 0
      ? 0
      : relevant.reduce((sum, item) => sum + item.score, 0) / relevant.length;
    return { learnerId, conceptId, mastery, evidenceCount: relevant.length };
  }
}
