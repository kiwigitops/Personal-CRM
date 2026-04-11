import { differenceInCalendarDays } from "date-fns";

export function scoreContactWarmth(input: {
  lastInteractionAt: Date | null;
  overdueFollowups: number;
  relationshipStrength: number;
}) {
  const staleDays = input.lastInteractionAt
    ? Math.max(differenceInCalendarDays(new Date(), input.lastInteractionAt), 0)
    : 999;
  const recencyBonus = Math.max(0, 35 - Math.floor(staleDays / 2));
  const overduePenalty = input.overdueFollowups * 8;
  const score = Math.min(
    100,
    Math.max(0, Math.round(input.relationshipStrength * 0.65 + recencyBonus - overduePenalty)),
  );

  return {
    score,
    staleDays,
    warmthLabel: score >= 80 ? "Strong" : score >= 60 ? "Warm" : score >= 35 ? "Cooling" : "Cold"
  };
}

