import type { MemoryProvider, MemoryWriteInput } from "./memory-provider";

export class MemPalaceMemoryProvider implements MemoryProvider {
  name = "mempalace";

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
  ) {}

  async writeSummary(input: MemoryWriteInput) {
    if (!this.endpoint || !this.apiKey) {
      throw new Error("MemPalace provider requires MEMPALACE_ENDPOINT and MEMPALACE_API_KEY.");
    }

    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/memory/summaries`, {
      body: JSON.stringify(input),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`MemPalace write failed with status ${response.status}.`);
    }
  }
}

