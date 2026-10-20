import { expect, it, vi } from "vitest";
// This test isolates draining, not authentication. Real database/API-boundary
// authorization is exercised by admin-mfa.integration.test.ts.
vi.mock("./admin-actor", () => ({
  adminActor: vi.fn(async () => ({ userId: 1 })),
}));
vi.mock("./admin-mfa", () => ({
  requireAdminStepUp: vi.fn(async () => undefined),
}));
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { applicationWork } from "./server-work";
import type { TrpcContext } from "./_core/context";

it("drains all three API access levels and prevents late procedure admission", async () => {
  let release!: () => void;
  let allEntered!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const entered = new Promise<void>(resolve => {
    allEntered = resolve;
  });
  let count = 0;
  const operation = async () => {
    count++;
    if (count === 3) allEntered();
    await gate;
    return "committed";
  };
  const api = router({
    public: publicProcedure.mutation(operation),
    protected: protectedProcedure.mutation(operation),
    admin: adminProcedure.mutation(operation),
  }).createCaller({
    user: { id: 1, role: "admin", emailVerified: 1 },
  } as TrpcContext);
  const admitted = Promise.all([api.public(), api.protected(), api.admin()]);
  try {
    await entered;
    let drained = false;
    const stopping = applicationWork.stop().then(() => {
      drained = true;
    });
    await new Promise(resolve => setImmediate(resolve));
    expect(drained).toBe(false);
    for (const call of [api.public, api.protected, api.admin]) {
      await expect(call()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    }
    expect(count).toBe(3);
    release();
    expect(await admitted).toEqual(["committed", "committed", "committed"]);
    await stopping;
    expect(drained).toBe(true);
  } finally {
    release();
    await admitted;
  }
});
