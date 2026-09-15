import { requireCmsSession } from "@/lib/session";
import { CmsNav } from "@/components/cms/nav";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCmsSession();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <CmsNav email={session.user.email} />
      <div className="flex-1 px-5 py-8 md:px-10">{children}</div>
    </div>
  );
}
