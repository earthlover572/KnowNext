import type { StudyCommand } from "../commands/StudyCommand.js";

/** Application-layer invoker. It knows the Command contract, not the study workflow. */
export class StudyActionInvoker {
  execute<TResult>(command: StudyCommand<TResult>): Promise<TResult> {
    return command.execute();
  }
}
