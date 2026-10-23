"use client";

import { useEffect, useRef, useState } from "react";
import type { ContactContent } from "@/lib/content";

type Field = keyof ContactContent;

type Props = {
  contact: ContactContent;
  onSave: (partial: Partial<ContactContent>) => Promise<void>;
};

function Spot({
  field,
  editing,
  label,
  className = "",
  block = false,
  children,
  onEdit,
}: {
  field: Field;
  editing: Field | null;
  label: string;
  className?: string;
  block?: boolean;
  children: React.ReactNode;
  onEdit: (field: Field) => void;
}) {
  const isEditing = editing === field;
  return (
    <span
      className={`cms-editable${block ? " cms-editable-block" : ""}${isEditing ? " is-editing" : ""}${className ? ` ${className}` : ""}`}
      data-field={field}
      onClick={(e) => {
        if (isEditing) return;
        e.stopPropagation();
        onEdit(field);
      }}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEdit(field);
        }
      }}
      role={isEditing ? undefined : "button"}
      tabIndex={isEditing ? undefined : 0}
    >
      {!isEditing ? <span className="cms-editable-hint">{label}</span> : null}
      {children}
    </span>
  );
}

function SpotInput({
  value,
  multiline = false,
  rows = 3,
  className = "",
  onChange,
  onDone,
}: {
  value: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  onChange: (v: string) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  if (multiline) {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        className={`cms-preview-input is-multi ${className}`}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onDone}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDone();
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onDone();
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      className={`cms-preview-input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          onDone();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function LineIcon({ kind }: { kind: "mail" | "social" | "github" | "pin" }) {
  if (kind === "mail") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 7.5 12 13l8.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "github") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.8a9.6 9.6 0 0 1 2.5.34c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    );
  }
  if (kind === "pin") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s6-5.2 6-10.2A6 6 0 0 0 6 10.8C6 15.8 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 12h15M12 4.5c2.4 2.6 2.4 12.4 0 15M12 4.5c-2.4 2.6-2.4 12.4 0 15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Visual Get-in-touch card — click any text to edit in place (same language as project live preview).
 */
export function CmsTouchCardEditor({ contact, onSave }: Props) {
  const [draft, setDraft] = useState(contact);
  const [editing, setEditing] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseline = useRef(contact);

  useEffect(() => {
    setDraft(contact);
    baseline.current = contact;
  }, [contact]);

  function patchLocal<K extends Field>(key: K, value: ContactContent[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function commit() {
    if (!editing) return;
    const key = editing;
    const nextVal = draft[key] ?? "";
    const prevVal = baseline.current[key] ?? "";
    setEditing(null);
    if (String(nextVal) === String(prevVal)) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ [key]: nextVal } as Partial<ContactContent>);
      baseline.current = { ...baseline.current, [key]: nextVal };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setDraft((d) => ({ ...d, [key]: prevVal }));
    } finally {
      setSaving(false);
    }
  }

  function renderText(field: Field, className: string, opts?: { multiline?: boolean; rows?: number; fallback?: string }) {
    const value = String(draft[field] ?? "");
    if (editing === field) {
      return (
        <SpotInput
          value={value}
          multiline={opts?.multiline}
          rows={opts?.rows}
          className={className}
          onChange={(v) => patchLocal(field, v as ContactContent[typeof field])}
          onDone={() => void commit()}
        />
      );
    }
    return <span className={className}>{value || opts?.fallback || "—"}</span>;
  }

  return (
    <div className="cms-touch-editor">
      <p className="cms-touch-editor__hint">
        Click any text on the card to edit — blur or Enter to save
        {saving ? " · saving…" : ""}
      </p>
      {error ? (
        <p className="cms-touch-editor__error" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="cms-touch-editor__stage"
        onClick={() => {
          if (editing) void commit();
        }}
      >
        <div className="cms-touch-editor__card sb-touch">
          <div className="sb-touch__visual cms-touch-editor__visual" aria-hidden>
            <div className="cms-touch-editor__visual-mark">ASCII</div>
          </div>

          <div className="sb-touch__grid">
            <aside className="sb-touch__intro">
              <Spot
                field="title"
                editing={editing}
                label="Title"
                onEdit={setEditing}
                block
              >
                {editing === "title" ? (
                  <SpotInput
                    value={draft.title}
                    className="sb-touch__title cms-touch-editor__input-title"
                    onChange={(v) => patchLocal("title", v)}
                    onDone={() => void commit()}
                  />
                ) : (
                  <h2 className="sb-touch__title">{draft.title || "Get in touch"}</h2>
                )}
              </Spot>

              <Spot
                field="body"
                editing={editing}
                label="Body"
                onEdit={setEditing}
                block
              >
                {renderText("body", "sb-touch__body", {
                  multiline: true,
                  rows: 3,
                  fallback: "Body copy…",
                })}
              </Spot>
            </aside>

            <ul className="sb-touch__links">
              <li className="sb-touch__line">
                <span className="sb-touch__line-left">
                  <LineIcon kind="mail" />
                  Gmail
                </span>
                <Spot field="email" editing={editing} label="Inbox" onEdit={setEditing}>
                  {renderText("email", "sb-touch__line-value", {
                    fallback: "email@…",
                  })}
                </Spot>
              </li>
              <li className="sb-touch__line">
                <span className="sb-touch__line-left">
                  <LineIcon kind="social" />
                  Social
                </span>
                <Spot
                  field="linkedin"
                  editing={editing}
                  label="Label"
                  onEdit={setEditing}
                >
                  {renderText("linkedin", "sb-touch__line-value", {
                    fallback: "Handle",
                  })}
                </Spot>
              </li>
              <li className="sb-touch__line">
                <span className="sb-touch__line-left">
                  <LineIcon kind="github" />
                  GitHub
                </span>
                <Spot field="github" editing={editing} label="Label" onEdit={setEditing}>
                  {renderText("github", "sb-touch__line-value", {
                    fallback: "@you",
                  })}
                </Spot>
              </li>
              <li className="sb-touch__line">
                <span className="sb-touch__line-left">
                  <LineIcon kind="pin" />
                  Place
                </span>
                <Spot field="place" editing={editing} label="Place" onEdit={setEditing}>
                  {renderText("place", "sb-touch__line-value", {
                    fallback: "City",
                  })}
                </Spot>
              </li>
            </ul>

            <div className="sb-touch__form cms-touch-editor__form-ghost" aria-hidden>
              <div className="sb-touch__fields">
                <div className="sb-touch__field">
                  <span className="sb-touch__label">Name</span>
                  <span className="cms-touch-editor__ghost-input" />
                </div>
                <div className="sb-touch__field">
                  <span className="sb-touch__label">Email</span>
                  <span className="cms-touch-editor__ghost-input" />
                </div>
                <div className="sb-touch__field sb-touch__field--full">
                  <span className="sb-touch__label">Note</span>
                  <span className="cms-touch-editor__ghost-input is-tall" />
                </div>
              </div>
              <div className="sb-touch__send">
                <Spot field="ctaLabel" editing={editing} label="CTA" onEdit={setEditing}>
                  {editing === "ctaLabel" ? (
                    <SpotInput
                      value={draft.ctaLabel}
                      className="cms-touch-editor__cta-input"
                      onChange={(v) => patchLocal("ctaLabel", v)}
                      onDone={() => void commit()}
                    />
                  ) : (
                    <span className="sb-touch__send-btn">
                      {draft.ctaLabel || "Send"}
                      <span className="sb-touch__send-orb" aria-hidden>
                        →
                      </span>
                    </span>
                  )}
                </Spot>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cms-touch-editor__meta">
        <p className="cms-touch-editor__meta-kicker">Also used by this card</p>
        <div className="cms-touch-editor__meta-grid">
          {(
            [
              ["eyebrow", "Eyebrow", false],
              ["helper", "Helper", true],
              ["successMessage", "Success message", true],
              ["githubUrl", "GitHub URL", false],
              ["linkedinUrl", "Social URL", false],
            ] as const
          ).map(([field, label, multi]) => (
            <div key={field} className="cms-touch-editor__meta-row">
              <span className="cms-touch-editor__meta-label">{label}</span>
              <Spot
                field={field}
                editing={editing}
                label={label}
                onEdit={setEditing}
                block
              >
                {editing === field ? (
                  <SpotInput
                    value={String(draft[field] ?? "")}
                    multiline={multi}
                    rows={2}
                    onChange={(v) =>
                      patchLocal(field, v as ContactContent[typeof field])
                    }
                    onDone={() => void commit()}
                  />
                ) : (
                  <span className="cms-touch-editor__meta-value">
                    {String(draft[field] ?? "") || "—"}
                  </span>
                )}
              </Spot>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
