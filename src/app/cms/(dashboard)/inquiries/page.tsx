import { requireCmsSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InquiriesList } from "@/components/cms/inquiries-list";

export const metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";

export default async function CmsInquiriesPage() {
  await requireCmsSession();

  const [inquiries, unread] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.inquiry.count({ where: { read: false } }),
  ]);

  return (
    <InquiriesList
      initialUnread={unread}
      initial={inquiries.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        message: row.message,
        source: row.source,
        read: row.read,
        createdAt: row.createdAt.toISOString(),
      }))}
    />
  );
}
