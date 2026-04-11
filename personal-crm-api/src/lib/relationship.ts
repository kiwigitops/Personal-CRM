import { differenceInCalendarDays } from "date-fns";

export function calculateStaleDays(lastInteractionAt: Date | null): number {
  if (!lastInteractionAt) {
    return 999;
  }

  return Math.max(differenceInCalendarDays(new Date(), lastInteractionAt), 0);
}

export function scoreWarmth(input: {
  lastInteractionAt: Date | null;
  overdueFollowups: number;
  relationshipStrength: number;
}) {
  const staleDays = calculateStaleDays(input.lastInteractionAt);
  const recencyBonus = Math.max(0, 35 - Math.floor(staleDays / 2));
  const overduePenalty = input.overdueFollowups * 8;
  const score = Math.min(
    100,
    Math.max(0, Math.round(input.relationshipStrength * 0.65 + recencyBonus - overduePenalty)),
  );

  return {
    score,
    staleDays,
    warmthLabel:
      score >= 80 ? "Strong" : score >= 60 ? "Warm" : score >= 35 ? "Cooling" : "Cold"
  };
}

export function nextBestAction(input: {
  lastInteractionAt: Date | null;
  overdueFollowups: number;
  warmthScore: number;
}) {
  const staleDays = calculateStaleDays(input.lastInteractionAt);

  if (input.overdueFollowups > 0) {
    return "Clear the overdue follow-up and log the outcome.";
  }
  if (staleDays > 60) {
    return "Send a lightweight check-in with a specific memory from the last conversation.";
  }
  if (input.warmthScore >= 80) {
    return "Keep momentum with a high-context ask, intro, or collaboration idea.";
  }
  return "Add one meaningful touchpoint to keep the relationship warm.";
}

