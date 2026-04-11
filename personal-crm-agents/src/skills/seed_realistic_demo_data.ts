import { subDays } from "date-fns";

export type DemoContactSeed = {
  city: string;
  company: string;
  email: string;
  firstName: string;
  interactions: Array<{
    daysAgo: number;
    notes: string;
    title: string;
    type: "CALL" | "TEXT" | "EMAIL" | "MEETING" | "NOTE" | "TASK";
  }>;
  lastName: string;
  relationshipStrength: number;
  tags: string[];
  title: string;
};

export function seedRealisticDemoData() {
  const contacts: DemoContactSeed[] = [
    {
      city: "Austin",
      company: "Northstar Labs",
      email: "maya@northstar.example",
      firstName: "Maya",
      interactions: [
        {
          daysAgo: 3,
          notes: "Maya is hiring a design systems lead and prefers concise async updates.",
          title: "Discussed hiring plans",
          type: "MEETING"
        },
        {
          daysAgo: 34,
          notes: "Sent notes on onboarding metrics and offered a warm intro.",
          title: "Shared onboarding metrics",
          type: "EMAIL"
        }
      ],
      lastName: "Patel",
      relationshipStrength: 86,
      tags: ["Inner Circle", "Founder"],
      title: "CEO"
    },
    {
      city: "Seattle",
      company: "Cedar Fund",
      email: "owen@cedarfund.example",
      firstName: "Owen",
      interactions: [
        {
          daysAgo: 76,
          notes: "Owen is interested in vertical SaaS and asked for quarterly updates.",
          title: "Investor coffee",
          type: "MEETING"
        }
      ],
      lastName: "Kim",
      relationshipStrength: 68,
      tags: ["Investor"],
      title: "Partner"
    },
    {
      city: "Chicago",
      company: "Brightline Health",
      email: "elena@brightline.example",
      firstName: "Elena",
      interactions: [
        {
          daysAgo: 12,
          notes: "Elena likes clear product demos and is launching a referral program.",
          title: "Product partnership call",
          type: "CALL"
        },
        {
          daysAgo: 46,
          notes: "Met at alumni event. Mentioned family travel to Portugal.",
          title: "Alumni event follow-up",
          type: "NOTE"
        }
      ],
      lastName: "Rivera",
      relationshipStrength: 74,
      tags: ["Alumni", "Warm Intro"],
      title: "VP Growth"
    },
    {
      city: "New York",
      company: "Harbor Studio",
      email: "nora@harbor.example",
      firstName: "Nora",
      interactions: [
        {
          daysAgo: 122,
          notes: "Nora is exploring a new role and prefers text before calls.",
          title: "Career transition chat",
          type: "TEXT"
        }
      ],
      lastName: "Bennett",
      relationshipStrength: 55,
      tags: ["Reactivation"],
      title: "Design Director"
    }
  ];

  return {
    contacts: contacts.map((contact) => ({
      ...contact,
      interactions: contact.interactions.map((interaction) => ({
        ...interaction,
        happenedAt: subDays(new Date(), interaction.daysAgo)
      }))
    }))
  };
}
