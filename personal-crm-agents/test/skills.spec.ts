import { describe, expect, it } from "vitest";

import { dedupePossibleDuplicates } from "../src/skills/dedupe_possible_duplicates";
import { extractContactFacts } from "../src/skills/extract_contact_facts";
import { generateFollowupSuggestions } from "../src/skills/generate_followup_suggestions";
import { scoreContactWarmth } from "../src/skills/score_contact_warmth";

describe("agent skills", () => {
  it("extracts lightweight facts from notes", () => {
    const facts = extractContactFacts("Maya prefers concise updates and is hiring a design lead.");

    expect(facts.some((fact) => fact.factKey === "preference")).toBe(true);
    expect(facts.some((fact) => fact.factKey === "momentum")).toBe(true);
  });

  it("scores stale relationships lower", () => {
    const recent = scoreContactWarmth({
      lastInteractionAt: new Date(),
      overdueFollowups: 0,
      relationshipStrength: 80
    });
    const stale = scoreContactWarmth({
      lastInteractionAt: new Date("2023-01-01"),
      overdueFollowups: 1,
      relationshipStrength: 80
    });

    expect(recent.score).toBeGreaterThan(stale.score);
  });

  it("detects duplicate emails", () => {
    const suggestions = dedupePossibleDuplicates([
      { email: "a@example.com", firstName: "A", id: "1", lastName: "One", phone: null },
      { email: "A@example.com", firstName: "A", id: "2", lastName: "Uno", phone: null }
    ]);

    expect(suggestions).toHaveLength(1);
  });

  it("generates follow-up suggestions", () => {
    const suggestion = generateFollowupSuggestions({
      firstName: "Maya",
      lastInteractionTitle: "Hiring chat",
      warmthScore: 85
    });

    expect(suggestion.suggestedMessage).toContain("Maya");
  });
});
