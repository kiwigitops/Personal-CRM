export type MemoryWriteInput = {
  contactId: string;
  keyFacts: string[];
  nextBestAction: string;
  summary: string;
  warmthScore: number;
  workspaceId: string;
};

export interface MemoryProvider {
  name: string;
  writeSummary(input: MemoryWriteInput): Promise<void>;
}

