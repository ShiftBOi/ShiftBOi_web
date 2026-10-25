"use client";

import { useCmsNotify } from "@/components/management/cms-notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetch-json";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { cn } from "cn";
import { LOG_RETENTION_OPTIONS } from "@/lib/log-retention-options";
import {
  ChevronDown,
  Fingerprint,
  Globe,
  Languages,
  Laptop,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  TabletSmartphone,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SettingsTab = "account" | "passkeys" | "web" | "locales";

type LocaleRow = {
  id: string;
  label: string;
  code: string;
  path: string;
  enabled: boolean;
};
type DeviceKind = "desktop" | "laptop" | "phone" | "tablet" | "ipad";

type RetentionSlice = {
  retention: string;
  label: string;
  days: number | null;
  lastPurgeAt: string | null;
};

type PasskeyRow = {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string | null;
};

type AccountUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

const NAV_SECTIONS: {
  label: string;
  items: { id: SettingsTab; label: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Account settings",
    items: [
      { id: "account", label: "Profile", icon: UserRound },
      { id: "passkeys", label: "Passkeys", icon: Fingerprint },
    ],
  },
  {
    label: "Website settings",
    items: [
      { id: "web", label: "Logs & cleanup", icon: Globe },
      { id: "locales", label: "Languages", icon: Languages },
    ],
  },
];

const DEVICE_KINDS: {
  id: DeviceKind;
  label: string;
  icon: LucideIcon;
  aliases: string[];
}[] = [
  {
    id: "desktop",
    label: "Desktop",
    icon: Monitor,
    aliases: ["desktop", "pc", "computer", "imac", "mac mini", "workstation"],
  },
  {
    id: "laptop",
    label: "Laptop",
    icon: Laptop,
    aliases: ["laptop", "macbook", "notebook", "chromebook"],
  },
  {
    id: "phone",
    label: "Phone",
    icon: Smartphone,
    aliases: ["phone", "iphone", "android", "mobile"],
  },
  {
    id: "tablet",
    label: "Tablet",
    icon: TabletSmartphone,
    aliases: ["tablet", "android tablet"],
  },
  {
    id: "ipad",
    label: "iPad",
    icon: Tablet,
    aliases: ["ipad"],
  },
];

/** Friendly passkey name from the current browser / OS — “This Mac”, “This iPhone”, etc. */
function detectDeviceProfile(): { kind: DeviceKind; label: string } {
  if (typeof navigator === "undefined") {
    return { kind: "laptop", label: "This device" };
  }

  const ua = navigator.userAgent;
  const platform =
    (
      navigator as Navigator & {
        userAgentData?: { platform?: string; mobile?: boolean };
      }
    ).userAgentData?.platform ||
    navigator.platform ||
    "";
  const mobileHint =
    (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
      .userAgentData?.mobile === true;
  const touch =
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;

  const p = `${platform} ${ua}`.toLowerCase();

  if (/iphone/.test(p)) return { kind: "phone", label: "This iPhone" };
  if (/ipad/.test(p) || ( /macintosh/.test(p) && touch)) {
    return { kind: "ipad", label: "This iPad" };
  }
  if (/android/.test(p) && (/mobile/.test(p) || mobileHint)) {
    return { kind: "phone", label: "This phone" };
  }
  if (/android/.test(p)) return { kind: "tablet", label: "This tablet" };
  if (/mac os|macintosh|macintel/.test(p)) {
    return { kind: "laptop", label: "This Mac" };
  }
  if (/windows/.test(p)) {
    return mobileHint
      ? { kind: "phone", label: "This phone" }
      : { kind: "desktop", label: "This PC" };
  }
  if (/cros/.test(p)) return { kind: "laptop", label: "This Chromebook" };
  if (/linux/.test(p)) {
    return mobileHint
      ? { kind: "phone", label: "This phone" }
      : { kind: "desktop", label: "This computer" };
  }
  if (mobileHint || /mobile|mobi/.test(p)) {
    return { kind: "phone", label: "This phone" };
  }
  return { kind: "laptop", label: "This device" };
}

function formatPasskeyLabel(kind: DeviceKind, name: string) {
  const kindLabel =
    DEVICE_KINDS.find((d) => d.id === kind)?.label ?? "Device";
  const trimmed = name.trim() || "This device";
  return `${kindLabel} · ${trimmed}`;
}

function parseDeviceKind(label: string | null): DeviceKind {
  const text = (label || "").toLowerCase();
  if (!text) return "laptop";

  // Prefer structured "Laptop · …" prefix
  const prefix = text.split("·")[0]?.trim() ?? text;
  for (const device of DEVICE_KINDS) {
    if (
      prefix === device.id ||
      prefix === device.label.toLowerCase() ||
      device.aliases.some((a) => prefix === a)
    ) {
      return device.id;
    }
  }

  for (const device of DEVICE_KINDS) {
    if (
      device.aliases.some((a) => text.includes(a)) ||
      text.includes(device.label.toLowerCase())
    ) {
      return device.id;
    }
  }

  return "laptop";
}

function displayPasskeyName(label: string | null) {
  if (!label?.trim()) return "This device";
  const parts = label.split("·");
  if (parts.length > 1) {
    const name = parts.slice(1).join("·").trim();
    if (name) return name;
  }
  // Already a friendly name like "This Mac"
  if (/^this\s+/i.test(label.trim())) return label.trim();
  return label;
}

function DeviceIcon({ kind, className }: { kind: DeviceKind; className?: string }) {
  const Icon = DEVICE_KINDS.find((d) => d.id === kind)?.icon ?? Laptop;
  return <Icon className={className} aria-hidden />;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CmsAccountSettings({
  open,
  onOpenChange,
  user,
  initialTab = "account",
  onUserUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AccountUser;
  /** Which sidebar pane to show when the dialog opens */
  initialTab?: SettingsTab;
  onUserUpdated?: (next: AccountUser) => void;
}) {
  const notify = useCmsNotify();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [detectedDevice, setDetectedDevice] = useState(() =>
    detectDeviceProfile()
  );
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [aiRetention, setAiRetention] = useState<RetentionSlice | null>(null);
  const [auditRetention, setAuditRetention] = useState<RetentionSlice | null>(
    null
  );
  const [savingRetention, setSavingRetention] = useState<
    "ai" | "audit" | null
  >(null);
  const [localeRows, setLocaleRows] = useState<LocaleRow[]>([]);
  const [savingLocale, setSavingLocale] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setUsername(user.username);
    setEmail(user.email);
    setAvatarUrl(user.avatarUrl || "");
    setDetectedDevice(detectDeviceProfile());
    setMessage(null);
    setError(null);
    void loadPasskeys();
    void loadRetention();
    void loadLocales();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on open only
  }, [open, user, initialTab]);

  const loadPasskeys = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      passkeys?: PasskeyRow[];
    }>("/api/auth/passkey");
    if (ok && data.passkeys) setPasskeys(data.passkeys);
  }, []);

  const loadRetention = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: { ai?: RetentionSlice; audit?: RetentionSlice };
    }>("/api/cms/log-retention");
    if (ok && data.data) {
      if (data.data.ai) setAiRetention(data.data.ai);
      if (data.data.audit) setAuditRetention(data.data.audit);
    }
  }, []);

  const loadLocales = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: { languages?: LocaleRow[] };
    }>("/api/cms/locales");
    if (ok && data.data?.languages) setLocaleRows(data.data.languages);
  }, []);

  function switchTab(next: SettingsTab) {
    setTab(next);
    setMessage(null);
    setError(null);
  }

  async function toggleLocale(locale: string, enabled: boolean) {
    setSavingLocale(locale);
    setError(null);
    setMessage(null);
    const row = localeRows.find((r) => r.id === locale);
    const label = row?.label ?? locale.toUpperCase();
    try {
      const { ok, data } = await fetchJson<{
        success?: boolean;
        data?: { languages?: LocaleRow[] };
        error?: string;
      }>("/api/cms/locales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, enabled }),
      });
      if (!ok || !data.data?.languages) {
        notify.error(
          "Language update failed",
          data.error || "Couldn’t change public locale"
        );
        return;
      }
      setLocaleRows(data.data.languages);
      if (enabled) {
        notify.success(`${label} opened`, {
          description: `/${locale} is public again`,
        });
      } else {
        notify.success(`${label} closed`, {
          description: `/${locale} redirects to an open language`,
        });
      }
    } catch (error) {
      notify.error(
        "Language update failed",
        error instanceof Error ? error.message : "Unexpected error"
      );
    } finally {
      setSavingLocale(null);
    }
  }

  async function updateRetention(target: "ai" | "audit", retention: string) {
    setSavingRetention(target);
    setError(null);
    setMessage(null);
    try {
      const { ok, data } = await fetchJson<{
        success?: boolean;
        data?: {
          ai?: RetentionSlice;
          audit?: RetentionSlice;
          deleted?: number;
        };
        error?: string;
      }>("/api/cms/log-retention", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, retention }),
      });
      if (!ok || !data.data) {
        setError(data.error || "Could not update auto-delete");
        return;
      }
      if (data.data.ai) setAiRetention(data.data.ai);
      if (data.data.audit) setAuditRetention(data.data.audit);
      const removed =
        typeof data.data.deleted === "number" && data.data.deleted > 0
          ? ` · removed ${data.data.deleted} old rows`
          : "";
      setMessage(
        target === "ai"
          ? `AI log auto-delete updated${removed}`
          : `Audit log auto-delete updated${removed}`
      );
    } catch {
      setError("Could not update auto-delete");
    } finally {
      setSavingRetention(null);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { ok, data } = await fetchJson<{
        success?: boolean;
        data?: AccountUser;
        error?: string;
      }>("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });
      if (!ok || !data.data) {
        setError(data.error || "Could not save profile");
        return;
      }
      onUserUpdated?.(data.data);
      setMessage("Profile saved");
    } catch {
      setError("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a PNG or JPEG image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const image = await fileToBase64(file);
      const { ok, data } = await fetchJson<{
        data?: AccountUser;
        error?: string;
      }>("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!ok || !data.data) {
        setError(data.error || "Could not upload photo");
        return;
      }
      setAvatarUrl(data.data.avatarUrl || "");
      onUserUpdated?.(data.data);
      setMessage("Photo updated");
    } catch {
      setError("Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function registerPasskey() {
    if (!browserSupportsWebAuthn()) {
      setError("Passkeys are not supported in this browser");
      return;
    }
    setPasskeyBusy(true);
    setError(null);
    setMessage(null);
    try {
      const optRes = await fetch("/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register-options" }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "Failed");
      const credential = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register-verify",
          credential,
          label: formatPasskeyLabel(
            detectedDevice.kind,
            detectedDevice.label
          ),
        }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || "Failed");
      setMessage("Passkey saved — you can skip OTP next login");
      await loadPasskeys();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Passkey registration failed"
      );
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function removePasskey(id: string) {
    if (!window.confirm("Remove this passkey?")) return;
    const { ok, data } = await fetchJson<{ error?: string }>(
      `/api/auth/passkey?id=${id}`,
      { method: "DELETE" }
    );
    if (!ok) {
      setError(data.error || "Could not delete passkey");
      return;
    }
    setMessage("Passkey removed");
    await loadPasskeys();
  }

  const dirty =
    username.trim() !== user.username ||
    email.trim().toLowerCase() !== user.email.toLowerCase();

  const paneTitle =
    tab === "account"
      ? "Profile"
      : tab === "passkeys"
        ? "Passkeys"
        : tab === "locales"
          ? "Languages"
          : "Logs & cleanup";

  const openLocaleCount = localeRows.filter((r) => r.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="cms-profile-dialog gap-0 overflow-hidden p-0"
        data-hq-scroll-thumb="off"
      >
        <div className="cms-profile">
          <nav className="cms-profile__nav" aria-label="Settings">
            <div className="cms-profile__nav-head">
              <DialogTitle className="cms-profile__nav-title">
                Settings
              </DialogTitle>
              <DialogDescription className="cms-profile__nav-desc">
                Account &amp; website
              </DialogDescription>
            </div>
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="cms-profile__nav-section">
                <p className="cms-profile__nav-label">{section.label}</p>
                {section.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "cms-profile__nav-item",
                      tab === id && "is-active"
                    )}
                    onClick={() => switchTab(id)}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="cms-profile__pane">
            <h3 className="cms-settings-pane__title">{paneTitle}</h3>

            {message ? (
              <p className="cms-profile__toast is-ok">{message}</p>
            ) : null}
            {error ? (
              <p className="cms-profile__toast is-err">{error}</p>
            ) : null}

            {tab === "account" ? (
              <div className="cms-settings-pane cms-settings-pane--profile">
                <div className="cms-settings-pane__body">
                  <div className="cms-profile__photo-row">
                    <div className="cms-profile__avatar">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" />
                      ) : (
                        <span>{initials(username || user.username)}</span>
                      )}
                    </div>
                    <div className="cms-profile__photo-copy">
                      <p className="cms-profile__photo-title">Upload Image</p>
                      <p className="cms-profile__photo-hint">
                        PNG or JPEG · up to 5 MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="cms-profile__upload-btn"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Upload className="size-3.5" />
                      )}
                      {uploading ? "Uploading…" : "Upload Picture"}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void uploadAvatar(file);
                      }}
                    />
                  </div>

                  <div className="cms-settings-list">
                    <label className="cms-settings-row">
                      <div className="cms-settings-row__copy">
                        <p className="cms-settings-row__label">Display name</p>
                        <p className="cms-settings-row__hint">
                          Shown in the CMS sidebar
                        </p>
                      </div>
                      <div className="cms-settings-row__control">
                        <Input
                          className="cms-settings-input"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoComplete="username"
                          maxLength={50}
                        />
                      </div>
                    </label>

                    <label className="cms-settings-row">
                      <div className="cms-settings-row__copy">
                        <p className="cms-settings-row__label">Email</p>
                        <p className="cms-settings-row__hint">
                          Used for OTP sign-in
                        </p>
                      </div>
                      <div className="cms-settings-row__control">
                        <Input
                          className="cms-settings-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="cms-settings-pane__footer">
                  <button
                    type="button"
                    className="cms-settings-btn"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    className="cms-settings-btn-primary"
                    disabled={!dirty || saving}
                    onClick={() => void saveProfile()}
                  >
                    {saving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    Save changes
                  </Button>
                </div>
              </div>
            ) : null}

            {tab === "passkeys" ? (
              <div className="cms-passkey-stack">
                <article className="cms-passkey-card cms-passkey-card--add">
                  <span className="cms-passkey-card__icon" aria-hidden>
                    <DeviceIcon
                      kind={detectedDevice.kind}
                      className="size-4"
                    />
                  </span>
                  <div className="cms-passkey-card__body">
                    <p className="cms-passkey-card__name">
                      {detectedDevice.label}
                    </p>
                    <div className="cms-passkey-card__meta">
                      <span className="cms-passkey-card__badge">This device</span>
                      <span>Detected from this browser</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cms-settings-btn-primary"
                    disabled={passkeyBusy}
                    onClick={() => void registerPasskey()}
                  >
                    {passkeyBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Fingerprint className="size-3.5" aria-hidden />
                    )}
                    <span>
                      {passkeyBusy ? "Waiting…" : "Register passkey"}
                    </span>
                  </button>
                </article>

                <div className="cms-passkey-section__head">
                  <h4 className="cms-passkey-section__title">
                    Saved passkeys
                  </h4>
                  <span className="cms-passkey-section__count">
                    {passkeys.length}{" "}
                    {passkeys.length === 1 ? "device" : "devices"}
                  </span>
                </div>

                {passkeys.length === 0 ? (
                  <p className="cms-passkey-empty">
                    No passkeys yet — register this device to skip OTP next
                    login.
                  </p>
                ) : (
                  <ul className="cms-passkey-list">
                    {passkeys.map((pk) => {
                      const kind = parseDeviceKind(pk.label);
                      const kindMeta = DEVICE_KINDS.find((d) => d.id === kind);
                      return (
                        <li key={pk.id} className="cms-passkey-card">
                          <span className="cms-passkey-card__icon" aria-hidden>
                            <DeviceIcon kind={kind} className="size-4" />
                          </span>
                          <div className="cms-passkey-card__body">
                            <p className="cms-passkey-card__name">
                              {displayPasskeyName(pk.label)}
                            </p>
                            <div className="cms-passkey-card__meta">
                              <span className="cms-passkey-card__badge">
                                {kindMeta?.label ?? "Device"}
                              </span>
                              <span>
                                Added{" "}
                                {new Date(pk.createdAt).toLocaleDateString()}
                              </span>
                              {pk.lastUsedAt ? (
                                <span>
                                  · last used{" "}
                                  {new Date(pk.lastUsedAt).toLocaleDateString()}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cms-settings-btn is-danger"
                            onClick={() => void removePasskey(pk.id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            <span>Remove</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {tab === "web" ? (
              <>
                <div className="cms-settings-list">
                  <div className="cms-settings-row">
                    <div className="cms-settings-row__copy">
                      <p className="cms-settings-row__label">AI usage log</p>
                      <p className="cms-settings-row__hint">
                        Auto-delete translation / model call history
                        {aiRetention?.lastPurgeAt
                          ? ` · last cleanup ${new Date(aiRetention.lastPurgeAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="cms-settings-row__control">
                      <div className="cms-settings-select">
                        <select
                          aria-label="AI log retention"
                          disabled={savingRetention === "ai" || !aiRetention}
                          value={aiRetention?.retention ?? "month"}
                          onChange={(e) =>
                            void updateRetention("ai", e.target.value)
                          }
                        >
                          {LOG_RETENTION_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="cms-settings-select__chev" />
                      </div>
                    </div>
                  </div>

                  <div className="cms-settings-row">
                    <div className="cms-settings-row__copy">
                      <p className="cms-settings-row__label">Audit log</p>
                      <p className="cms-settings-row__hint">
                        Auto-delete CMS action history — separate from AI logs
                        {auditRetention?.lastPurgeAt
                          ? ` · last cleanup ${new Date(auditRetention.lastPurgeAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="cms-settings-row__control">
                      <div className="cms-settings-select">
                        <select
                          aria-label="Audit log retention"
                          disabled={
                            savingRetention === "audit" || !auditRetention
                          }
                          value={auditRetention?.retention ?? "month"}
                          onChange={(e) =>
                            void updateRetention("audit", e.target.value)
                          }
                        >
                          {LOG_RETENTION_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="cms-settings-select__chev" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {tab === "locales" ? (
              <div className="cms-settings-list">
                <p className="cms-settings-locales-lead">
                  Close a language to stop public detection and block its URL
                  (e.g. <code>/th</code>). CMS editors still keep every locale for
                  content work. At least one language must stay open.
                </p>
                {localeRows.map((row) => {
                  const lockedLast = row.enabled && openLocaleCount <= 1;
                  const busy = savingLocale === row.id;
                  return (
                    <div key={row.id} className="cms-settings-row">
                      <div className="cms-settings-row__copy">
                        <p className="cms-settings-row__label">
                          {row.label}
                          <span className="cms-settings-locales-path">
                            {row.path}
                          </span>
                        </p>
                        {lockedLast ? (
                          <p className="cms-settings-row__hint">
                            Keep at least one language open
                          </p>
                        ) : null}
                      </div>
                      <div className="cms-settings-row__control">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.enabled}
                          aria-label={`${row.enabled ? "Close" : "Open"} ${row.label}`}
                          disabled={busy || lockedLast}
                          className={cn(
                            "cms-settings-switch",
                            row.enabled && "is-on",
                            (busy || lockedLast) && "is-disabled"
                          )}
                          onClick={() =>
                            void toggleLocale(row.id, !row.enabled)
                          }
                        >
                          <span className="cms-settings-switch__thumb" />
                          {busy ? (
                            <Loader2 className="cms-settings-switch__spin size-3.5 animate-spin" />
                          ) : null}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
