import type { StudyCommand } from "../commands/StudyCommand.js";

export class StudyActionInvoker {
  execute<TResult>(command: StudyCommand<TResult>): Promise<TResult> {
    return command.execute();
  }
}
