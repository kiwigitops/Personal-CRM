import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@personal-crm.local";
  const workspaceName = "Acme Relationships";
  const workspaceSlug = slugify(workspaceName, { lower: true, strict: true });
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: "Alex Morgan",
      passwordHash
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: {
      name: workspaceName,
      slug: workspaceSlug
    }
  });

  await prisma.membership.upsert({
    where: {
      workspaceId_userId: {
        userId: user.id,
        workspaceId: workspace.id
      }
    },
    update: {
      role: "OWNER"
    },
    create: {
      role: "OWNER",
      userId: user.id,
      workspaceId: workspace.id
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      currentWorkspaceId: workspace.id
    }
  });

  const tagSpecs = [
    { color: "#0ea5e9", name: "Inner Circle" },
    { color: "#22c55e", name: "Warm Intro" },
    { color: "#f97316", name: "Investor" },
    { color: "#8b5cf6", name: "Alumni" }
  ];

  for (const tag of tagSpecs) {
    await prisma.tag.upsert({
      where: {
        workspaceId_name: {
          name: tag.name,
          workspaceId: workspace.id
        }
      },
      update: {
        color: tag.color
      },
      create: {
        ...tag,
        workspaceId: workspace.id
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        login: {
          email,
          password: "password123"
        },
        workspaceId: workspace.id
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
