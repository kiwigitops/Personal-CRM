export function classifyContactSegment(input: {
  relationshipStrength: number;
  tags: string[];
  warmthScore: number;
}) {
  if (input.tags.some((tag) => /investor|advisor/i.test(tag))) {
    return "Strategic Network";
  }
  if (input.relationshipStrength >= 80 && input.warmthScore >= 70) {
    return "Inner Circle";
  }
  if (input.warmthScore < 35) {
    return "Reactivation";
  }
  return "Nurture";
}

