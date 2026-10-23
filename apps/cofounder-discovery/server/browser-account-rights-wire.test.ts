import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { describe, expect, it } from "vitest";
import { TRPC_MAX_BATCH_ITEMS } from "../shared/trpc-transport";
import { assertSyntheticDeletionWire } from "../scripts/browser-journey-account-rights.mjs";

describe("maintained account-rights wire observation", () => {
  it.each(["request", "withdraw"] as const)(
    "accepts the actual locked tRPC client's %s serialization",
    async action => {
      const operation =
        action === "request" ? "requestDeletion" : "withdrawDeletion";
      const requestKey = "a6a38911-b48e-4352-bc45-fce05735c468";
      const password = "synthetic-transport-test-only";
      const command = {
        accountId: 7,
        password,
        expectedRevision: 3,
        requestKey,
        confirmation: action === "request" ? "REQUEST ACCOUNT DELETION" : true,
      };
      let observations = 0;
      const client = createTRPCUntypedClient({
        links: [
          httpBatchLink({
            url: "http://localhost:13216/api/trpc",
            maxItems: TRPC_MAX_BATCH_ITEMS,
            transformer: superjson,
            // Explicit transport double. It checks actual client serialization,
            // not an HTTP endpoint, authenticated service or browser interaction.
            fetch: async (url, init) => {
              observations++;
              expect(
                assertSyntheticDeletionWire(
                  {
                    url: String(url),
                    method: init?.method,
                    body: JSON.parse(String(init?.body)),
                  },
                  { action, accountId: 7, revision: 3, requestKey, password }
                )
              ).toBe(requestKey);
              return new Response(
                JSON.stringify([
                  { result: { data: { json: { observed: true } } } },
                ]),
                {
                  headers: { "content-type": "application/json" },
                }
              );
            },
          }),
        ],
      });
      expect(
        await client.mutation(`accountData.${operation}`, command)
      ).toEqual({ observed: true });
      expect(observations).toBe(1);
    }
  );
});
