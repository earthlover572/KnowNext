import type {
  AdaptiveEngine,
  LearningAction,
  NextActionRequest,
} from "../services/AdaptiveEngine.js";

/** Configurable fake replacing a real adaptive or AI-backed engine. */
export class InMemoryAdaptiveEngine implements AdaptiveEngine {
  readonly requests: NextActionRequest[] = [];

  constructor(private readonly nextAction: LearningAction) {}

  async recommendNextAction(request: NextActionRequest): Promise<LearningAction> {
    this.requests.push(request);
    return this.nextAction;
  }
}
