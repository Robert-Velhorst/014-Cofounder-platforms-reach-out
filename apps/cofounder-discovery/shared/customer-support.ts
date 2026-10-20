import { z } from "zod";

export const supportChecks = [
  "sign_in",
  "email_verification",
  "password_recovery",
  "candidate_save",
  "preset_save",
  "draft_save",
  "manual_action",
  "account_export",
] as const;
export const supportStatuses = [
  "not_checked",
  "pass",
  "unavailable",
  "unauthorized",
  "forbidden",
  "invalid_input",
  "conflict",
  "capacity_reached",
  "not_configured",
] as const;
export const customerSupportInput = z
  .object({
    observations: z
      .array(
        z
          .object({
            check: z.enum(supportChecks),
            status: z.enum(supportStatuses),
          })
          .strict()
      )
      .min(1)
      .max(20),
  })
  .strict();
export type SupportObservation = z.infer<
  typeof customerSupportInput
>["observations"][number];

// Construct an allowlisted payload; do not redact arbitrary application data.
export function createCustomerSupportPreview(input: unknown) {
  const { observations } = customerSupportInput.parse(input);
  return {
    format: "cofounder-customer-support/v1",
    evidence: "customer_selected_observations_not_automatic_runtime_acceptance",
    observations,
    exclusions: [
      "account_and_candidate_data",
      "message_content",
      "credentials_and_tokens",
      "environment",
      "logs_and_stack_traces",
      "paths_hostnames_and_urls",
      "browser_metadata",
      "request_and_account_identifiers",
    ],
    sharing: "local_review_only_no_upload",
  };
}
