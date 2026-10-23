import { requireCmsSession } from "@/lib/session";
import { getSiteContent } from "@/lib/content";
import { SiteSettingsEditor } from "@/components/cms/site-settings-editor";

export const metadata = { title: "Site" };
export const dynamic = "force-dynamic";

export default async function CmsSitePage() {
  await requireCmsSession();
  const site = await getSiteContent();
  return <SiteSettingsEditor initial={site} />;
}
