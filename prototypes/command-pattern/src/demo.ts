import { StudyActionInvoker } from "./application/StudyActionInvoker.js";
import { SubmitAnswerCommand } from "./commands/SubmitAnswerCommand.js";
import { ExactAnswerAssessmentService } from "./domain/AssessmentService.js";
import { LearningSession } from "./domain/LearningSession.js";
import { activityId, clientActionId, conceptId, learnerId, sessionId } from "./domain/types.js";
import { InMemoryAdaptiveEngine } from "./fakes/InMemoryAdaptiveEngine.js";
import { InMemoryLearnerService } from "./fakes/InMemoryLearnerService.js";

const fractions = conceptId("fractions");
const comparison = activityId("fraction-comparison-1");
const session = new LearningSession(
  sessionId("session-100"), learnerId("learner-1"), "ACTIVE",
  { id: comparison, conceptId: fractions },
);
const learnerService = new InMemoryLearnerService();
const command = new SubmitAnswerCommand(
  {
    clientActionId: clientActionId("browser-action-1"),
    activityId: comparison,
    submittedAnswer: "1/2",
    expectedSessionVersion: 0,
  },
  {
    session,
    assessmentService: new ExactAnswerAssessmentService(new Map([[comparison, "1/2"]])),
    learnerService,
    adaptiveEngine: new InMemoryAdaptiveEngine(),
  },
);

const result = await new StudyActionInvoker().execute(command);
console.log(JSON.stringify(result, null, 2));
console.log(`Evidence sent: ${learnerService.evidence.length}`);
console.log(`Attempts recorded: ${session.attempts.length}`);
