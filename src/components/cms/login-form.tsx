"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { OtpDigitInput, OTP_LENGTH } from "@/components/cms/otp-digit-input";

type Mode = "otp" | "passkey";
type Step = "email" | "code";

const ADMIN_HINT = "rapeepongapic@gmail.com";
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
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(ADMIN_HINT);
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

  const canSubmitOtpEmail = useMemo(
    () => email.trim().length > 3 && !sending,
    [email, sending],
  );

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((n) => Math.max(0, n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const deliverOtp = useCallback(async (targetEmail: string) => {
    const res = await fetch("/api/cms/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }, []);

  async function requestOtp(event?: FormEvent) {
    event?.preventDefault();
    const normalized = email.trim().toLowerCase();
    setError(null);
    setInfo(null);
    setDevOtp(null);
    setOtp("");
    lastAutoVerified.current = "";

    // Optimistic: jump to code UI immediately so send feels instant
    setStep("code");
    setSending(true);
    setInfo("Sending code…");

    const { ok, data } = await deliverOtp(normalized);
    setSending(false);

    if (!ok) {
      setError(data.error || "Could not send OTP.");
      setInfo(null);
      setStep("email");
      return;
    }

    setResendIn(RESEND_SECONDS);

    if (typeof data.devOtp === "string" && /^\d{6}$/.test(data.devOtp)) {
      setDevOtp(data.devOtp);
      setInfo(`Dev mode — code ready: ${data.devOtp}`);
    } else {
      setInfo(
        data.delivery === "email"
          ? "Code sent. Check inbox & spam."
          : "SMTP off — check the server terminal for the code.",
      );
    }
  }

  async function resendOtp() {
    if (sending || resendIn > 0) return;
    const normalized = email.trim().toLowerCase();
    setError(null);
    setSending(true);
    setInfo("Sending code…");
    setOtp("");
    lastAutoVerified.current = "";

    const { ok, data } = await deliverOtp(normalized);
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
          ? "New code sent."
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
        email: email.trim().toLowerCase(),
        otp: trimmed,
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired OTP.");
        setVerifying(false);
        verifyLock.current = false;
        lastAutoVerified.current = "";
        setOtp("");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    },
    [email, nextPath, router],
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
    <div className="mx-auto w-full max-w-md border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-6 md:p-8">
      {!(mode === "otp" && step === "code") ? (
        <>
          <h1 className="text-[length:var(--font-size-4xl)] tracking-tight text-white">
            CMS sign in
          </h1>
          <div className="mt-5 flex gap-2 border-b border-[var(--color-border-subtle)] pb-4">
            {(
              [
                ["otp", "Email OTP"],
                ["passkey", "Passkey"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError(null);
                  setInfo(null);
                  if (id === "otp") setStep("email");
                }}
                className={`min-h-10 flex-1 px-3 text-[length:var(--font-size-md)] transition-colors duration-[var(--motion-fast)] ${
                  mode === id
                    ? "bg-white text-black"
                    : "text-[var(--color-text-inverse)] hover:text-white"
                }`}
                aria-pressed={mode === id}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {mode === "otp" && step === "email" ? (
        <>
          <p className="mt-5 text-[length:var(--font-size-md)] leading-relaxed text-[var(--color-text-inverse)]">
            Password login is disabled. Only the allowlisted admin email can
            access the CMS.
          </p>
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
                Email
              </span>
              <input
                type="email"
                autoComplete="username webauthn"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full border border-[var(--color-border-default)] bg-black px-3 text-[length:var(--font-size-lg)] text-white"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmitOtpEmail}
              className="min-h-11 w-full bg-[var(--color-violet)] text-[length:var(--font-size-lg)] text-white transition-opacity duration-[var(--motion-fast)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "Sending…" : "Send code"}
            </button>
          </form>
        </>
      ) : null}

      {mode === "otp" && step === "code" ? (
        <form onSubmit={onVerifySubmit} className="space-y-6">
          <div>
            <p className="text-[length:var(--font-size-sm)] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
              Verification
            </p>
            <h2 className="mt-2 text-[length:var(--font-size-4xl)] tracking-tight text-white">
              Check your email
            </h2>
            <p className="mt-3 text-[length:var(--font-size-lg)] leading-relaxed text-[var(--color-text-secondary)]">
              Enter the {OTP_LENGTH}-digit code we sent to{" "}
              <span className="font-medium text-white">{email.trim()}</span>
            </p>
          </div>

          {devOtp ? (
            <p
              className="border border-[var(--color-accent-purple)]/40 bg-black px-3 py-2 font-[Pix32,ui-monospace,monospace] text-[length:var(--font-size-md)] tracking-[0.2em] text-[var(--color-text-primary)]"
              role="status"
            >
              DEV {devOtp}
            </p>
          ) : null}

          <div className={sending ? "pointer-events-none opacity-60" : undefined}>
            <OtpDigitInput
              value={otp}
              onChange={onOtpChange}
              disabled={sending || verifying}
              autoFocus={!sending}
            />
          </div>

          <button
            type="submit"
            disabled={
              sending || verifying || otp.trim().length !== OTP_LENGTH
            }
            className="min-h-12 w-full bg-[var(--color-violet)] text-[length:var(--font-size-xl)] text-white transition-opacity duration-[var(--motion-fast)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {verifying ? "Signing in…" : sending ? "Sending…" : "Confirm"}
          </button>

          <div className="space-y-3 text-center">
            <p className="text-[length:var(--font-size-md)] text-[var(--color-text-tertiary)]">
              {sending ? (
                "Sending now…"
              ) : resendIn > 0 ? (
                <>
                  Didn&apos;t get the email? Resend in{" "}
                  <span className="tabular-nums text-[var(--color-text-secondary)]">
                    {formatCountdown(resendIn)}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void resendOtp()}
                  className="text-[var(--color-violet-bright)] hover:text-white"
                >
                  Didn&apos;t get the email? Resend
                </button>
              )}
            </p>
            <button
              type="button"
              className="text-[length:var(--font-size-md)] text-[var(--color-text-inverse)] hover:text-white"
              onClick={() => {
                setStep("email");
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
        <div className="mt-6 space-y-4">
          <p className="text-[length:var(--font-size-md)] leading-relaxed text-[var(--color-text-inverse)]">
            Password login is disabled. Only the allowlisted admin email can
            access the CMS.
          </p>
          <label className="block">
            <span className="mb-2 block text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
              Email (optional hint)
            </span>
            <input
              type="email"
              autoComplete="username webauthn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 w-full border border-[var(--color-border-default)] bg-black px-3 text-[length:var(--font-size-lg)] text-white"
            />
          </label>
          <button
            type="button"
            onClick={signInWithPasskey}
            disabled={passkeyPending}
            className="min-h-11 w-full bg-white text-[length:var(--font-size-lg)] text-black disabled:opacity-40"
          >
            {passkeyPending ? "Waiting for passkey…" : "Sign in with passkey"}
          </button>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
            Register a passkey from the CMS settings after your first OTP login.
          </p>
        </div>
      ) : null}

      {info && mode === "otp" && step === "email" ? (
        <p
          className="mt-4 text-[length:var(--font-size-md)] text-[var(--color-text-primary)]"
          role="status"
        >
          {info}
        </p>
      ) : null}
      {info && mode === "passkey" ? (
        <p
          className="mt-4 text-[length:var(--font-size-md)] text-[var(--color-text-primary)]"
          role="status"
        >
          {info}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 text-[length:var(--font-size-md)] text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
