import { describe, expect, it, vi } from "vitest";
import { StudyActionInvoker } from "../src/application/StudyActionInvoker.js";

describe("StudyActionInvoker", () => {
  it("only delegates to command.execute", async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true });
    const result = await new StudyActionInvoker().execute({ execute });
    expect(execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });
});
