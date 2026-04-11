import type { AgentJobType } from "../../generated/prisma";

import type { AgentHandler } from "../context";
import { dedupeAgent } from "./dedupe-agent";
import { enrichmentAgent } from "./enrichment-agent";
import { followupAgent } from "./followup-agent";
import { memoryAgent } from "./memory-agent";
import { relationshipHealthAgent } from "./relationship-health-agent";
import { seedDataAgent } from "./seed-data-agent";
import { timelineSummaryAgent } from "./timeline-summary-agent";

export const agentRegistry: Record<AgentJobType, AgentHandler> = {
  DEDUPE: dedupeAgent,
  ENRICHMENT: enrichmentAgent,
  FOLLOWUP: followupAgent,
  MEMORY: memoryAgent,
  RELATIONSHIP_HEALTH: relationshipHealthAgent,
  SEED_DATA: seedDataAgent,
  TIMELINE_SUMMARY: timelineSummaryAgent
};
