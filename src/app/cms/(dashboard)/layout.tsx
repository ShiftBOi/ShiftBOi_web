import { Suspense } from "react";
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
          <Suspense
            fallback={
              <header className="cms-topbar">
                <div className="cms-topbar-copy">
                  <p className="cms-topbar-eyebrow">Content</p>
                  <h1 className="cms-topbar-title">Projects</h1>
                </div>
              </header>
            }
          >
            <CmsTopbar email={session.user.email} />
          </Suspense>
          <div className="cms-main">{children}</div>
        </div>
        <CmsChatPanel />
      </CmsChatAppShell>
    </CmsChatProvider>
  );
}
