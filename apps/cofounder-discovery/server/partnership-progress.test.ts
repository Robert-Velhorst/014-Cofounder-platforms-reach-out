import { expect, it } from "vitest";
import {
  progressListSchema,
  progressRecordSchema,
} from "../shared/partnership-progress";
import { permitsTrpcUrl } from "./route-policy";
const valid = {
  accountId: 1,
  prospectId: 2,
  expectedReview: "a".repeat(64),
  outcome: "still_talking",
  notes: " Owner report ",
  confirmation: true,
  idempotencyKey: "d4c08717-207c-4ab8-a0c5-71ecc2e69773",
};
it("admits both reviewed progress routes with legacy automation disabled", () => {
  for (const route of [
    "criticalPath.progress.list",
    "criticalPath.progress.record",
  ])
    expect(permitsTrpcUrl("/" + route, false)).toBe(true);
});
it("requires explicit review, confirmation and a bounded retry key", () => {
  for (const change of [
    { confirmation: false },
    { expectedReview: "" },
    { idempotencyKey: "" },
    { userId: 9 },
    { matchId: 9 },
    { outcome: "verified_partnership" },
    { notes: "x".repeat(2001) },
  ])
    expect(
      progressRecordSchema.safeParse({ ...valid, ...change }).success
    ).toBe(false);
  expect(progressRecordSchema.parse(valid).notes).toBe("Owner report");
});
it("allows only owner-reported supported outcomes", () => {
  for (const outcome of [
    "partnership_formed",
    "still_talking",
    "not_interested",
    "no_response",
    "timing_not_right",
  ])
    expect(progressRecordSchema.safeParse({ ...valid, outcome }).success).toBe(
      true
    );
});
it("rejects ambiguous pagination and caller-supplied ownership fields", () => {
  expect(
    progressListSchema.parse({ accountId: 1, prospectId: 2, beforeId: 3 })
  ).toEqual({ accountId: 1, prospectId: 2, beforeId: 3 });
  for (const change of [
    { beforeId: 0 },
    { accountId: -1 },
    { userId: 99 },
    { limit: 10000 },
  ])
    expect(
      progressListSchema.safeParse({ accountId: 1, prospectId: 2, ...change })
        .success
    ).toBe(false);
});
