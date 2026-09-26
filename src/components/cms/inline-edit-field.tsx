"use client";

import { useEffect, useRef, useState } from "react";

type InlineEditFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  disabled?: boolean;
  onSave: (next: string) => Promise<void> | void;
};

export function InlineEditField({
  label,
  value,
  multiline = false,
  disabled = false,
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function confirm() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setError(null);
    setEditing(false);
  }

  return (
    <div className={`cms-inline-field${editing ? " is-editing" : ""}`}>
      <div className="cms-inline-field-head">
        <span className="cms-inline-label">{label}</span>
        {!editing ? (
          <button
            type="button"
            className="cms-pen-btn"
            disabled={disabled}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M12.5 7 17 11.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        ) : null}
      </div>

      {!editing ? (
        <p className={`cms-inline-value${multiline ? " is-multi" : ""}`}>
          {value || <span className="cms-inline-empty">Empty</span>}
        </p>
      ) : (
        <>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className="cms-inline-input"
              rows={4}
              value={draft}
              disabled={saving}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="cms-inline-input"
              value={draft}
              disabled={saving}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void confirm();
                if (e.key === "Escape") cancel();
              }}
            />
          )}
          <div className="cms-inline-actions">
            <button
              type="button"
              className="cms-btn cms-btn-ghost"
              disabled={saving}
              onClick={cancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              disabled={saving}
              onClick={() => void confirm()}
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
          {error ? <p className="cms-login-error">{error}</p> : null}
        </>
      )}
    </div>
  );
}
