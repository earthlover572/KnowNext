import type {
  Evidence,
  KnowledgeState,
  LearnerServicePort,
} from "../ports/LearnerServicePort.js";

/** In-memory fake replacing the external Learner Service. */
export class InMemoryLearnerService implements LearnerServicePort {
  readonly sentEvidence: Evidence[] = [];
  readonly knowledgeStateRequests: string[] = [];

  constructor(private readonly knowledgeState: KnowledgeState) {}

  async sendEvidence(evidence: Evidence): Promise<void> {
    this.sentEvidence.push(evidence);
  }

  async getKnowledgeState(learnerId: string): Promise<KnowledgeState> {
    this.knowledgeStateRequests.push(learnerId);
    return this.knowledgeState;
  }
}
