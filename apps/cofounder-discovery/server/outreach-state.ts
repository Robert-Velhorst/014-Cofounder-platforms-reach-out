export const outreachStates = [
  "draft",
  "pending_review",
  "approved",
  "manual_action_required",
  "confirmed_sent",
  "responded",
  "follow_up_due",
  "closed",
  "cancelled",
] as const;

export type OutreachState = (typeof outreachStates)[number];

const transitions: Record<OutreachState, readonly OutreachState[]> = {
  draft: ["pending_review", "cancelled"],
  pending_review: ["draft", "approved", "cancelled"],
  approved: ["manual_action_required", "cancelled"],
  manual_action_required: ["confirmed_sent", "cancelled"],
  confirmed_sent: ["responded", "follow_up_due", "closed"],
  responded: ["closed"],
  follow_up_due: ["pending_review", "responded", "closed"],
  closed: [],
  cancelled: [],
};

export function canTransition(from: OutreachState, to: OutreachState): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: OutreachState, to: OutreachState) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid outreach transition: ${from} -> ${to}`);
  }
}

export function createTemplateMessage(input: {
  senderName: string;
  prospectName: string;
  prospectTitle?: string | null;
  commonSkills?: string[];
  context?: string;
}) {
  const role = input.prospectTitle ? ` as ${input.prospectTitle}` : "";
  const overlap = input.commonSkills?.length
    ? ` Your experience with ${input.commonSkills.slice(0, 3).join(", ")} stood out.`
    : " Your background stood out.";
  const context = input.context?.trim() ? ` ${input.context.trim()}` : "";
  return `Hi ${input.prospectName},\n\nI'm ${input.senderName}, and I'm exploring a potential co-founder collaboration.${overlap}${context}\n\nWould you be open to a short introductory conversation? No pressure if the timing is not right.\n\nBest,\n${input.senderName}`;
}
