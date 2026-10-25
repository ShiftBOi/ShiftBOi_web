"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetch-json";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { Fingerprint, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PasskeyRow = {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string | null;
};

export function SecurityPanel({
  user,
}: {
  user: { username: string; email: string };
}) {
  const [message, setMessage] = useState("");
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [label, setLabel] = useState("This Mac / browser");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await fetchJson<{ passkeys?: PasskeyRow[]; error?: string }>(
      "/api/auth/passkey"
    );
    if (ok && data.passkeys) setPasskeys(data.passkeys);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function registerPasskey() {
    if (!browserSupportsWebAuthn()) {
      setMessage("Passkeys not supported in this browser.");
      return;
    }
    setLoading(true);
    setMessage("");
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
          label: label.trim() || "This device",
        }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || "Failed");
      setMessage("Passkey saved. Next login can skip OTP.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Passkey registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function removePasskey(id: string) {
    if (!window.confirm("Remove this passkey?")) return;
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/auth/passkey?id=${id}`, {
      method: "DELETE",
    });
    if (!ok) {
      setMessage(data.error || "Could not delete");
      return;
    }
    setMessage("Passkey removed.");
    await load();
  }

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Security
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access & passkeys</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {user.username} · {user.email}
      </p>

      {message ? (
        <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm">{message}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        <div className="rounded-[22px] bg-white/70 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Fingerprint className="size-5 text-primary" />
            Register a passkey
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Touch ID / Face ID / Windows Hello — sign in without waiting for email OTP. Tables live
            on the shared Docker DB (`passkeys`, `auth_challenges`).
          </p>
          <label className="mt-5 block max-w-sm text-sm">
            <span className="mb-1 block font-medium">Device label</span>
            <Input
              className="h-10 rounded-full px-4"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <Button className="mt-5 rounded-full gap-2" onClick={registerPasskey} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}
            {loading ? "Waiting for authenticator…" : "Save passkey on this device"}
          </Button>
        </div>

        <div className="rounded-[22px] bg-white/70 p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Registered passkeys</h2>
          {passkeys.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              None yet — register one above, then use “Continue with passkey” on the login page.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-border/60"
                >
                  <div>
                    <p className="font-medium">{pk.label || "Passkey"}</p>
                    <p className="text-xs text-muted-foreground">
                      {pk.deviceType || "device"} · added{" "}
                      {new Date(pk.createdAt).toLocaleDateString()}
                      {pk.lastUsedAt
                        ? ` · last used ${new Date(pk.lastUsedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full text-red-600"
                    onClick={() => removePasskey(pk.id)}
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
