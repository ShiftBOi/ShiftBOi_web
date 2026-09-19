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
    <div>
      <h2 className="cms-panel-title">Device passkeys</h2>
      <p className="cms-panel-lead">
        After OTP login, register a passkey for passwordless return visits. No
        password accounts are created.
      </p>
      <div className="cms-actions">
        <button
          type="button"
          onClick={registerPasskey}
          disabled={pending}
          className="cms-btn cms-btn-primary"
        >
          {pending ? "Waiting for authenticator…" : "Register passkey"}
        </button>
      </div>
      {message ? (
        <p className="cms-panel-lead" role="status" style={{ marginTop: "0.85rem" }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="cms-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
