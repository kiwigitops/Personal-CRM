import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { recordAuditEvent } from "../../lib/audit";
import { serializeCompany } from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const companyBodySchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  name: z.string().min(1).max(120),
  website: z.string().url().nullable().optional()
});

export async function companiesModule(app: FastifyInstance) {
  app.get(
    "/companies",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const companies = await app.prisma.company.findMany({
        where: {
          deletedAt: null,
          workspaceId: request.auth!.workspaceId
        },
        orderBy: {
          name: "asc"
        }
      });

      return companies.map(serializeCompany);
    },
  );

  app.post(
    "/companies",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("CompanyCreateBody", companyBodySchema)
      }
    },
    async (request) => {
      const body = companyBodySchema.parse(request.body);
      const company = await app.prisma.company.create({
        data: {
          description: body.description,
          industry: body.industry,
          name: body.name,
          website: body.website,
          workspaceId: request.auth!.workspaceId
        }
      });

      await recordAuditEvent(app, {
        action: "company.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: company.id,
        entityType: "company",
        workspaceId: request.auth!.workspaceId
      });

      return serializeCompany(company);
    },
  );

  app.patch(
    "/companies/:companyId",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("CompanyUpdateBody", companyBodySchema.partial())
      }
    },
    async (request, reply) => {
      const { companyId } = z.object({ companyId: z.string() }).parse(request.params);
      const body = companyBodySchema.partial().parse(request.body);
      const company = await app.prisma.company.findFirst({
        where: {
          id: companyId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!company) {
        reply.status(404).send({ message: "Company not found." });
        return;
      }

      const updated = await app.prisma.company.update({
        where: { id: company.id },
        data: body
      });

      return serializeCompany(updated);
    },
  );
}

