/**
 * Tutorial Video Configuration
 *
 * Replace placeholder URLs with actual tutorial video URLs
 * Videos should be short (30-90 seconds) and focused on one feature
 */

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

export const tutorials: Record<string, Tutorial> = {
  onboarding: {
    id: "onboarding",
    title: "Getting Started",
    description:
      "Learn how to complete your profile and start finding co-founders",
    videoUrl: "https://example.com/tutorials/onboarding.mp4", // Replace with actual video
  },

  matching: {
    id: "matching",
    title: "How Matching Works",
    description: "Understand our AI-powered compatibility scoring system",
    videoUrl: "https://example.com/tutorials/matching.mp4",
  },

  conversationStarters: {
    id: "conversationStarters",
    title: "Conversation Starters",
    description: "Use AI-generated messages to break the ice with prospects",
    videoUrl: "https://example.com/tutorials/conversation-starters.mp4",
  },

  campaigns: {
    id: "campaigns",
    title: "Campaign Automation",
    description: "Set up automated discovery and outreach campaigns",
    videoUrl: "https://example.com/tutorials/campaigns.mp4",
  },

  compatibilityScore: {
    id: "compatibilityScore",
    title: "Compatibility Scores",
    description: "Learn what each score means and how it's calculated",
    videoUrl: "https://example.com/tutorials/compatibility.mp4",
  },

  timeline: {
    id: "timeline",
    title: "Activity Timeline",
    description: "Track all interactions with prospects in one place",
    videoUrl: "https://example.com/tutorials/timeline.mp4",
  },

  analytics: {
    id: "analytics",
    title: "Analytics Dashboard",
    description: "Monitor your outreach performance and success metrics",
    videoUrl: "https://example.com/tutorials/analytics.mp4",
  },

  enrichment: {
    id: "enrichment",
    title: "Profile Enrichment",
    description:
      "Automatically enhance prospect profiles with LinkedIn and GitHub data",
    videoUrl: "https://example.com/tutorials/enrichment.mp4",
  },

  savedSearches: {
    id: "savedSearches",
    title: "Saved Searches",
    description: "Save your search criteria and get notified of new matches",
    videoUrl: "https://example.com/tutorials/saved-searches.mp4",
  },

  billing: {
    id: "billing",
    title: "Usage & Billing",
    description: "Understand how metered billing works and track your costs",
    videoUrl: "https://example.com/tutorials/billing.mp4",
  },
};

/**
 * Get tutorial by ID
 */
export function getTutorial(id: string): Tutorial | undefined {
  return tutorials[id];
}

/**
 * Check if tutorial video URL is a placeholder
 */
export function isPlaceholder(videoUrl: string): boolean {
  return videoUrl.includes("example.com");
}
