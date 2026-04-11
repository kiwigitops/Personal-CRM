import type pino from "pino";

import type { PrismaClient } from "../generated/prisma";
import type { MemoryProvider } from "./providers/memory-provider";

export type AgentContext = {
  logger: pino.Logger;
  memoryProvider: MemoryProvider;
  prisma: PrismaClient;
};

export type AgentHandlerInput = {
  agentJobId: string;
  contactId?: string | null;
  payload: Record<string, unknown>;
  workspaceId: string;
};

export type AgentHandler = (
  context: AgentContext,
  input: AgentHandlerInput,
) => Promise<Record<string, unknown>>;
