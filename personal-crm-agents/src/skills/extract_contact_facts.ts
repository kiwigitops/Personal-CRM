export type ExtractedContactFact = {
  confidence: number;
  factKey: string;
  kind: "preference" | "personal" | "professional" | "context";
  value: string;
};

const preferencePatterns = [
  /prefers? (?<value>[^.]+)/i,
  /likes? (?<value>[^.]+)/i,
  /interested in (?<value>[^.]+)/i
];

export function extractContactFacts(text: string): ExtractedContactFact[] {
  const facts: ExtractedContactFact[] = [];
  const clean = text.replace(/\s+/g, " ").trim();

  for (const pattern of preferencePatterns) {
    const match = clean.match(pattern);
    if (match?.groups?.value) {
      facts.push({
        confidence: 0.78,
        factKey: "preference",
        kind: "preference",
        value: match.groups.value.trim()
      });
    }
  }

  if (/hiring|fundraising|launch|new role|promotion/i.test(clean)) {
    facts.push({
      confidence: 0.82,
      factKey: "momentum",
      kind: "professional",
      value: clean.slice(0, 220)
    });
  }

  if (/family|kids|partner|birthday|travel/i.test(clean)) {
    facts.push({
      confidence: 0.7,
      factKey: "personal_context",
      kind: "personal",
      value: clean.slice(0, 220)
    });
  }

  if (facts.length === 0 && clean.length > 24) {
    facts.push({
      confidence: 0.55,
      factKey: "context",
      kind: "context",
      value: clean.slice(0, 220)
    });
  }

  return facts.slice(0, 5);
}

