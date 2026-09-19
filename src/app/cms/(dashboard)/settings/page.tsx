import { PasskeyManager } from "@/components/cms/passkey-manager";

export const metadata = {
  title: "Passkeys",
};

export default function CmsSettingsPage() {
  return (
    <div>
      <h1 className="cms-page-title">Passkeys</h1>
      <p className="cms-page-lead">
        Register a device passkey after OTP login for faster return visits.
      </p>
      <div className="cms-panel" style={{ maxWidth: 520 }}>
        <PasskeyManager />
      </div>
    </div>
  );
}
