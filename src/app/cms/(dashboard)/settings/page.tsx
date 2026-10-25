import { requireCmsSession } from "@/lib/session";
import { CmsAccountSettings } from "@/components/cms/cms-account-settings";

export default async function CmsSettingsPage() {
  const session = await requireCmsSession();

  return (
    <CmsAccountSettings
      email={session.user.email}
      name={session.user.name}
    />
  );
}
