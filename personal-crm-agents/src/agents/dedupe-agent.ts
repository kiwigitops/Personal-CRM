import type { AgentHandler } from "../context";
import { dedupePossibleDuplicates } from "../skills/dedupe_possible_duplicates";

export const dedupeAgent: AgentHandler = async (context, input) => {
  const contacts = await context.prisma.contact.findMany({
    where: {
      deletedAt: null,
      workspaceId: input.workspaceId
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 1000
  });

  return {
    suggestions: dedupePossibleDuplicates(contacts)
  };
};

