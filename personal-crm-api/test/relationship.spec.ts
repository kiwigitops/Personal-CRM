import { describe, expect, it } from "vitest";

import { calculateStaleDays, nextBestAction, scoreWarmth } from "../src/lib/relationship";

describe("relationship scoring", () => {
  it("scores recent strong relationships higher than stale ones", () => {
    const recent = scoreWarmth({
      lastInteractionAt: new Date(),
      overdueFollowups: 0,
      relationshipStrength: 80
    });
    const stale = scoreWarmth({
      lastInteractionAt: new Date("2024-01-01"),
      overdueFollowups: 2,
      relationshipStrength: 80
    });

    expect(recent.score).toBeGreaterThan(stale.score);
  });

  it("produces stale days for missing interactions", () => {
    expect(calculateStaleDays(null)).toBe(999);
  });

  it("prioritizes overdue follow-ups", () => {
    expect(
      nextBestAction({
        lastInteractionAt: new Date(),
        overdueFollowups: 1,
        warmthScore: 80
      }),
    ).toContain("overdue");
  });
});
