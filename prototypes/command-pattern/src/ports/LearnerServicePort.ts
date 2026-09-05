import type { AttemptId, ConceptId, LearnerId } from "../domain/types.js";

export interface KnowledgeEvidence {
  readonly originAttemptId: AttemptId;
  readonly learnerId: LearnerId;
  readonly conceptId: ConceptId;
  readonly score: number;
  readonly observedAt: Date;
}

export interface KnowledgeState {
  readonly learnerId: LearnerId;
  readonly conceptId: ConceptId;
  readonly mastery: number;
  readonly evidenceCount: number;
}

export interface LearnerServicePort {
  /** Idempotent by originAttemptId. Only Learner may update mastery. */
  recordEvidence(evidence: KnowledgeEvidence): Promise<void>;
  getKnowledgeState(learnerId: LearnerId, conceptId: ConceptId): Promise<KnowledgeState>;
}
