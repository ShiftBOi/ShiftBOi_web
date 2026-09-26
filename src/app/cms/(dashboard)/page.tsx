import { requireCmsSession } from "@/lib/session";
import { CmsDashboard } from "@/components/cms/dashboard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function CmsHomePage() {
  await requireCmsSession();
  return <CmsDashboard />;
}
