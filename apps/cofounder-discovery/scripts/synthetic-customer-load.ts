/** Synthetic read/write acceptance only. Never use against a customer database. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Agent, request } from "node:http";
import { performance } from "node:perf_hooks";
import mysql from "mysql2/promise";
import { competingWrites } from "./synthetic-competing-writes";
import { createSyntheticHttpAgent } from "./synthetic-http-agent";
import { arrivalLoad } from "./synthetic-arrival-load";
import { hashPassword } from "../server/auth-password";
import { readRuntimeSecret } from "../server/runtime-secrets";
import {
  drainWorkers as parallel,
  workspaceWriteTier,
  syntheticTitle,
} from "./synthetic-workspace-write-load";

const accounts = 100;
const candidatesPerAccount = 100;
const rounds = 10;
const url = new URL(readRuntimeSecret("DATABASE_URL") ?? "invalid:");
assert.equal(process.env.RUN_SYNTHETIC_CUSTOMER_LOAD, "true");
assert.equal(url.protocol, "mysql:");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.pathname, "/cofounder_test");
const port = Number(process.env.PORT ?? 3000);
assert.ok(Number.isSafeInteger(port) && port > 0 && port < 65536);
const db = await mysql.createConnection(url.toString());
const agents: Agent[] = [];
type Actor = {
  id: number;
  email: string;
  candidateId: number;
  cookie: string;
  agent: Agent;
  localAddress: string;
};
type Result = {
  status: number;
  ms: number;
  data: any;
  cookie: string;
  retry: string | undefined;
  requestId: string;
  sentAt: number;
  receivedAt: number;
  localPort: number;
};
const actors: Actor[] = [];
let phase = "empty_database_check";
let lastResponse:
  | {
      route: string;
      status: number;
      hasResult: boolean;
      hasCookie: boolean;
      failureBoundary: string;
    }
  | undefined;
async function call(
  actor: Actor,
  route: string,
  input?: unknown,
  mutation = false
): Promise<Result> {
  const body = JSON.stringify({ json: input ?? null });
  const started = performance.now();
  return await new Promise((resolve, reject) => {
    let sentAt = 0;
    let localPort = 0;
    const req = request(
      {
        hostname: "127.0.0.1",
        port,
        agent: actor.agent,
        method: mutation ? "POST" : "GET",
        path: `/api/trpc/${route}${mutation ? "" : `?input=${encodeURIComponent(body)}`}`,
        headers: {
          "content-type": "application/json",
          ...(mutation ? { origin: `http://127.0.0.1:${port}` } : {}),
          ...(actor.cookie ? { cookie: actor.cookie } : {}),
        },
      },
      res => {
        const receivedAt = performance.now();
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000) res.destroy(new Error("response_size_limit"));
          else chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            lastResponse = {
              route,
              status: res.statusCode ?? 0,
              hasResult: parsed.result?.data !== undefined,
              hasCookie: Boolean(res.headers["set-cookie"]?.length),
              failureBoundary:
                parsed.error?.json?.message ===
                "Sign-in is temporarily unavailable. Please try again."
                  ? "login_admission"
                  : parsed.error?.json?.message ===
                      "Account service is temporarily unavailable. Please try again."
                    ? "session_creation"
                    : "other_or_success",
            };
            resolve({
              status: res.statusCode ?? 0,
              ms: performance.now() - started,
              data: parsed.result?.data?.json,
              cookie: (res.headers["set-cookie"] ?? [])
                .map(v => v.split(";")[0])
                .join("; "),
              retry: res.headers["retry-after"] as string | undefined,
              requestId: String(res.headers["x-request-id"] ?? ""),
              sentAt,
              receivedAt,
              localPort,
            });
          } catch {
            reject(new Error("invalid_response_envelope"));
          }
        });
      }
    );
    req.setTimeout(10_000, () => req.destroy(new Error("request_timeout")));
    req.on("finish", () => {
      sentAt = performance.now();
      localPort = req.socket?.localPort ?? 0;
    });
    req.on("error", reject);
    req.end(mutation ? body : undefined);
  });
}
function summary(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p: number) =>
    Number(
      (sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] ?? 0).toFixed(2)
    );
  return {
    count: values.length,
    p50ms: percentile(0.5),
    p95ms: percentile(0.95),
    p99ms: percentile(0.99),
  };
}
try {
  phase = "application_readiness";
  let ready = false;
  const deadline = performance.now() + 30_000;
  while (performance.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/ready`, {
        signal: AbortSignal.timeout(1000),
      });
      ready = response.status === 200;
      await response.arrayBuffer();
    } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Application did not become ready");
  phase = "empty_database_check";
  // Requiring every non-migration table empty prevents reuse of customer fixtures.
  const [tables] = await db.query<any[]>(
    "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
  );
  for (const { name } of tables) {
    if (name === "__drizzle_migrations") continue;
    assert.match(name, /^[A-Za-z0-9_]+$/);
    const [rows] = await db.query<any[]>(
      `SELECT COUNT(*) AS n FROM \`${name}\``
    );
    assert.equal(
      Number(rows[0].n),
      0,
      "Synthetic load requires a fresh empty database"
    );
  }
  phase = "synthetic_fixture_setup";
  const password = `Synthetic-only-A1-${randomBytes(24).toString("hex")}`;
  const passwordHash = await hashPassword(password);
  await db.beginTransaction();
  for (let n = 0; n < accounts; n++) {
    const email = `load-${n}@example.invalid`;
    const [user] = await db.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (openId,name,email,loginMethod,password_hash,emailVerified) VALUES (?,?,?,'email',?,1)",
      [`synthetic-load-${n}`, `Synthetic actor ${n}`, email, passwordHash]
    );
    await db.execute(
      "INSERT INTO user_profiles (user_id,bio,is_public) VALUES (?, ?, 0)",
      [user.insertId, `Synthetic profile ${n}`]
    );
    let candidateId = 0;
    for (let c = 0; c < candidatesPerAccount; c++) {
      const [candidate] = await db.execute<mysql.ResultSetHeader>(
        "INSERT INTO prospects (user_id,name,title,platform,source_kind,consent_status) VALUES (?,?,'Synthetic role','manual','manual','unknown')",
        [user.insertId, `Synthetic ${n} candidate ${c}`]
      );
      if (!c) candidateId = candidate.insertId;
    }
    // Genuine separate loopback source addresses: no forwarded-IP spoofing.
    const agent = createSyntheticHttpAgent(`127.0.1.${n + 1}`);
    agents.push(agent);
    actors.push({
      id: user.insertId,
      email,
      candidateId,
      cookie: "",
      agent,
      localAddress: `127.0.1.${n + 1}`,
    });
  }
  await db.commit();
  console.log(
    JSON.stringify({
      event: "fixture_ready",
      accounts,
      candidates: accounts * candidatesPerAccount,
      notice:
        "Direct synthetic fixtures bypass registration, verification delivery and intake. No provider calls.",
    })
  );
  const loginMs: number[] = [];
  phase = "real_http_login";
  await parallel(actors, 5, async actor => {
    const result = await call(
      actor,
      "auth.login",
      { email: actor.email, password },
      true
    );
    assert.equal(result.status, 200, "Real HTTP login failed");
    assert.equal(result.data.id, actor.id);
    assert.ok(result.cookie);
    actor.cookie = result.cookie;
    loginMs.push(result.ms);
  });
  console.log(JSON.stringify({ event: "login", ...summary(loginMs) }));
  const [quotaRows] = await db.query<any[]>(
    "SELECT used FROM login_attempt_quotas WHERE quota_key = 'login-global-v1'"
  );
  assert.equal(
    quotaRows[0]?.used,
    accounts,
    "Every real login must consume exactly one durable admission"
  );
  async function read(actor: Actor, operation: number): Promise<Result> {
    switch (operation % 6) {
      case 0:
        return call(actor, "auth.me");
      case 1:
        return call(actor, "profile.get", { accountId: actor.id });
      case 2:
        return call(actor, "criticalPath.prospects.list", {
          accountId: actor.id,
          page: 1,
          pageSize: 25,
        });
      case 3:
        return call(actor, "criticalPath.prospects.details", {
          accountId: actor.id,
          id: actor.candidateId,
        });
      case 4:
        return call(actor, "criticalPath.status");
      default:
        return call(actor, "criticalPath.platforms");
    }
  }
  function check(actor: Actor, operation: number, result: Result) {
    const data = result.data;
    assert.notEqual(data, undefined, "Missing tRPC result");
    switch (operation % 6) {
      case 0:
        assert.equal(data.id, actor.id);
        break;
      case 1:
        assert.equal(data.userId, actor.id);
        break;
      case 2:
        assert.equal(data.total, candidatesPerAccount);
        assert.equal(data.items.length, 25);
        assert.ok(data.items.every((row: any) => row.userId === actor.id));
        break;
      case 3:
        assert.equal(data.prospect.userId, actor.id);
        assert.equal(data.prospect.id, actor.candidateId);
        break;
      case 4:
        assert.equal(data.actor.id, actor.id);
        break;
      case 5:
        assert.ok(Array.isArray(data) && data.length > 0);
        break;
    }
  }
  phase = "warmup";
  await parallel(actors, 5, async actor => {
    for (let op = 0; op < 6; op++) {
      const result = await read(actor, op);
      assert.equal(result.status, 200);
      check(actor, op, result);
    }
  });
  phase = "cross_owner_isolation";
  // Check both supplied-account mismatch and another owner's candidate ID.
  await parallel(actors, 5, async actor => {
    const other = actors[(actors.indexOf(actor) + 1) % actors.length];
    for (const [route, input, status] of [
      ["profile.get", { accountId: other.id }, 403],
      ["criticalPath.prospects.list", { accountId: other.id }, 403],
      [
        "criticalPath.prospects.details",
        { accountId: actor.id, id: other.candidateId },
        404,
      ],
    ] as const) {
      const result = await call(actor, route, input);
      assert.equal(result.status, status);
      assert.equal(result.data, undefined);
    }
  });
  console.log(
    JSON.stringify({
      event: "warmup_and_isolation",
      warmupRequests: 600,
      crossOwnerDenials: 300,
    })
  );
  for (const concurrency of [5, 20, 100]) {
    phase = `measured_tier_${concurrency}`;
    const latency: number[] = [],
      successes: number[] = [];
    const statuses: Record<string, number> = {};
    const operationNames = [
      "identity",
      "profile",
      "candidateList",
      "candidateDetails",
      "runtimeStatus",
      "sourceCatalogue",
    ];
    const byOperation = operationNames.map(() => ({
      successfulMs: [] as number[],
      statuses: {} as Record<string, number>,
    }));
    let transportErrors = 0,
      badRetryHeaders = 0,
      correctnessErrors = 0;
    const started = performance.now();
    await parallel(actors, concurrency, async actor => {
      for (let round = 0; round < rounds; round++) {
        for (let op = 0; op < 6; op++) {
          try {
            const result = await read(actor, op);
            latency.push(result.ms);
            statuses[result.status] = (statuses[result.status] ?? 0) + 1;
            const operationResult = byOperation[op];
            operationResult.statuses[result.status] =
              (operationResult.statuses[result.status] ?? 0) + 1;
            if (result.status === 200) {
              successes.push(result.ms);
              operationResult.successfulMs.push(result.ms);
              try {
                check(actor, op, result);
              } catch {
                correctnessErrors++;
              }
            } else if (
              result.status === 503 &&
              !/^[1-9]\d*$/.test(result.retry ?? "")
            )
              badRetryHeaders++;
          } catch {
            transportErrors++;
          }
        }
      }
    });
    const seconds = (performance.now() - started) / 1000;
    const pass =
      !transportErrors &&
      !badRetryHeaders &&
      !correctnessErrors &&
      Object.keys(statuses).every(
        status => status === "200" || (concurrency === 100 && status === "503")
      ) &&
      successes.length > 0 &&
      (concurrency === 100 || summary(successes).p95ms < 2000);
    console.log(
      JSON.stringify({
        event: "load_tier",
        concurrency,
        requests: accounts * rounds * 6,
        elapsedSeconds: Number(seconds.toFixed(2)),
        successfulRequestsPerSecond: Number(
          (successes.length / seconds).toFixed(2)
        ),
        statuses,
        allResponses: summary(latency),
        successfulResponses: summary(successes),
        byOperation: Object.fromEntries(
          operationNames.map((name, index) => [
            name,
            {
              statuses: byOperation[index].statuses,
              successfulResponses: summary(byOperation[index].successfulMs),
            },
          ])
        ),
        transportErrors,
        badRetryHeaders,
        correctnessErrors,
        pass,
      })
    );
    if (!pass) process.exitCode = 1;
  }
  for (const arrivalsPerSecond of [50, 150, 500]) {
    phase = `scheduled_arrival_tier_${arrivalsPerSecond}`;
    const busyActors = new Set<number>();
    const statuses: Record<string, number> = {};
    let badRetryHeaders = 0,
      correctnessErrors = 0;
    const ownerSuccesses = actors.map(() => 0);
    const result = await arrivalLoad(
      {
        count: arrivalsPerSecond * 10,
        intervalMs: 1000 / arrivalsPerSecond,
        maxInFlight: 100,
        maxStartLagMs: 50,
      },
      index => {
        const actorIndex = index % actors.length;
        const actor = actors[actorIndex];
        if (busyActors.has(actor.id)) return null;
        busyActors.add(actor.id);
        const operation = Math.floor(index / actors.length) % 6;
        return read(actor, operation)
          .then(response => {
            statuses[response.status] = (statuses[response.status] ?? 0) + 1;
            if (response.status === 200) {
              try {
                check(actor, operation, response);
                ownerSuccesses[actorIndex]++;
              } catch {
                correctnessErrors++;
              }
            } else if (
              response.status === 503 &&
              !/^[1-9]\d*$/.test(response.retry ?? "")
            ) {
              badRetryHeaders++;
            }
          })
          .finally(() => busyActors.delete(actor.id));
      }
    );
    const overload = arrivalsPerSecond === 500;
    const pass =
      result.failed === 0 &&
      result.droppedLate === 0 &&
      !correctnessErrors &&
      !badRetryHeaders &&
      ownerSuccesses.some(n => n > 0) &&
      Object.keys(statuses).every(
        status => status === "200" || (overload && status === "503")
      ) &&
      (overload ||
        (result.started === result.offered &&
          result.scheduledResponses.p95ms < 2000));
    console.log(
      JSON.stringify({
        event: "scheduled_arrival_tier",
        arrivalsPerSecond,
        durationSeconds: 10,
        ...result,
        statuses,
        correctnessErrors,
        badRetryHeaders,
        ownerSuccessfulMin: Math.min(...ownerSuccesses),
        ownerSuccessfulMax: Math.max(...ownerSuccesses),
        pass,
      })
    );
    if (!pass) process.exitCode = 1;
  }
  phase = "write_storage_baseline";
  const [before] = await db.query<any[]>("SELECT * FROM prospects ORDER BY id");
  assert.equal(before.length, accounts * candidatesPerAccount);
  for (const concurrency of [5, 20]) {
    phase = `workspace_write_tier_${concurrency}`;
    const result = await workspaceWriteTier(actors, concurrency, rounds, call);
    // Reconnect independently: HTTP responses alone do not prove persisted rows.
    const persisted = await mysql.createConnection(url.toString());
    try {
      const [after] = await persisted.query<any[]>(
        "SELECT * FROM prospects ORDER BY id"
      );
      assert.equal(after.length, before.length);
      const edited = new Map(actors.map(actor => [actor.candidateId, actor]));
      for (let index = 0; index < after.length; index++) {
        const original = before[index];
        const actual = after[index];
        const actor = edited.get(original.id);
        if (!actor) assert.deepEqual(actual, original);
        else {
          assert.equal(
            actual.title,
            syntheticTitle(actor, concurrency, rounds - 1)
          );
          assert.equal(actual.archived_at, null);
          for (const key of Object.keys(original))
            if (key !== "title" && key !== "last_updated")
              assert.deepEqual(actual[key], original[key]);
        }
      }
      const [audits] = await persisted.query<any[]>(
        "SELECT user_id, action, COUNT(*) AS n FROM audit_events WHERE action IN ('prospect.edit','prospect.archive','prospect.restore') GROUP BY user_id, action"
      );
      assert.equal(audits.length, accounts * 3);
      for (const actor of actors)
        for (const action of [
          "prospect.edit",
          "prospect.archive",
          "prospect.restore",
        ])
          assert.equal(
            Number(
              audits.find(
                row => row.user_id === actor.id && row.action === action
              )?.n
            ),
            rounds * (concurrency === 5 ? 1 : 2)
          );
      console.log(
        JSON.stringify({
          ...result,
          persistedRowsVerified: after.length,
          // Matching per-owner/action totals do not prove each audit's causal identity.
          auditOwnerActionCountsVerified: true,
        })
      );
    } finally {
      await persisted.end();
    }
    if (!result.pass) process.exitCode = 1;
  }
  phase = "same_owner_competing_writes";
  const [raceBaseline] = await db.query<any[]>(
    "SELECT * FROM prospects ORDER BY id"
  );
  const [raceAuditBaseline] = await db.query<any[]>(
    "SELECT * FROM audit_events ORDER BY id"
  );
  const pairs = actors.map(first => {
    const agent = createSyntheticHttpAgent(first.localAddress);
    agents.push(agent);
    return { first, second: { ...first, agent } };
  });
  // Establish the second socket before measuring the overlapping writes.
  await parallel(pairs, 5, async pair => {
    const result = await call(pair.second, "auth.me");
    assert.equal(result.status, 200);
    assert.equal(result.data.id, pair.first.id);
  });
  const receipts = await competingWrites(pairs, call);
  const raceDb = await mysql.createConnection(url.toString());
  try {
    const [rows] = await raceDb.query<any[]>(
      "SELECT * FROM prospects ORDER BY id"
    );
    assert.equal(rows.length, raceBaseline.length);
    for (let i = 0; i < rows.length; i++) {
      const expected = receipts
        .filter(r => r.candidateId === rows[i].id)
        .at(-1);
      if (!expected) assert.deepEqual(rows[i], raceBaseline[i]);
      else {
        assert.equal(rows[i].title, expected.title);
        for (const key of Object.keys(raceBaseline[i]))
          if (key !== "title" && key !== "last_updated")
            assert.deepEqual(rows[i][key], raceBaseline[i][key]);
      }
    }
    const [audits] = await raceDb.query<any[]>(
      "SELECT * FROM audit_events ORDER BY id"
    );
    assert.deepEqual(
      audits.slice(0, raceAuditBaseline.length),
      raceAuditBaseline
    );
    const added = audits.slice(raceAuditBaseline.length);
    assert.equal(added.length, receipts.length);
    assert.equal(new Set(receipts.map(r => r.requestId)).size, receipts.length);
    for (const receipt of receipts) {
      const matches = added.filter(a => a.request_id === receipt.requestId);
      assert.equal(matches.length, 1);
      const audit = matches[0];
      assert.equal(audit.user_id, receipt.accountId);
      assert.equal(audit.entity_id, String(receipt.candidateId));
      assert.equal(audit.entity_type, "prospect");
      assert.equal(audit.action, "prospect.edit");
      assert.equal(audit.outcome, "success");
      assert.deepEqual(
        typeof audit.metadata === "string"
          ? JSON.parse(audit.metadata)
          : audit.metadata,
        { fields: ["title"] }
      );
    }
    console.log(
      JSON.stringify({
        event: "same_owner_competing_writes",
        differentPatchRaces: accounts,
        identicalPatchRaces: accounts,
        editRequests: accounts * 4,
        committedChanges: receipts.length,
        staleConflicts: accounts,
        unchangedReplays: accounts,
        independentSocketsAndWireOverlapVerified: true,
        persistedRowsVerified: rows.length,
        winningRequestAuditReceiptsVerified: receipts.length,
        automaticRetries: 0,
      })
    );
  } finally {
    await raceDb.end();
  }
  phase = "cross_owner_write_isolation";
  const [writeBaseline] = await db.query<any[]>(
    "SELECT * FROM prospects ORDER BY id"
  );
  const [auditBaseline] = await db.query<any[]>(
    "SELECT * FROM audit_events ORDER BY id"
  );
  await parallel(actors, 5, async actor => {
    const other = actors[(actors.indexOf(actor) + 1) % actors.length];
    const review = await call(other, "criticalPath.prospects.details", {
      accountId: other.id,
      id: other.candidateId,
    });
    assert.equal(review.status, 200);
    for (const [route, input, status] of [
      [
        "criticalPath.prospects.edit",
        {
          accountId: other.id,
          id: other.candidateId,
          expectedRevision: review.data.revision,
          patch: { title: "Synthetic wrong owner" },
        },
        403,
      ],
      [
        "criticalPath.prospects.edit",
        {
          accountId: actor.id,
          id: other.candidateId,
          expectedRevision: review.data.revision,
          patch: { title: "Synthetic wrong owner" },
        },
        404,
      ],
      [
        "criticalPath.prospects.archive",
        {
          accountId: other.id,
          id: other.candidateId,
          expectedRevision: review.data.revision,
          confirmed: true,
        },
        403,
      ],
      [
        "criticalPath.prospects.restore",
        {
          accountId: actor.id,
          id: other.candidateId,
          expectedRevision: review.data.revision,
          confirmed: true,
        },
        404,
      ],
    ] as const) {
      const result = await call(actor, route, input, true);
      assert.equal(result.status, status);
      assert.equal(result.data, undefined);
    }
  });
  const [writeFinal] = await db.query<any[]>(
    "SELECT * FROM prospects ORDER BY id"
  );
  const [auditFinal] = await db.query<any[]>(
    "SELECT * FROM audit_events ORDER BY id"
  );
  assert.deepEqual(writeFinal, writeBaseline);
  assert.deepEqual(auditFinal, auditBaseline);
  console.log(
    JSON.stringify({
      event: "cross_owner_write_isolation",
      deniedMutations: accounts * 4,
      candidateRowsUnchanged: writeFinal.length,
      auditRowsUnchanged: auditFinal.length,
    })
  );
} catch (error) {
  // Never serialize SQL errors, fixture passwords, session cookies or records.
  console.log(
    JSON.stringify({
      event: "synthetic_load_failed",
      phase,
      lastResponse,
      category:
        error instanceof Error &&
        "code" in error &&
        typeof error.code === "string" &&
        /^(ER_[A-Z_]+|ERR_ASSERTION)$/.test(error.code)
          ? error.code
          : "fixture_or_protocol_error",
      detail:
        "Fixture, authentication, warmup or isolation assertion failed. No credentials logged.",
    })
  );
  process.exitCode = 1;
} finally {
  for (const agent of agents) agent.destroy();
  await db.end();
}
