import { requireCmsSession } from "@/lib/session";
import { CmsNav } from "@/components/cms/nav";
import { CmsTopbar } from "@/components/cms/topbar";
import { CmsQuickChat } from "@/components/cms/quick-chat";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCmsSession();

  return (
    <div className="cms-app">
      <CmsNav />
      <div className="cms-stage">
        <CmsTopbar email={session.user.email} />
        <div className="cms-main">{children}</div>
      </div>
      <CmsQuickChat />
    </div>
  );
}
