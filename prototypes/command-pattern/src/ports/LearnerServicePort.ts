export interface Evidence {
  attemptId: string;
  sessionId: string;
  learnerId: string;
  questionId: string;
  conceptId: string;
  submittedAnswer: string;
  score: number;
  occurredAt: Date;
}

export interface KnowledgeState {
  learnerId: string;
  masteryByConcept: Readonly<Record<string, number>>;
}

/** Port for the external Learner Service. */
export interface LearnerServicePort {
  sendEvidence(evidence: Evidence): Promise<void>;
  getKnowledgeState(learnerId: string): Promise<KnowledgeState>;
}
