import type { AgentHandler } from "../context";
import { memoryAgent } from "./memory-agent";

export const timelineSummaryAgent: AgentHandler = async (context, input) => {
  return memoryAgent(context, input);
};

