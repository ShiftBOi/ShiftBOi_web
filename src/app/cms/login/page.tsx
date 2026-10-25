"use client";

import { CmsMark } from "@/components/management/cms-mark";
import { CmsThemeToggle } from "@/components/management/cms-theme";
import { authClient } from "@/lib/auth-client";
import { ADMIN_EMAIL } from "@/lib/constants";
import { Fingerprint, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function CmsLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyOk, setPasskeyOk] = useState(false);

  useEffect(() => {
    setPasskeyOk(
      typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined",
    );
  }, []);

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/cms/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStep("otp");
      setStatus(
        data.delivery === "email"
          ? "OTP sent. Check your inbox."
          : "SMTP off — check the server terminal for the code.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: ADMIN_EMAIL,
        otp,
      });
      if (error) throw new Error(error.message || "Verify failed");
      router.push("/cms");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Verify failed");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPasskey() {
    if (!passkeyOk) {
      setStatus("This browser does not support passkeys.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const { error } = await authClient.signIn.passkey({});
      if (error) throw new Error(error.message || "Passkey failed");
      router.push("/cms");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Passkey failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cms-login">
      <aside className="cms-login__brand">
        <Link href="/" className="cms-login__mark">
          <CmsMark className="cms-login__icon" title="ShiftBOi" />
          <span className="cms-login__meta">shiftboi.xyz</span>
        </Link>

        <div className="cms-login__brand-copy">
          <p className="cms-login__meta">Content studio</p>
          <h1>Sign in to CMS</h1>
          <p>
            Edit projects, case studies, and site content — same visual language
            as the portfolio, built for fast publishing.
          </p>
        </div>

        <p className="cms-login__meta">OTP · Passkey · Shared DB</p>
      </aside>

      <section className="cms-login__panel">
        <CmsThemeToggle className="cms-login__theme" />

        <div className="cms-login__card">
          <p className="cms-eyebrow">Authentication</p>
          <h2>{step === "email" ? "Welcome back" : "Enter code"}</h2>
          <p>
            {step === "email"
              ? "Request a one-time code for the locked admin inbox, or continue with a registered passkey."
              : `We sent a 6-digit code to ${ADMIN_EMAIL}.`}
          </p>

          {step === "email" ? (
            <form onSubmit={requestOtp} className="cms-login__stack">
              <div>
                <label htmlFor="email" className="cms-label">
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={ADMIN_EMAIL}
                  readOnly
                  className="cms-input"
                />
                <p className="cms-login__hint">
                  Locked to the configured admin allowlist.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="cms-btn cms-btn--primary w-full"
              >
                <Mail className="size-4" />
                {loading ? "Sending…" : "Send OTP"}
              </button>
              <button
                type="button"
                disabled={loading || !passkeyOk}
                onClick={() => void loginWithPasskey()}
                className="cms-btn cms-btn--ghost w-full"
              >
                <Fingerprint className="size-4" />
                Continue with passkey
              </button>
              {!passkeyOk ? (
                <p className="cms-login__hint">
                  Passkeys unavailable in this browser — use OTP.
                </p>
              ) : null}
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="cms-login__stack">
              <div className="cms-login__dev">
                <p className="cms-label" style={{ marginBottom: 0 }}>
                  <KeyRound className="mr-1 inline size-3.5" />
                  Code sent
                </p>
              </div>
              <div>
                <label htmlFor="otp" className="cms-label">
                  6-digit code
                </label>
                <input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="cms-input"
                  style={{ letterSpacing: "0.28em" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="cms-btn cms-btn--primary w-full"
              >
                {loading ? "Checking…" : "Verify & enter CMS"}
              </button>
              <button
                type="button"
                className="cms-btn cms-btn--ghost w-full"
                onClick={() => setStep("email")}
              >
                Back
              </button>
            </form>
          )}

          {status ? <p className="cms-login__status">{status}</p> : null}
        </div>
      </section>
    </div>
  );
}
