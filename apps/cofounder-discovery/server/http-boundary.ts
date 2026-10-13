import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";

// Correlation identifiers are server-owned: never reflect a supplied header that
// may contain private data, misleading log fields or an unbounded identifier.
export const requestCorrelation: RequestHandler = (_req, res, next) => {
  res.setHeader("x-request-id", randomUUID());
  next();
};

export const validateRequestPath: RequestHandler = (req, res, next) => {
  try {
    decodeURIComponent(req.path);
  } catch {
    res
      .status(400)
      .set("cache-control", "private, no-store")
      .json({
        error: "invalid_request_path",
        requestId: res.getHeader("x-request-id"),
      });
    return;
  }
  next();
};

// Mount after real API routes but before either SPA fallback (Vite or static).
export const apiNotFound: RequestHandler = (_req, res) => {
  res
    .status(404)
    .set("cache-control", "private, no-store")
    .json({
      error: "api_not_found",
      requestId: res.getHeader("x-request-id"),
    });
};

const parserFailures = new Map<string, { status: number; code: string }>([
  ["entity.parse.failed", { status: 400, code: "invalid_request_body" }],
  ["entity.too.large", { status: 413, code: "request_body_too_large" }],
  ["encoding.unsupported", { status: 415, code: "unsupported_body_encoding" }],
  ["charset.unsupported", { status: 415, code: "unsupported_body_charset" }],
  ["request.aborted", { status: 400, code: "incomplete_request_body" }],
  ["request.size.invalid", { status: 400, code: "invalid_request_body_size" }],
  ["parameters.too.many", { status: 413, code: "too_many_body_parameters" }],
  [
    "querystring.parse.rangeError",
    { status: 400, code: "invalid_request_body" },
  ],
]);

// Four parameters are required for Express to recognize an error handler.
// Never serialize error.message/body/stack, request URLs or credentials.
export const safeHttpError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) {
    // A partial response cannot safely become a successful JSON error. Close it
    // without delegating to Express's raw-error logging/default HTML handler.
    res.destroy();
    return;
  }
  const type =
    error && typeof error === "object" && typeof error.type === "string"
      ? error.type
      : "";
  const failedDecompression =
    error?.status === 400 &&
    ["Z_DATA_ERROR", "Z_BUF_ERROR"].includes(error?.code);
  const failure =
    parserFailures.get(type) ??
    (failedDecompression
      ? { status: 400, code: "invalid_request_body" }
      : { status: 500, code: "internal_server_error" });
  if (failure.status === 500) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "http_request_failed",
        requestId: res.getHeader("x-request-id"),
      })
    );
  }
  res
    .status(failure.status)
    .set("cache-control", "private, no-store")
    .json({
      error: failure.code,
      requestId: res.getHeader("x-request-id"),
    });
};
