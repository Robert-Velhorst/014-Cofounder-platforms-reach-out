/** Unexpected driver/provider exceptions must never become public SQL, values,
 * credentials or stacks. Explicit policy/error codes and safe messages remain. */
export function publicTrpcError<
  T extends { message: string; data: { code: string; stack?: string } },
>(shape: T): T {
  const data = { ...shape.data };
  // Remove the key itself: SuperJSON serializes an undefined value as null plus
  // metadata, so assigning undefined does not omit it from the public envelope.
  delete data.stack;
  return {
    ...shape,
    message:
      shape.data.code === "INTERNAL_SERVER_ERROR"
        ? "The request could not be completed. Please try again or contact support."
        : shape.message,
    data,
  };
}
