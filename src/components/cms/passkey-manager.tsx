"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function PasskeyManager() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function registerPasskey() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const { error: registerError } = await authClient.passkey.addPasskey({
        name: "WebPort admin device",
      });

      if (registerError) {
        setError(registerError.message || "Could not register passkey.");
        return;
      }

      setMessage("Passkey registered. You can use it on the CMS login screen.");
    });
  }

  return (
    <div className="max-w-lg border border-[var(--color-border-default)] p-6">
      <h2 className="text-[length:var(--font-size-3xl)] tracking-tight">Passkeys</h2>
      <p className="mt-3 text-[length:var(--font-size-lg)] leading-relaxed text-[var(--color-text-inverse)]">
        After OTP login, register a passkey for passwordless return visits. No
        password accounts are created.
      </p>
      <button
        type="button"
        onClick={registerPasskey}
        disabled={pending}
        className="mt-6 min-h-11 bg-white px-5 text-[length:var(--font-size-lg)] text-black disabled:opacity-40"
      >
        {pending ? "Waiting for authenticator…" : "Register passkey"}
      </button>
      {message ? (
        <p className="mt-4 text-[length:var(--font-size-md)]" role="status">
          {message}
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
