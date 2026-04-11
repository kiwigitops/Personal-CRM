export function suggestNextBestAction(input: {
  lastInteractionAt: Date | null;
  overdueFollowups: number;
  warmthScore: number;
}) {
  const now = Date.now();
  const staleDays = input.lastInteractionAt
    ? Math.floor((now - input.lastInteractionAt.getTime()) / (24 * 60 * 60 * 1000))
    : 999;

  if (input.overdueFollowups > 0) {
    return "Clear the overdue follow-up and capture the outcome while it is still fresh.";
  }
  if (staleDays > 90) {
    return "Restart softly with a personal check-in and one specific memory from the last conversation.";
  }
  if (staleDays > 45) {
    return "Send a helpful article, intro, or update tied to their current work.";
  }
  if (input.warmthScore >= 80) {
    return "Ask for a meaningful collaboration, intro, or next conversation while momentum is high.";
  }
  return "Log one lightweight touchpoint to keep the relationship warm.";
}

