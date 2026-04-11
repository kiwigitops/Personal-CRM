import type { FastifyInstance } from "fastify";
import { z } from "zod";

const searchQuerySchema = z.object({
  query: z.string().min(1).max(100)
});

export async function searchModule(app: FastifyInstance) {
  app.get(
    "/search/global",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const { query } = searchQuerySchema.parse(request.query);
      const workspaceId = request.auth!.workspaceId;
      const [contacts, companies, interactions, followups] = await Promise.all([
        app.prisma.contact.findMany({
          where: {
            deletedAt: null,
            workspaceId,
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } }
            ]
          },
          take: 8
        }),
        app.prisma.company.findMany({
          where: {
            deletedAt: null,
            name: { contains: query, mode: "insensitive" },
            workspaceId
          },
          take: 5
        }),
        app.prisma.interaction.findMany({
          where: {
            workspaceId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } }
            ]
          },
          take: 5
        }),
        app.prisma.followup.findMany({
          where: {
            deletedAt: null,
            prompt: { contains: query, mode: "insensitive" },
            workspaceId
          },
          take: 5
        })
      ]);

      return [
        ...contacts.map((contact) => ({
          href: `/contacts/${contact.id}`,
          id: contact.id,
          subtitle: contact.email ?? contact.phone ?? "Contact",
          title: `${contact.firstName} ${contact.lastName}`,
          type: "contact" as const
        })),
        ...companies.map((company) => ({
          href: `/companies/${company.id}`,
          id: company.id,
          subtitle: company.industry ?? "Company",
          title: company.name,
          type: "company" as const
        })),
        ...interactions.map((interaction) => ({
          href: `/contacts/${interaction.contactId}`,
          id: interaction.id,
          subtitle: interaction.type,
          title: interaction.title,
          type: "note" as const
        })),
        ...followups.map((followup) => ({
          href: `/contacts/${followup.contactId}`,
          id: followup.id,
          subtitle: followup.channel,
          title: followup.prompt,
          type: "followup" as const
        }))
      ];
    },
  );
}

