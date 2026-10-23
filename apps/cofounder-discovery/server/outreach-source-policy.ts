import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicPlatformCatalogue } from "./platform-catalogue";

export type SourceProspect = {
  platform?: string | null;
  profileUrl?: string | null;
  consentStatus?: string | null;
  archivedAt?: Date | null;
};
export type SourcePolicyInput = {
  prospect: SourceProspect;
  actorId: number;
  body: string;
  generationMode: "template" | "ai" | "user_authored";
};
export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  sourceId: string | null;
};
type SourceResolution = PolicyDecision & { destinationUrl: string | null };

const POLICY_VERSION = "2026-09-06-human-manual-v1";
const RECEIPT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const sources = publicPlatformCatalogue();
const normalize = (value: string) => value.trim().toLowerCase();
const normalizeHost = (value: string) => value.replace(/^www\./, "");
const labels = new Map<string, string>();
for (const source of sources) {
  for (const label of [source.id, source.name, ...source.aliases]) {
    labels.set(normalize(label), source.id);
  }
}
// Internal legacy ID, not a new public alias or a claim about HN.
labels.set("ycombinator", "yc-cofounder");
labels.set("f6s", "f6s");
labels.set("manual", "manual");

function denied(
  reason: string,
  sourceId: string | null = null
): SourceResolution {
  return { allowed: false, reason, sourceId, destinationUrl: null };
}

function sourceForUrl(url: URL): string | undefined {
  const host = normalizeHost(url.hostname);
  if (host === "f6s.com") return "f6s";
  if (host === "starthawk.io") return "foundercloud";
  const source = sources.find(
    row => normalizeHost(new URL(row.url).hostname) === host
  );
  if (
    source?.id === "reddit-cofounder" &&
    !/^\/r\/cofounder(?:\/|$)/i.test(url.pathname)
  )
    return undefined;
  return source?.id;
}

/**
 * Resolves eligibility for a HUMAN manual workflow, not permission to post,
 * import member data, contact a person or call an API. No network requests occur.
 * The explicit label and URL must agree; a generic "manual" label is no bypass.
 */
export function resolveOutreachSource(
  prospect: SourceProspect
): SourceResolution {
  if (prospect.archivedAt) return denied("This prospect is archived.");
  if (prospect.consentStatus === "opted_out")
    return denied("This prospect opted out.");
  const label = normalize(prospect.platform ?? "");
  const declaredId = label ? labels.get(label) : undefined;
  if (label && !declaredId)
    return denied(
      "This source has not been reviewed. Source review is required before outreach."
    );

  let destinationUrl: string | null = null;
  let destinationId: string | undefined;
  if (prospect.profileUrl?.trim()) {
    let url: URL;
    try {
      url = new URL(prospect.profileUrl.trim());
    } catch {
      return denied("The destination is not a valid HTTPS URL.");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
      return denied(
        "Use a standard HTTPS destination without credentials or a custom port."
      );
    }
    destinationId = sourceForUrl(url);
    if (!destinationId)
      return denied("The destination is outside the reviewed source scope.");
    destinationUrl = url.href;
    if (declaredId && declaredId !== destinationId)
      return denied(
        "The source label and destination disagree. Correct the prospect source before outreach."
      );
  }

  const sourceId = declaredId ?? destinationId;
  if (!sourceId)
    return denied(
      "Choose a reviewed source, or explicit manual contact without a platform URL."
    );
  if (sourceId === "f6s")
    return denied(
      "This source is on research hold pending permission review.",
      sourceId
    );
  const source = sources.find(row => row.id === sourceId);
  if (
    source?.kind === "channel-template" ||
    source?.assistance === "permission-required"
  ) {
    return denied(
      "An exact group, membership and administrator permission review are required before outreach.",
      sourceId
    );
  }
  if (sourceId !== "manual" && source?.workflowReview !== "manual-reviewed") {
    return denied(
      "This is a discovery-only listing. Separate source review is required before importing candidates or preparing outreach.",
      sourceId
    );
  }
  return {
    allowed: true,
    reason:
      source?.assistance === "human-original"
        ? "Human-original participation only. Generated or AI-edited posting text is prohibited. Verify current rules and eligibility yourself."
        : "Human-authored manual participation only after checking current rules, eligibility and data-use rights. No automated permission is granted.",
    sourceId,
    destinationUrl,
  };
}

