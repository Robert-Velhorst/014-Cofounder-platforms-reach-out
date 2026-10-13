import { describe, expect, it, vi } from "vitest";
import { getDb } from "./db";
import { exportAccountData } from "./account-export";

// Hold the unavailable external storage boundary, not the admission implementation.
vi.mock("./db", () => ({ getDb: vi.fn() }));

const input = {
  userId: 1,
  accountId: 1,
  password: "SyntheticPassword123!",
  credentialHash: "synthetic-context-only",
  confirmation: true as const,
  requestId: "capacity-test",
};

describe("account export generation capacity", () => {
  it("rejects excess generation immediately and releases slots after storage failure", async () => {
    let release!: (value: null) => void;
    const storage = new Promise<null>(resolve => {
      release = resolve;
    });
    vi.mocked(getDb).mockReturnValue(storage);
    const settled = (promise: ReturnType<typeof exportAccountData>) =>
      promise.then(
        value => ({ value, code: "success" }),
        error => ({ code: error.code })
      );
    const first = settled(exportAccountData(input));
    const second = settled(
      exportAccountData({ ...input, accountId: 2, userId: 2 })
    );
    try {
      const excess = await Promise.race([
        settled(exportAccountData({ ...input, accountId: 3, userId: 3 })),
        new Promise(resolve =>
          setTimeout(() => resolve({ code: "still_waiting_for_storage" }), 100)
        ),
      ]);
      expect(excess).toEqual({ code: "TOO_MANY_REQUESTS" });
    } finally {
      release(null);
      await Promise.all([first, second]);
    }
    expect(await first).toEqual({ code: "SERVICE_UNAVAILABLE" });
    expect(await second).toEqual({ code: "SERVICE_UNAVAILABLE" });
    // A released slot reaches storage again rather than remaining permanently busy.
    expect(await settled(exportAccountData(input))).toEqual({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
