import { describe, expect, it, vi } from "vitest";
import { StudyActionInvoker } from "../src/application/StudyActionInvoker.js";
import type { StudyCommand } from "../src/commands/StudyCommand.js";

describe("StudyActionInvoker", () => {
  it("contains no study workflow and only delegates to the Command", async () => {
    const execute = vi.fn(async () => "command-result");
    const command: StudyCommand<string> = { execute };
    const invoker = new StudyActionInvoker();

    await expect(invoker.execute(command)).resolves.toBe("command-result");
    expect(execute).toHaveBeenCalledOnce();
    expect(StudyActionInvoker.length).toBe(0);
  });
});
