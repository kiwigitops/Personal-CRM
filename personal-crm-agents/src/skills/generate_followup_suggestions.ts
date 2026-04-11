import { addDays } from "date-fns";

export function generateFollowupSuggestions(input: {
  firstName: string;
  lastInteractionTitle?: string | null;
  warmthScore: number;
}) {
  const intervalDays = input.warmthScore >= 80 ? 21 : input.warmthScore >= 55 ? 14 : 7;
  const suggestedDate = addDays(new Date(), intervalDays);
  const angle = input.lastInteractionTitle
    ? `Reference "${input.lastInteractionTitle}" and ask what changed since then.`
    : "Open with a direct, low-pressure check-in.";

  return {
    angle,
    prompt: `Follow up with ${input.firstName}`,
    suggestedDate,
    suggestedMessage: `Hi ${input.firstName}, I was thinking about our last conversation. ${angle}`
  };
}

