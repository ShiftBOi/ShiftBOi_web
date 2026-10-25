"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { useCmsNotify } from "@/components/cms/cms-notify";

type SettingsTab = "profile" | "passkeys";

type PasskeyRow = {
  id: string;
  name: string | null;
  createdAt: string | Date | null;
  deviceType?: string | null;
};

export function CmsAccountSettings({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const notify = useCmsNotify();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [displayName, setDisplayName] = useState(name || "");
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadPasskeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (error) {
        notify.error("Could not load passkeys", error.message);
        return;
      }
      setPasskeys((data as PasskeyRow[]) || []);
    } catch (err) {
      notify.error(
        "Could not load passkeys",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoadingKeys(false);
    }
  }, [notify]);

  useEffect(() => {
    if (tab === "passkeys") void loadPasskeys();
  }, [tab, loadPasskeys]);

  function saveProfile() {
    startTransition(async () => {
      const { error } = await authClient.updateUser({
        name: displayName.trim() || email.split("@")[0] || "Admin",
      });
      if (error) {
        notify.error("Profile not saved", error.message);
        return;
      }
      notify.success("Profile updated");
    });
  }

  function registerPasskey() {
    startTransition(async () => {
      const label =
        typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)
          ? "This Mac"
          : "This device";
      const { error } = await authClient.passkey.addPasskey({ name: label });
      if (error) {
        notify.error("Passkey not registered", error.message);
        return;
      }
      notify.success("Passkey registered");
      await loadPasskeys();
    });
  }

  function removePasskey(id: string) {
    startTransition(async () => {
      const ok = await notify.confirm({
        title: "Remove this passkey?",
        description: "You will need OTP or another passkey to sign in.",
        confirmLabel: "Remove",
        danger: true,
      });
      if (!ok) return;
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        notify.error("Could not remove passkey", error.message);
        return;
      }
      notify.success("Passkey removed");
      await loadPasskeys();
    });
  }

  return (
    <div className="cms-settings">
      <div className="cms-settings-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "profile"}
          className={`cms-settings-tab${tab === "profile" ? " is-active" : ""}`}
          onClick={() => setTab("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "passkeys"}
          className={`cms-settings-tab${tab === "passkeys" ? " is-active" : ""}`}
          onClick={() => setTab("passkeys")}
        >
          Passkeys
        </button>
      </div>

      {tab === "profile" ? (
        <div className="cms-panel" role="tabpanel">
          <h2 className="cms-panel-title">Profile</h2>
          <p className="cms-panel-lead">
            Display name for the CMS shell. Sign-in email stays locked to the
            admin allowlist.
          </p>
          <label className="cms-field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="cms-field">
            <span>Email</span>
            <input value={email} disabled readOnly />
          </label>
          <div className="cms-actions">
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              disabled={pending}
              onClick={saveProfile}
            >
              {pending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      ) : (
        <div className="cms-panel" role="tabpanel">
          <h2 className="cms-panel-title">Device passkeys</h2>
          <p className="cms-panel-lead">
            Register a passkey after OTP login for passwordless return visits.
          </p>
          <div className="cms-actions">
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              disabled={pending}
              onClick={registerPasskey}
            >
              {pending ? "Waiting for authenticator…" : "Register passkey"}
            </button>
            <button
              type="button"
              className="cms-btn"
              disabled={loadingKeys}
              onClick={() => void loadPasskeys()}
            >
              Refresh
            </button>
          </div>

          <ul className="cms-passkey-list">
            {loadingKeys && !passkeys.length ? (
              <li className="cms-passkey-empty">Loading…</li>
            ) : null}
            {!loadingKeys && !passkeys.length ? (
              <li className="cms-passkey-empty">No passkeys yet.</li>
            ) : null}
            {passkeys.map((key) => (
              <li key={key.id} className="cms-passkey-row">
                <div>
                  <p className="cms-passkey-name">{key.name || "Unnamed device"}</p>
                  <p className="cms-passkey-meta">
                    {key.createdAt
                      ? new Date(key.createdAt).toLocaleString()
                      : "—"}
                    {key.deviceType ? ` · ${key.deviceType}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="cms-btn is-danger"
                  disabled={pending}
                  onClick={() => removePasskey(key.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
