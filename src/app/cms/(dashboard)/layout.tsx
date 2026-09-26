import { requireCmsSession } from "@/lib/session";
import { CmsNav } from "@/components/cms/nav";
import { CmsTopbar } from "@/components/cms/topbar";
import { CmsChatPanel } from "@/components/cms/quick-chat";
import { CmsChatProvider } from "@/components/cms/chat-context";
import { CmsChatAppShell } from "@/components/cms/chat-app-shell";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCmsSession();

  return (
    <CmsChatProvider>
      <CmsChatAppShell>
        <CmsNav />
        <div className="cms-stage">
          <CmsTopbar email={session.user.email} />
          <div className="cms-main">{children}</div>
        </div>
        <CmsChatPanel />
      </CmsChatAppShell>
    </CmsChatProvider>
  );
}
