import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function notificationsModule(app: FastifyInstance) {
  app.get(
    "/notifications/in-app",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const reminders = await app.prisma.reminder.findMany({
        where: {
          channel: "IN_APP",
          readAt: null,
          scheduledFor: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          workspaceId: request.auth!.workspaceId
        },
        include: {
          contact: true,
          followup: true
        },
        orderBy: {
          scheduledFor: "asc"
        },
        take: 20
      });

      return reminders.map((reminder) => ({
        contactId: reminder.contactId,
        contactName: `${reminder.contact.firstName} ${reminder.contact.lastName}`,
        followupId: reminder.followupId,
        id: reminder.id,
        message: reminder.followup.prompt,
        scheduledFor: reminder.scheduledFor.toISOString()
      }));
    },
  );

  app.post(
    "/notifications/in-app/:reminderId/read",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { reminderId } = z.object({ reminderId: z.string() }).parse(request.params);
      const reminder = await app.prisma.reminder.findFirst({
        where: {
          id: reminderId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!reminder) {
        reply.status(404).send({ message: "Reminder not found." });
        return;
      }

      await app.prisma.reminder.update({
        where: { id: reminder.id },
        data: { readAt: new Date() }
      });

      return { ok: true };
    },
  );
}
