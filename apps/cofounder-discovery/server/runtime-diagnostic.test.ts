import { describe, expect, it, vi } from "vitest";
import { diagnoseRuntime } from "./runtime-diagnostic";
import { getConfig } from "./config";

const config = () =>
  getConfig({
    NODE_ENV: "test",
    APP_MODE: "test",
    JWT_SECRET: "synthetic-secret-with-at-least-thirty-two-characters",
    PUBLIC_ORIGIN: "https://private-fixture.invalid",
  });
const dependencies = () => ({
  loadConfig: config,
  checkDatabase: vi.fn(async () => "connected" as const),
  closeDatabase: vi.fn(async () => {}),
});
describe("safe runtime diagnostics", () => {
  it("reports narrow successful checks without values or acceptance claims", async () => {
    const deps = dependencies();
    const result = await diagnoseRuntime(false, deps);
    expect(result).toMatchObject({
      ok: true,
      runtimeChecksPassed: true,
      productionAcceptanceProven: false,
    });
    expect(JSON.stringify(result)).not.toMatch(
      /private-fixture|synthetic-secret/
    );
    expect(deps.closeDatabase).toHaveBeenCalledOnce();
  });
  it.each([false, true])(
    "withholds configuration failure details, allowMissing=%s",
    async allow => {
      const deps = dependencies();
      deps.loadConfig = () => {
        throw new Error("private-password and /private/path");
      };
      const result = await diagnoseRuntime(allow, deps);
      expect(result.ok).toBe(allow);
      expect(result.runtimeChecksPassed).toBe(false);
      expect(JSON.stringify(result)).not.toMatch(
        /private-password|private\/path/
      );
      expect(deps.checkDatabase).not.toHaveBeenCalled();
      expect(deps.closeDatabase).toHaveBeenCalledOnce();
    }
  );
  it.each([false, true])(
    "withholds database error details and cleans up, allowMissing=%s",
    async allow => {
      const deps = dependencies();
      deps.checkDatabase.mockRejectedValue(
        new Error("private-db-address:3306 private-credential")
      );
      const result = await diagnoseRuntime(allow, deps);
      expect(result.ok).toBe(allow);
      expect(result.runtimeChecksPassed).toBe(false);
      expect(JSON.stringify(result)).not.toMatch(
        /private-db-address|private-credential/
      );
      expect(deps.closeDatabase).toHaveBeenCalledOnce();
    }
  );
  it("fails on cleanup even when missing runtime is allowed", async () => {
    const deps = dependencies();
    deps.closeDatabase.mockRejectedValue(new Error("private cleanup stack"));
    const result = await diagnoseRuntime(true, deps);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private cleanup");
    expect(result.checks.at(-1)).toMatchObject({
      name: "cleanup",
      status: "fail",
    });
  });
  it("reports missing storage honestly", async () => {
    const deps = {
      ...dependencies(),
      checkDatabase: async () => "missing" as const,
    };
    expect(await diagnoseRuntime(false, deps)).toMatchObject({
      ok: false,
      runtimeChecksPassed: false,
    });
  });
});
