/** Finite test-only HTTP workload. Caller must supply two independent connections. */
import assert from "node:assert/strict";
import { drainWorkers } from "./synthetic-workspace-write-load";

type Actor = { id: number; candidateId: number };
type Response = {
  status: number;
  data: any;
  requestId: string;
  sentAt: number;
  receivedAt: number;
  localPort: number;
};
type Call<A> = (
  actor: A,
  route: string,
  input: unknown,
  mutation?: boolean
) => Promise<Response>;

export async function competingWrites<A extends Actor>(
  pairs: { first: A; second: A }[],
  call: Call<A>
) {
  assert.ok(pairs.length > 0 && pairs.length <= 100);
  assert.equal(new Set(pairs.map(p => p.first.id)).size, pairs.length);
  for (const { first, second } of pairs) {
    assert.ok(Number.isSafeInteger(first.id) && first.id > 0);
    assert.ok(Number.isSafeInteger(first.candidateId) && first.candidateId > 0);
    assert.equal(first.id, second.id);
    assert.equal(first.candidateId, second.candidateId);
    assert.notEqual(first, second);
  }
  const receipts: {
    accountId: number;
    candidateId: number;
    title: string;
    requestId: string;
  }[] = [];
  await drainWorkers(pairs, 5, async ({ first, second }) => {
    for (const identical of [false, true]) {
      const identity = { accountId: first.id, id: first.candidateId };
      const review = await call(
        first,
        "criticalPath.prospects.details",
        identity
      );
      assert.equal(review.status, 200);
      assert.equal(review.data.prospect.userId, first.id);
      assert.equal(review.data.prospect.id, first.candidateId);
      assert.match(review.data.revision, /^[a-f0-9]{64}$/);
      const titles = [
        `Synthetic race ${first.id} ${identical ? "identical" : "different"} A`,
        `Synthetic race ${first.id} different B`,
      ];
      if (identical) titles[1] = titles[0];
      // allSettled drains both connections even if one rejects; never auto-retry.
      const settled = await Promise.allSettled(
        [first, second].map((actor, i) =>
          call(
            actor,
            "criticalPath.prospects.edit",
            {
              ...identity,
              expectedRevision: review.data.revision,
              patch: { title: titles[i] },
            },
            true
          )
        )
      );
      assert.ok(
        settled.every(r => r.status === "fulfilled"),
        "Race transport failure"
      );
      const responses = settled.map(
        r => (r as PromiseFulfilledResult<Response>).value
      );
      assert.notEqual(
        responses[0].localPort,
        responses[1].localPort,
        "Connections must be independent"
      );
      for (const result of responses) {
        assert.ok(
          Number.isSafeInteger(result.localPort) && result.localPort > 0
        );
        assert.ok(
          Number.isFinite(result.sentAt) && Number.isFinite(result.receivedAt)
        );
        assert.ok(result.sentAt > 0 && result.receivedAt >= result.sentAt);
        assert.match(result.requestId, /^[a-f0-9-]{36}$/i);
      }
      assert.notEqual(responses[0].requestId, responses[1].requestId);
      assert.ok(
        Math.max(...responses.map(r => r.sentAt)) <
          Math.min(...responses.map(r => r.receivedAt)),
        "Requests did not overlap on the wire"
      );
      assert.deepEqual(
        responses.map(r => r.status).sort(),
        identical ? [200, 200] : [200, 409]
      );
      const winner = responses.findIndex(
        r => r.status === 200 && r.data?.changed === true
      );
      assert.ok(winner >= 0);
      assert.equal(responses.filter(r => r.data?.changed === true).length, 1);
      if (identical) {
        assert.equal(responses[1 - winner].data.changed, false);
        assert.equal(
          responses[1 - winner].data.revision,
          responses[winner].data.revision
        );
      } else assert.equal(responses[1 - winner].data, undefined);
      const saved = await call(
        second,
        "criticalPath.prospects.details",
        identity
      );
      assert.equal(saved.status, 200);
      assert.equal(saved.data.prospect.title, titles[winner]);
      assert.equal(saved.data.prospect.userId, first.id);
      assert.equal(saved.data.revision, responses[winner].data.revision);
      assert.notEqual(saved.data.revision, review.data.revision);
      receipts.push({
        accountId: first.id,
        candidateId: first.candidateId,
        title: titles[winner],
        requestId: responses[winner].requestId,
      });
    }
  });
  return receipts;
}
