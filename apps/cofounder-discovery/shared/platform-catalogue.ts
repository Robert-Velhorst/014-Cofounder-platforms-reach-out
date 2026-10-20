export type PlatformCategory = "dedicated" | "community" | "program";

// Editorial reminder only; never a provider-permission or admission decision.
export const PLATFORM_REVIEW_REMINDER_DAYS = 30;

function utcCalendarDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return null;
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

export function platformReviewFreshness(
  reviewedAt: string,
  asOf: string
): {
  state: "within-window" | "review-due" | "unknown";
  ageDays: number | null;
} {
  const review = utcCalendarDay(reviewedAt);
  const reference = utcCalendarDay(asOf);
  if (review === null || reference === null || review > reference) {
    return { state: "unknown", ageDays: null };
  }
  const ageDays = (reference - review) / 86_400_000;
  return {
    state:
      ageDays >= PLATFORM_REVIEW_REMINDER_DAYS ? "review-due" : "within-window",
    ageDays,
  };
}

export type PlatformRecord = {
  id: string;
  name: string;
  url: string;
  aliases: string[];
  category: PlatformCategory;
  kind: "source" | "channel-template";
  audience: string;
  access: string;
  pricingStatus:
    | "free-core"
    | "free-entry"
    | "paid-membership"
    | "unknown"
    | "investment-terms";
  pricing: string;
  assistance: "manual-discovery" | "human-original" | "permission-required";
  aiPostDrafts: "unverified" | "prohibited";
  restrictions: string;
  evidence: string[];
  reviewedAt: string;
  workflowReview: "manual-reviewed" | "discovery-only";
  reviewer: string;
  integration: {
    permissionVerified: false;
    implemented: false;
    liveVerified: false;
  };
};

export function filterPlatforms(
  records: readonly PlatformRecord[],
  query: string,
  category: PlatformCategory | "all"
): PlatformRecord[] {
  const words = query
    .trim()
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean);
  return records.filter(record => {
    if (category !== "all" && record.category !== category) return false;
    const searchable = [
      record.name,
      record.id,
      ...record.aliases,
      record.audience,
    ]
      .join(" ")
      .toLocaleLowerCase("en");
    return words.every(word => searchable.includes(word));
  });
}
