import { type AnyRouter, type inferRouterContext } from "@trpc/server";
import type { NodeHTTPHandlerOptions } from "@trpc/server/adapters/node-http";
import type { Request, Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { TRPC_MAX_BATCH_ITEMS } from "../shared/trpc-transport";
import { createExportResponseBudget } from "./export-response-budget";

export function createBoundedTrpcMiddleware<TRouter extends AnyRouter>(
  options: NodeHTTPHandlerOptions<TRouter, Request, Response>
) {
  // The adapter rejects before creating account context or running procedures.
  // Caller options cannot accidentally remove this application ceiling.
  const bounded = Object.assign({}, options);
  bounded.maxBatchSize = TRPC_MAX_BATCH_ITEMS;
  // Generation's separate two-slot limit ends before serialization/socket drain.
  // Hold response capacity until finish/close, including slow readers. Count each
  // export operation in a batch, not merely each HTTP request. No private payload
  // or waiting queue is retained here, and refusal precedes account context work.
  const downloads = createExportResponseBudget();
  bounded.createContext = async context => {
    const exports = context.info.calls.filter(
      call => call.path === "accountData.export"
    ).length;
    if (exports) {
      downloads.reserve(exports, context.res);
    }
    return options.createContext
      ? await options.createContext(context)
      : ({} as inferRouterContext<TRouter>);
  };
  return createExpressMiddleware<TRouter>(bounded);
}
