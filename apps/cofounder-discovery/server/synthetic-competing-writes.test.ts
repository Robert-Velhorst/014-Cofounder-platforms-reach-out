import { describe, expect, it } from "vitest";
import { competingWrites } from "../scripts/synthetic-competing-writes";

function fixture(fault = "") {
  let title = "initial",
    version = 1,
    request = 0;
  const revision = () => version.toString(16).padStart(64, "0");
  const first = { id: 1, candidateId: 10, port: 1001 };
  const second = { ...first, port: fault === "sameSocket" ? 1001 : 1002 };
  return {
    pairs: [{ first, second }],
    async call(actor: typeof first, route: string, input: any) {
      const requestId = `00000000-0000-4000-8000-${String(++request).padStart(12, "0")}`;
      const response = (status: number, data?: unknown) => ({
        status,
        data,
        requestId,
        sentAt: 1,
        receivedAt: fault === "serial" ? 1 : 2,
        localPort: actor.port,
      });
      if (route.endsWith("details"))
        return response(200, {
          prospect: { id: 10, userId: fault === "foreign" ? 2 : 1, title },
          revision: revision(),
        });
      if (fault === "transport" && actor.port === 1002)
        throw new Error("test transport fault");
      if (title === input.patch.title)
        return response(200, {
          changed: fault === "duplicateChange",
          revision: revision(),
        });
      if (input.expectedRevision !== revision()) return response(409);
      title = input.patch.title;
      version++;
      return response(200, { changed: true, revision: revision() });
    },
  };
}

describe("finite overlapping same-owner HTTP workload", () => {
  it("accepts either connection winning instead of depending on array order", async () => {
    const f = fixture();
    const result = await competingWrites(
      f.pairs,
      async (actor, route, input) => {
        if (route.endsWith("edit") && actor.port === 1001)
          await new Promise<void>(resolve => setImmediate(resolve));
        return f.call(actor, route, input);
      }
    );
    expect(result[0].title).toBe("Synthetic race 1 different B");
    expect(result[1].title).toBe("Synthetic race 1 identical A");
  });
  it("checks conflicting and identical writes and retains winning request receipts", async () => {
    const f = fixture();
    const result = await competingWrites(f.pairs, f.call);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      accountId: 1,
      candidateId: 10,
      title: "Synthetic race 1 different A",
    });
    expect(result[1].title).toBe("Synthetic race 1 identical A");
    expect(result[0].requestId).not.toBe(result[1].requestId);
  });
  it.each(["sameSocket", "serial", "foreign", "duplicateChange", "transport"])(
    "rejects %s rather than claiming race coverage",
    async fault => {
      const f = fixture(fault);
      await expect(competingWrites(f.pairs, f.call)).rejects.toThrow();
    }
  );
  it("rejects empty or mismatched account pairs before calls", async () => {
    const f = fixture();
    await expect(competingWrites([], f.call)).rejects.toThrow();
    f.pairs[0].second.id = 2;
    await expect(competingWrites(f.pairs, f.call)).rejects.toThrow();
  });
});
