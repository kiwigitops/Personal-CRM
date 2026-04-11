import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { z } from "zod";

import { recordAuditEvent } from "../../lib/audit";
import {
  contactDetailInclude,
  contactListInclude,
  serializeContactDetail,
  serializeContactListItem
} from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const contactBodySchema = z.object({
  avatarUrl: z.string().url().nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  companyId: z.string().nullable().optional(),
  companyName: z.string().max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  linkedinUrl: z.string().url().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  preferredName: z.string().max(80).nullable().optional(),
  relationshipStrength: z.number().min(0).max(100).default(50),
  tagIds: z.array(z.string()).default([]),
  title: z.string().max(120).nullable().optional()
});

const contactsQuerySchema = z.object({
  query: z.string().optional(),
  staleOnly: z.coerce.boolean().default(false),
  tagId: z.string().optional()
});

const savedFilterSchema = z.object({
  name: z.string().min(1).max(80),
  query: z.string().nullable().optional(),
  staleOnly: z.boolean().default(false),
  tagIds: z.array(z.string()).default([])
});

const importCsvSchema = z.object({
  csv: z.string().min(1)
});

async function syncContactTags(app: FastifyInstance, input: {
  contactId: string;
  tagIds: string[];
  workspaceId: string;
}) {
  await app.prisma.contactTag.deleteMany({
    where: {
      contactId: input.contactId,
      workspaceId: input.workspaceId
    }
  });

  if (input.tagIds.length === 0) {
    return;
  }

  const tags = await app.prisma.tag.findMany({
    where: {
      id: { in: input.tagIds },
      workspaceId: input.workspaceId
    }
  });

  await app.prisma.contactTag.createMany({
    data: tags.map((tag) => ({
      contactId: input.contactId,
      tagId: tag.id,
      workspaceId: input.workspaceId
    })),
    skipDuplicates: true
  });
}

async function syncPrimaryCompany(app: FastifyInstance, input: {
  companyId?: string | null;
  companyName?: string | null;
  contactId: string;
  title?: string | null;
  workspaceId: string;
}) {
  if (!input.companyId && !input.companyName) {
    return;
  }

  let companyId = input.companyId ?? null;

  if (!companyId && input.companyName) {
    const company = await app.prisma.company.upsert({
      where: {
        workspaceId_name: {
          name: input.companyName,
          workspaceId: input.workspaceId
        }
      },
      update: {},
      create: {
        name: input.companyName,
        workspaceId: input.workspaceId
      }
    });
    companyId = company.id;
  }

  if (!companyId) {
    return;
  }

  await app.prisma.contactCompanyLink.updateMany({
    where: {
      contactId: input.contactId,
      workspaceId: input.workspaceId
    },
    data: {
      isPrimary: false
    }
  });

  await app.prisma.contactCompanyLink.upsert({
    where: {
      contactId_companyId: {
        companyId,
        contactId: input.contactId
      }
    },
    update: {
      isPrimary: true,
      title: input.title
    },
    create: {
      companyId,
      contactId: input.contactId,
      isPrimary: true,
      title: input.title,
      workspaceId: input.workspaceId
    }
  });
}

