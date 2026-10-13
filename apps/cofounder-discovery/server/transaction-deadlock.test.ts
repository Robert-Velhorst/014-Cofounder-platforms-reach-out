import { describe, expect, it, vi } from "vitest";
import { retryRolledBackDeadlock } from "./transaction-deadlock";

const deadlock = () =>
  Object.assign(new Error("synthetic"), {
    code: "ER_LOCK_DEADLOCK",
    errno: 1213,
  });
describe("bounded retry of rolled-back MySQL deadlock victims", () => {
  it("retries a wrapped deadlock and returns the committed result", async () => {
    const work = vi
      .fn()
      .mockRejectedValueOnce(new Error("wrapped", { cause: deadlock() }))
      .mockResolvedValue("committed");
    await expect(retryRolledBackDeadlock(work)).resolves.toBe("committed");
    expect(work).toHaveBeenCalledTimes(2);
  });
  it("stops after three rolled-back attempts without granting admission", async () => {
    const failure = deadlock();
    const work = vi.fn().mockRejectedValue(failure);
    await expect(retryRolledBackDeadlock(work)).rejects.toBe(failure);
    expect(work).toHaveBeenCalledTimes(3);
  });
  it.each([
    new Error("network or commit ambiguity"),
    Object.assign(new Error(), { code: "ER_LOCK_WAIT_TIMEOUT", errno: 1205 }),
    Object.assign(new Error(), { code: "ER_LOCK_DEADLOCK", errno: 999 }),
    Object.assign(new Error(), { errno: 1213 }),
  ])("does not retry an unproven rollback or another error", async failure => {
    const work = vi.fn().mockRejectedValue(failure);
    await expect(retryRolledBackDeadlock(work)).rejects.toBe(failure);
    expect(work).toHaveBeenCalledTimes(1);
  });
});
