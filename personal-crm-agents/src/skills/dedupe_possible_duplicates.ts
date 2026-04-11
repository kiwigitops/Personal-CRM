export type DedupeContact = {
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string | null;
};

export function dedupePossibleDuplicates(contacts: DedupeContact[]) {
  const suggestions: Array<{
    confidence: number;
    duplicateContactId: string;
    primaryContactId: string;
    reason: string;
  }> = [];

  for (let i = 0; i < contacts.length; i += 1) {
    for (let j = i + 1; j < contacts.length; j += 1) {
      const a = contacts[i];
      const b = contacts[j];
      const sameEmail = a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
      const samePhone = a.phone && b.phone && a.phone === b.phone;
      const sameName =
        `${a.firstName} ${a.lastName}`.toLowerCase() ===
        `${b.firstName} ${b.lastName}`.toLowerCase();

      if (sameEmail || samePhone || sameName) {
        suggestions.push({
          confidence: sameEmail || samePhone ? 0.95 : 0.72,
          duplicateContactId: b.id,
          primaryContactId: a.id,
          reason: sameEmail ? "Matching email" : samePhone ? "Matching phone" : "Matching name"
        });
      }
    }
  }

  return suggestions;
}

