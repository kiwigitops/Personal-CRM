import type { ExtractedContactFact } from "./extract_contact_facts";
import { suggestNextBestAction } from "./suggest_next_best_action";

export function summarizeRelationshipHistory(input: {
  facts: ExtractedContactFact[];
  firstName: string;
  interactions: Array<{
    happenedAt: Date;
    notes: string | null;
    title: string;
    type: string;
  }>;
  lastInteractionAt: Date | null;
  overdueFollowups: number;
  warmthScore: number;
}) {
  const recent = input.interactions.slice(0, 3);
  const facts = input.facts.map((fact) => fact.value).slice(0, 5);
  const brief =
    recent.length > 0
      ? `${input.firstName}'s relationship history centers on ${recent
          .map((interaction) => interaction.title.toLowerCase())
          .join(", ")}.`
      : `${input.firstName} is a new relationship with limited logged history.`;

  return {
    brief,
    keyFacts: facts,
    nextBestAction: suggestNextBestAction({
      lastInteractionAt: input.lastInteractionAt,
      overdueFollowups: input.overdueFollowups,
      warmthScore: input.warmthScore
    })
  };
}

