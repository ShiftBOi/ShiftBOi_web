"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "otp" | "passkey";
type Step = "email" | "code";

const ADMIN_HINT = "rapeepongapic@gmail.com";

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
  const [pending, startTransition] = useTransition();

  const canSubmitOtpEmail = useMemo(
    () => email.trim().length > 3 && !pending,
    [email, pending],
  );

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });

      if (sendError) {
        setError(sendError.message || "Could not send OTP.");
        return;
      }

      setInfo("OTP sent. Check your email (or the server console in development).");
      setStep("code");
    });
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired OTP.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  async function signInWithPasskey() {
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const { error: passkeyError } = await authClient.signIn.passkey();

      if (passkeyError) {
        setError(passkeyError.message || "Passkey sign-in failed.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-md border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-6 md:p-8">
      <div className="flex gap-2 border-b border-[var(--color-border-subtle)] pb-4">
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

      <p className="mt-5 text-[length:var(--font-size-md)] leading-relaxed text-[var(--color-text-inverse)]">
        Password login is disabled. Only the allowlisted admin email can access
        the CMS.
      </p>

      {mode === "otp" && step === "email" ? (
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
            className="min-h-11 w-full bg-white text-[length:var(--font-size-lg)] text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : null}

      {mode === "otp" && step === "code" ? (
        <form onSubmit={verifyOtp} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
              6-digit code
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="min-h-11 w-full border border-[var(--color-border-default)] bg-black px-3 tracking-[0.3em] text-[length:var(--font-size-2xl)] text-white"
            />
          </label>
          <button
            type="submit"
            disabled={pending || otp.trim().length !== 6}
            className="min-h-11 w-full bg-white text-[length:var(--font-size-lg)] text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            className="w-full text-[length:var(--font-size-md)] text-[var(--color-text-inverse)]"
            onClick={() => {
              setStep("email");
              setOtp("");
            }}
          >
            Use a different email
          </button>
        </form>
      ) : null}

      {mode === "passkey" ? (
        <div className="mt-6 space-y-4">
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
            disabled={pending}
            className="min-h-11 w-full bg-white text-[length:var(--font-size-lg)] text-black disabled:opacity-40"
          >
            {pending ? "Waiting for passkey…" : "Sign in with passkey"}
          </button>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-tertiary)]">
            Register a passkey from the CMS settings after your first OTP login.
          </p>
        </div>
      ) : null}

      {info ? (
        <p className="mt-4 text-[length:var(--font-size-md)] text-[var(--color-text-primary)]" role="status">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-[length:var(--font-size-md)] text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