export async function contactsModule(app: FastifyInstance) {
  app.get(
    "/contacts/export/csv",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const contacts = await app.prisma.contact.findMany({
        where: {
          deletedAt: null,
          workspaceId: request.auth!.workspaceId
        },
        include: contactListInclude,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
      });
      const rows = contacts.map((contact) => ({
        city: contact.city ?? "",
        company: contact.companies[0]?.company.name ?? "",
        email: contact.email ?? "",
        first_name: contact.firstName,
        last_name: contact.lastName,
        notes: contact.notes ?? "",
        phone: contact.phone ?? "",
        relationship_strength: contact.relationshipStrength,
        tags: contact.tags.map((entry) => entry.tag.name).join("|"),
        title: contact.title ?? ""
      }));

      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", "attachment; filename=contacts.csv");
      return stringify(rows, { header: true });
    },
  );

  app.post(
    "/contacts/import/csv",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("ContactsImportCsvBody", importCsvSchema)
      }
    },
    async (request) => {
      const body = importCsvSchema.parse(request.body);
      const rows = parse(body.csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as Array<Record<string, string>>;

      let imported = 0;

      for (const row of rows) {
        const firstName = row.first_name || row.firstName || row.name?.split(" ")[0] || "Unknown";
        const lastName =
          row.last_name ||
          row.lastName ||
          row.name?.split(" ").slice(1).join(" ") ||
          "Contact";
        const contact = await app.prisma.contact.create({
          data: {
            city: row.city || null,
            email: row.email || null,
            firstName,
            lastName,
            notes: row.notes || null,
            phone: row.phone || null,
            relationshipStrength: Number(row.relationship_strength || 50),
            source: "csv-import",
            title: row.title || null,
            warmthScore: Number(row.relationship_strength || 50),
            workspaceId: request.auth!.workspaceId
          }
        });

        if (row.company) {
          await syncPrimaryCompany(app, {
            companyName: row.company,
            contactId: contact.id,
            title: row.title || null,
            workspaceId: request.auth!.workspaceId
          });
        }

        if (row.tags) {
          const tagIds: string[] = [];
          for (const tagName of row.tags.split("|").map((tag) => tag.trim()).filter(Boolean)) {
            const tag = await app.prisma.tag.upsert({
              where: {
                workspaceId_name: {
                  name: tagName,
                  workspaceId: request.auth!.workspaceId
                }
              },
              update: {},
              create: {
                color: "#0ea5e9",
                name: tagName,
                workspaceId: request.auth!.workspaceId
              }
            });
            tagIds.push(tag.id);
          }
          await syncContactTags(app, {
            contactId: contact.id,
            tagIds,
            workspaceId: request.auth!.workspaceId
          });
        }

        imported += 1;
      }

      await app.queueAgentJob({
        enqueuedById: request.auth!.userId,
        payload: { imported },
        type: "DEDUPE",
        workspaceId: request.auth!.workspaceId
      });

      return { imported };
    },
  );

  app.get(
    "/contacts/saved-filters",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      return app.prisma.savedFilter.findMany({
        where: {
          userId: request.auth!.userId,
          workspaceId: request.auth!.workspaceId
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    },
  );

  app.post(
    "/contacts/saved-filters",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("ContactsSavedFilterBody", savedFilterSchema)
      }
    },
    async (request) => {
      const body = savedFilterSchema.parse(request.body);
      return app.prisma.savedFilter.create({
        data: {
          name: body.name,
          query: body.query,
          staleOnly: body.staleOnly,
          tagIds: body.tagIds,
          userId: request.auth!.userId,
          workspaceId: request.auth!.workspaceId
        }
      });
    },
  );

  app.get(
    "/contacts/dedupe-suggestions",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const contacts = await app.prisma.contact.findMany({
        where: {
          deletedAt: null,
          workspaceId: request.auth!.workspaceId
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 500
      });
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
              confidence: sameEmail || samePhone ? 0.95 : 0.74,
              duplicateContactId: b.id,
              primaryContactId: a.id,
              reason: sameEmail ? "Matching email" : samePhone ? "Matching phone" : "Matching name"
            });
          }
        }
      }

      return suggestions.slice(0, 25);
    },
  );

  app.get(
    "/contacts",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const query = contactsQuerySchema.parse(request.query);
      const where: Prisma.ContactWhereInput = {
        deletedAt: null,
        workspaceId: request.auth!.workspaceId
      };

      if (query.query) {
        where.OR = [
          { firstName: { contains: query.query, mode: "insensitive" } },
          { lastName: { contains: query.query, mode: "insensitive" } },
          { email: { contains: query.query, mode: "insensitive" } },
          { notes: { contains: query.query, mode: "insensitive" } }
        ];
      }

      if (query.staleOnly) {
        where.OR = [
          ...(where.OR ?? []),
          { lastInteractionAt: null },
          { lastInteractionAt: { lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } }
        ];
      }

      if (query.tagId) {
        where.tags = {
          some: {
            tagId: query.tagId
          }
        };
      }

      const contacts = await app.prisma.contact.findMany({
        where,
        include: contactListInclude,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 100
      });

      return contacts.map(serializeContactListItem);
    },
  );

  app.post(
    "/contacts",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("ContactCreateBody", contactBodySchema)
      }
    },
    async (request) => {
      const body = contactBodySchema.parse(request.body);
      const contact = await app.prisma.contact.create({
        data: {
          avatarUrl: body.avatarUrl,
          city: body.city,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          linkedinUrl: body.linkedinUrl,
          notes: body.notes,
          phone: body.phone,
          preferredName: body.preferredName,
          relationshipStrength: body.relationshipStrength,
          title: body.title,
          warmthScore: body.relationshipStrength,
          workspaceId: request.auth!.workspaceId
        }
      });

      await syncContactTags(app, {
        contactId: contact.id,
        tagIds: body.tagIds,
        workspaceId: request.auth!.workspaceId
      });
      await syncPrimaryCompany(app, {
        companyId: body.companyId,
        companyName: body.companyName,
        contactId: contact.id,
        title: body.title,
        workspaceId: request.auth!.workspaceId
      });
      await app.queueAgentJob({
        contactId: contact.id,
        enqueuedById: request.auth!.userId,
        payload: { contactId: contact.id, reason: "contact.created" },
        type: "MEMORY",
        workspaceId: request.auth!.workspaceId
      });
      await recordAuditEvent(app, {
        action: "contact.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: contact.id,
        entityType: "contact",
        workspaceId: request.auth!.workspaceId
      });

      const created = await app.prisma.contact.findUniqueOrThrow({
        where: { id: contact.id },
        include: contactDetailInclude
      });

      return serializeContactDetail(created);
    },
  );

  app.get(
    "/contacts/:contactId",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { contactId } = z.object({ contactId: z.string() }).parse(request.params);
      const contact = await app.prisma.contact.findFirst({
        where: {
          deletedAt: null,
          id: contactId,
          workspaceId: request.auth!.workspaceId
        },
        include: contactDetailInclude
      });

      if (!contact) {
        reply.status(404).send({ message: "Contact not found." });
        return;
      }

      return serializeContactDetail(contact);
    },
  );

  app.patch(
    "/contacts/:contactId",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("ContactUpdateBody", contactBodySchema.partial())
      }
    },
    async (request, reply) => {
      const { contactId } = z.object({ contactId: z.string() }).parse(request.params);
      const body = contactBodySchema.partial().parse(request.body);
      const contact = await app.prisma.contact.findFirst({
        where: {
          deletedAt: null,
          id: contactId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!contact) {
        reply.status(404).send({ message: "Contact not found." });
        return;
      }

      await app.prisma.contact.update({
        where: { id: contact.id },
        data: {
          avatarUrl: body.avatarUrl,
          city: body.city,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          linkedinUrl: body.linkedinUrl,
          notes: body.notes,
          phone: body.phone,
          preferredName: body.preferredName,
          relationshipStrength: body.relationshipStrength,
          title: body.title,
          warmthScore: body.relationshipStrength
        }
      });

      if (body.tagIds) {
        await syncContactTags(app, {
          contactId: contact.id,
          tagIds: body.tagIds,
          workspaceId: request.auth!.workspaceId
        });
      }

      await syncPrimaryCompany(app, {
        companyId: body.companyId,
        companyName: body.companyName,
        contactId: contact.id,
        title: body.title,
        workspaceId: request.auth!.workspaceId
      });

      await app.queueAgentJob({
        contactId: contact.id,
        enqueuedById: request.auth!.userId,
        payload: { contactId: contact.id, reason: "contact.updated" },
        type: "MEMORY",
        workspaceId: request.auth!.workspaceId
      });

      const updated = await app.prisma.contact.findUniqueOrThrow({
        where: { id: contact.id },
        include: contactDetailInclude
      });

      return serializeContactDetail(updated);
    },
  );

  app.delete(
    "/contacts/:contactId",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { contactId } = z.object({ contactId: z.string() }).parse(request.params);
      const contact = await app.prisma.contact.findFirst({
        where: {
          deletedAt: null,
          id: contactId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!contact) {
        reply.status(404).send({ message: "Contact not found." });
        return;
      }

      await app.prisma.contact.update({
        where: { id: contact.id },
        data: {
          deletedAt: new Date()
        }
      });

      await recordAuditEvent(app, {
        action: "contact.deleted",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: contact.id,
        entityType: "contact",
        workspaceId: request.auth!.workspaceId
      });

      return { ok: true };
    },
  );
}
