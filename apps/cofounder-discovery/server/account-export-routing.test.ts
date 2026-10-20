import { describe, expect, it } from "vitest";
import { permitsTrpcUrl } from "./route-policy";
describe("account export public runtime routing", () => {
  it("admits only the three reviewed deletion-intake operations", () => {
    for (const operation of [
      "deletionStatus",
      "requestDeletion",
      "withdrawDeletion",
    ])
      expect(permitsTrpcUrl(`/accountData.${operation}`, false)).toBe(true);
    expect(permitsTrpcUrl("/accountData.executeDeletion", false)).toBe(false);
    expect(
      permitsTrpcUrl("/accountData.requestDeletion,scheduler.start", false)
    ).toBe(false);
  });
  it("permits the reviewed account export without enabling legacy or arbitrary account mutations", () => {
    expect(permitsTrpcUrl("/accountData.export?batch=1", false)).toBe(true);
    expect(
      permitsTrpcUrl("/accountData.export,scheduler.start?batch=1", false)
    ).toBe(false);
    expect(permitsTrpcUrl("/accountData.unreviewedDelete", false)).toBe(false);
  });
});
