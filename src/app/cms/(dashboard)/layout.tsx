import { requireCmsSession } from "@/lib/session";
import { CmsNav } from "@/components/cms/nav";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCmsSession();

  return (
    <div className="cms-app">
      <CmsNav email={session.user.email} />
      <div className="cms-main">{children}</div>
    </div>
  );
}
