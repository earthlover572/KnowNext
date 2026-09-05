import type { AssessmentResult } from "./AssessmentService.js";
import type {
  ActivityId,
  AttemptId,
  ClientActionId,
  ConceptId,
} from "./types.js";

export type EvidenceStatus = "PENDING" | "RECORDED";

export interface AttemptData {
  readonly id: AttemptId;
  readonly clientActionId: ClientActionId;
  readonly activityId: ActivityId;
  readonly conceptId: ConceptId;
  readonly submittedAnswer: string;
  readonly assessment: AssessmentResult;
  readonly acceptedAt: Date;
}

export class Attempt {
  private evidenceStatus: EvidenceStatus = "PENDING";

  constructor(private readonly data: AttemptData) {}

  get id(): AttemptId { return this.data.id; }
  get clientActionId(): ClientActionId { return this.data.clientActionId; }
  get activityId(): ActivityId { return this.data.activityId; }
  get conceptId(): ConceptId { return this.data.conceptId; }
  get submittedAnswer(): string { return this.data.submittedAnswer; }
  get assessment(): AssessmentResult { return this.data.assessment; }
  get evidence(): EvidenceStatus { return this.evidenceStatus; }

  markEvidenceRecorded(): void {
    this.evidenceStatus = "RECORDED";
  }
}
