"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { OtpDigitInput, OTP_LENGTH } from "@/components/cms/otp-digit-input";

type Mode = "otp" | "passkey";
type Step = "ready" | "code";

/** Locked admin inbox — never collected from the login UI. */
const ADMIN_EMAIL = "rapeepongapic@gmail.com";
const RESEND_SECONDS = 45;

function formatCountdown(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CmsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/cms";

  const [mode, setMode] = useState<Mode>("otp");
  const [step, setStep] = useState<Step>("ready");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const verifyLock = useRef(false);
  const lastAutoVerified = useRef("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((n) => Math.max(0, n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const deliverOtp = useCallback(async () => {
    // Server ignores any client email and always uses the locked admin address.
    const res = await fetch("/api/cms/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }, []);

  async function requestOtp(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setInfo(null);
    setDevOtp(null);
    setOtp("");
    lastAutoVerified.current = "";

    setStep("code");
    setSending(true);
    setInfo("Sending code…");

    const { ok, data } = await deliverOtp();
    setSending(false);

    if (!ok) {
      setError(data.error || "Could not send OTP.");
      setInfo(null);
      setStep("ready");
      return;
    }

    setResendIn(RESEND_SECONDS);

    if (typeof data.devOtp === "string" && /^\d{6}$/.test(data.devOtp)) {
      setDevOtp(data.devOtp);
      setInfo(`Dev mode — code ready: ${data.devOtp}`);
    } else {
      setInfo(
        data.delivery === "email"
          ? "Code sent to the admin inbox. Check email & spam."
          : "SMTP off — check the server terminal for the code.",
      );
    }
  }

  async function resendOtp() {
    if (sending || resendIn > 0) return;
    setError(null);
    setSending(true);
    setInfo("Sending code…");
    setOtp("");
    lastAutoVerified.current = "";

    const { ok, data } = await deliverOtp();
    setSending(false);

    if (!ok) {
      setError(data.error || "Could not resend OTP.");
      setInfo(null);
      return;
    }

    setResendIn(RESEND_SECONDS);

    if (typeof data.devOtp === "string" && /^\d{6}$/.test(data.devOtp)) {
      setDevOtp(data.devOtp);
      setInfo(`Dev mode — new code: ${data.devOtp}`);
    } else {
      setInfo(
        data.delivery === "email"
          ? "New code sent to the admin inbox."
          : "New code logged in the server terminal.",
      );
    }
  }

  const verifyOtp = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (trimmed.length !== OTP_LENGTH || verifyLock.current) return;

      verifyLock.current = true;
      setVerifying(true);
      setError(null);

      const { error: verifyError } = await authClient.signIn.emailOtp({
        email: ADMIN_EMAIL,
        otp: trimmed,
      });

      if (verifyError) {
        const msg = verifyError.message || "Invalid or expired OTP.";
        const looksLikeOrigin =
          /origin|forbidden|403/i.test(msg) ||
          msg.toLowerCase().includes("invalid origin");
        setError(
          looksLikeOrigin
            ? "Login blocked by auth origin mismatch. Use the same host/port as BETTER_AUTH_URL (or restart after the trustedOrigins fix)."
            : msg,
        );
        setVerifying(false);
        verifyLock.current = false;
        lastAutoVerified.current = "";
        setOtp("");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    },
    [nextPath, router],
  );

  function onOtpChange(next: string) {
    setOtp(next);
    setError(null);
    if (
      next.length === OTP_LENGTH &&
      !sending &&
      !verifying &&
      lastAutoVerified.current !== next
    ) {
      lastAutoVerified.current = next;
      void verifyOtp(next);
    }
  }

  async function onVerifySubmit(event: FormEvent) {
    event.preventDefault();
    await verifyOtp(otp);
  }

  async function signInWithPasskey() {
    setError(null);
    setInfo(null);
    setPasskeyPending(true);

    const { error: passkeyError } = await authClient.signIn.passkey();
    setPasskeyPending(false);

    if (passkeyError) {
      setError(passkeyError.message || "Passkey sign-in failed.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="cms-login-form">
      {!(mode === "otp" && step === "code") ? (
        <>
          <p className="cms-login-kicker">ShiftBOi CMS</p>
          <h1 className="cms-login-title">Sign in</h1>
          <div className="cms-login-tabs" role="tablist" aria-label="Sign-in method">
            {(
              [
                ["otp", "Email OTP"],
                ["passkey", "Passkey"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                onClick={() => {
                  setMode(id);
                  setError(null);
                  setInfo(null);
                  if (id === "otp") setStep("ready");
                }}
                className={`cms-login-tab${mode === id ? " is-active" : ""}`}
                aria-pressed={mode === id}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {mode === "otp" && step === "ready" ? (
        <>
          <p className="cms-login-copy">
            Access is locked to the admin account. Send a one-time code to the
            configured inbox — no email typing needed.
          </p>
          <form onSubmit={requestOtp} className="cms-login-stack">
            <button type="submit" disabled={sending} className="cms-login-btn">
              {sending ? "Sending…" : "Send login code"}
            </button>
          </form>
        </>
      ) : null}

      {mode === "otp" && step === "code" ? (
        <form onSubmit={onVerifySubmit} className="cms-login-stack">
          <div>
            <p className="cms-login-kicker">Verification</p>
            <h2 className="cms-login-title">Check your email</h2>
            <p className="cms-login-copy">
              Enter the {OTP_LENGTH}-digit code sent to the admin inbox.
            </p>
          </div>

          {devOtp ? (
            <p className="cms-login-dev" role="status">
              DEV {devOtp}
            </p>
          ) : null}

          <div className={sending ? "cms-login-otp is-busy" : "cms-login-otp"}>
            <OtpDigitInput
              value={otp}
              onChange={onOtpChange}
              disabled={sending || verifying}
              autoFocus={!sending}
            />
          </div>

          <button
            type="submit"
            disabled={sending || verifying || otp.trim().length !== OTP_LENGTH}
            className="cms-login-btn"
          >
            {verifying ? "Signing in…" : sending ? "Sending…" : "Confirm"}
          </button>

          <div className="cms-login-foot">
            <p className="cms-login-muted">
              {sending ? (
                "Sending now…"
              ) : resendIn > 0 ? (
                <>
                  Didn&apos;t get the email? Resend in{" "}
                  <span className="cms-login-count">{formatCountdown(resendIn)}</span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void resendOtp()}
                  className="cms-login-link"
                >
                  Didn&apos;t get the email? Resend
                </button>
              )}
            </p>
            <button
              type="button"
              className="cms-login-link"
              onClick={() => {
                setStep("ready");
                setOtp("");
                setError(null);
                setInfo(null);
                setDevOtp(null);
                lastAutoVerified.current = "";
              }}
            >
              ← back
            </button>
          </div>
        </form>
      ) : null}

      {mode === "passkey" ? (
        <div className="cms-login-stack">
          <p className="cms-login-copy">
            Use a registered device passkey. Only the admin account can access
            the CMS.
          </p>
          <button
            type="button"
            onClick={signInWithPasskey}
            disabled={passkeyPending}
            className="cms-login-btn cms-login-btn-alt"
          >
            {passkeyPending ? "Waiting for passkey…" : "Sign in with passkey"}
          </button>
          <p className="cms-login-muted">
            Register a passkey from CMS settings after your first OTP login.
          </p>
        </div>
      ) : null}

      {info && ((mode === "otp" && step === "ready") || mode === "passkey") ? (
        <p className="cms-login-info" role="status">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="cms-login-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