const declarationSchema = z
  .object({ humanOriginal: z.literal(true), rulesReviewed: z.literal(true) })
  .strict();
const receiptSchema = declarationSchema
  .extend({
    version: z.literal(POLICY_VERSION),
    sourceId: z.string().min(1),
    destinationUrl: z.string().nullable(),
    actorId: z.number().int().positive(),
    bodyDigest: z.string().regex(/^[a-f0-9]{64}$/),
    reviewedAt: z.iso.datetime(),
  })
  .strict();
export type OutreachSourceReceipt = z.infer<typeof receiptSchema>;

function validateInput(input: SourcePolicyInput): SourceResolution {
  const source = resolveOutreachSource(input.prospect);
  if (!source.allowed) return source;
  if (
    !Number.isSafeInteger(input.actorId) ||
    input.actorId <= 0 ||
    !input.body.trim() ||
    input.body.length > 10_000
  ) {
    return denied(
      "A valid owner and a non-empty message of at most 10,000 characters are required.",
      source.sourceId
    );
  }
  if (input.generationMode !== "user_authored") {
    return denied(
      "Generated/template posting permission is not established. Write your own original message and review the current source rules.",
      source.sourceId
    );
  }
  return source;
}
const digest = (body: string) =>
  createHash("sha256").update(body, "utf8").digest("hex");

/** Only the server may create a persisted receipt, from its owned prospect row. */
export function declareOutreachSource(
  input: SourcePolicyInput,
  declaration: unknown,
  now: Date
): OutreachSourceReceipt {
  const source = validateInput(input);
  if (!source.allowed)
    throw new TRPCError({ code: "FORBIDDEN", message: source.reason });
  if (
    !declarationSchema.safeParse(declaration).success ||
    !Number.isFinite(now.getTime())
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Confirm human-original authorship and review the current rules before saving this draft.",
    });
  }
  return {
    version: POLICY_VERSION,
    sourceId: source.sourceId!,
    destinationUrl: source.destinationUrl,
    actorId: input.actorId,
    bodyDigest: digest(input.body),
    reviewedAt: now.toISOString(),
    humanOriginal: true,
    rulesReviewed: true,
  };
}

/**
 * Consume only the server-persisted receipt, never a caller-supplied receipt.
 * This is a declaration record, not a signature or proof of provider consent.
 */
export function assessOutreachSource(
  input: SourcePolicyInput,
  receipt: unknown,
  now: Date
): PolicyDecision {
  const source = validateInput(input);
  if (!source.allowed) return source;
  const parsed = receiptSchema.safeParse(receipt);
  if (!parsed.success)
    return denied(
      "This draft needs a new source-rule and authorship review.",
      source.sourceId
    );
  const current = parsed.data;
  const age = now.getTime() - Date.parse(current.reviewedAt);
  if (!Number.isFinite(age) || age < 0 || age >= RECEIPT_LIFETIME_MS) {
    return denied(
      "The source-rule review expired or has an invalid date. Create a freshly reviewed draft.",
      source.sourceId
    );
  }
  if (
    current.actorId !== input.actorId ||
    current.sourceId !== source.sourceId ||
    current.destinationUrl !== source.destinationUrl ||
    current.bodyDigest !== digest(input.body)
  ) {
    return denied(
      "The owner, message or destination changed after review. Create a freshly reviewed draft.",
      source.sourceId
    );
  }
  return { allowed: true, sourceId: source.sourceId, reason: source.reason };
}
