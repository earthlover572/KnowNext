import { StudyActionInvoker } from "./application/StudyActionInvoker.js";
import { SubmitAnswerCommand } from "./commands/SubmitAnswerCommand.js";
import { AssessmentService } from "./domain/AssessmentService.js";
import { LearningSession } from "./domain/LearningSession.js";
import { InMemoryAdaptiveEngine } from "./fakes/InMemoryAdaptiveEngine.js";
import { InMemoryLearnerService } from "./fakes/InMemoryLearnerService.js";

const learnerId = "learner-42";
const session = new LearningSession("session-100", "ACTIVE");
const assessmentService = new AssessmentService({
  "question-fractions-1": {
    conceptId: "fractions",
    correctAnswer: "3/4",
  },
});
const learnerService = new InMemoryLearnerService({
  learnerId,
  masteryByConcept: { fractions: 0.72 },
});
const adaptiveEngine = new InMemoryAdaptiveEngine({
  type: "PRACTICE",
  conceptId: "fractions",
  description: "Solve a fraction comparison exercise",
});

const command = new SubmitAnswerCommand(
  {
    learnerId,
    questionId: "question-fractions-1",
    submittedAnswer: "3/4",
  },
  session,
  assessmentService,
  learnerService,
  adaptiveEngine,
);

const result = await new StudyActionInvoker().execute(command);

console.log("StudyActionResult");
console.log(JSON.stringify(result, null, 2));
console.log(`Evidence sent: ${learnerService.sentEvidence.length}`);
console.log(`Attempts recorded: ${session.recordedAttempts.length}`);
