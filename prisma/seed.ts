import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() || "rapeepongapic@gmail.com";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Admin",
      emailVerified: true,
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      emailVerified: true,
    },
  });

  const existing = await prisma.project.count();
  if (existing === 0) {
    await prisma.project.create({
      data: {
        slug: "webport-v2",
        title: "WebPort v2",
        summary: "Next.js portfolio with Postgres, Prisma, and OTP/passkey CMS.",
        description:
          "Single Next.js application serving the marketing site at / and the CMS at /cms. Authentication is email OTP and WebAuthn passkeys only — no passwords.",
        year: "2026",
        published: true,
        techStack: ["Next.js", "Prisma", "PostgreSQL", "Better Auth"],
        sortOrder: 0,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "brand" },
    update: {
      value: {
        name: "WebPort v2",
        tagline: "The Graph AI Runs On.",
        reference: "https://hydradb.com/",
      },
    },
    create: {
      key: "brand",
      value: {
        name: "WebPort v2",
        tagline: "The Graph AI Runs On.",
        reference: "https://hydradb.com/",
      },
    },
  });

  console.log(`Seeded admin user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
