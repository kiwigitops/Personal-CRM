import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday } from "date-fns";

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "??";
}

export function formatTimelineDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "MMM d, yyyy");
}

export function formatRelativeLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (isToday(date)) {
    return "Today";
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function staleDaysFrom(value: string | Date | null): number {
  if (!value) {
    return 999;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(differenceInCalendarDays(new Date(), date), 0);
}

export function warmthLabel(score: number): "Cold" | "Cooling" | "Warm" | "Strong" {
  if (score >= 80) {
    return "Strong";
  }
  if (score >= 60) {
    return "Warm";
  }
  if (score >= 35) {
    return "Cooling";
  }
  return "Cold";
}

