import { requireCmsSession } from "@/lib/session";
import { CmsNav } from "@/components/cms/nav";
import { CmsGlassFilters } from "@/components/cms/glass-filters";

export default async function CmsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCmsSession();

  return (
    <div className="cms-app">
      <CmsGlassFilters />
      <CmsNav email={session.user.email} />
      <div className="cms-main">{children}</div>
    </div>
  );
}
