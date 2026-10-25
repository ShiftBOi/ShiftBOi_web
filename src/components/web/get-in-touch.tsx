"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import type { ContactContent } from "@/lib/content";
import {
  preloadSentSuccess,
  SentSuccess,
} from "@/components/web/sent-success";
import { TouchAscii } from "@/components/web/touch-ascii";

const SUBJECTS = [
  { group: "Work", items: ["Hire me", "Project work", "Product build", "Collaboration"] },
  { group: "Ask", items: ["A question", "Something else"] },
] as const;

type Props = {
  contact: ContactContent;
};

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 7.5 12 13l8.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 4.5h3l1.2 3.2-1.8 1.2a11 11 0 0 0 4.2 4.2l1.2-1.8 3.2 1.2v3a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 4.5 7.1 1.5 1.5 0 0 1 6 5.5h2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function IconPen({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 5.5 18.5 9.5M5 19l1.2-4.4L15.8 4.9a1.6 1.6 0 0 1 2.3 0l1 1a1.6 1.6 0 0 1 0 2.3L9.4 17.8 5 19Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.8a9.6 9.6 0 0 1 2.5.34c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function IconSocial({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 12h15M12 4.5c2.4 2.6 2.4 12.4 0 15M12 4.5c-2.4 2.6-2.4 12.4 0 15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FieldLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: string;
}) {
  return (
    <span className="sb-touch__label">
      {icon}
      {children}
    </span>
  );
}

function ContactLine({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="sb-touch__line-left">
        {icon}
        <span>{label}</span>
      </span>
      <span className="sb-touch__line-value">{value}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          className="sb-touch__line"
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {inner}
        </a>
      </li>
    );
  }

  return (
    <li>
      <div className="sb-touch__line">{inner}</div>
    </li>
  );
}

export function GetInTouchCard({ contact }: Props) {
  const listId = useId();
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  useEffect(() => {
    void preloadSentSuccess();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const note = String(data.get("message") ?? "").trim();
    const message = [
      subject ? `Subject: ${subject}` : "",
      phone ? `Number: ${phone}` : "",
      note,
    ]
      .filter(Boolean)
      .join("\n");

    setStatus("saving");
    setError(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email,
          message,
          source: "get-in-touch",
          website: data.get("website"),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not send");
      setSentEmail(email);
      setStatus("done");
      setSubject("");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send");
    }
  }

  const mailto = `mailto:${contact.email}`;

  return (
    <section id="get-in-touch" className="hydra-section sb-touch-section">
      <div className="sb-touch-shell">
        <div className="sb-touch">
          <div className="sb-touch__visual">
            <TouchAscii
              className="sb-touch__ascii"
              width="100%"
              height="100%"
              interactive
              animation="beam-sweep"
              mouseMode="push"
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  process.env.NEXT_PUBLIC_R2_PUBLIC_URL
                    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "")}/brand/touch-ascii.png`
                    : "/brand/touch-ascii.png"
                }
                alt=""
                className="sb-touch__ascii-fallback"
              />
            </noscript>
          </div>

          <div className="sb-touch__grid">
            <aside className="sb-touch__intro">
              <h2 className="sb-touch__title">
                {contact.title || "Get in touch"}
              </h2>
              <p className="sb-touch__body">{contact.body}</p>
            </aside>

            <ul className="sb-touch__links">
              <ContactLine
                icon={<IconMail />}
                label="Gmail"
                value={contact.email}
                href={mailto}
              />
              {contact.linkedin ? (
                <ContactLine
                  icon={<IconSocial />}
                  label="Social"
                  value={contact.linkedin}
                  href={contact.linkedinUrl || undefined}
                />
              ) : null}
              {contact.github ? (
                <ContactLine
                  icon={<IconGithub />}
                  label="GitHub"
                  value={contact.github}
                  href={contact.githubUrl || undefined}
                />
              ) : null}
              {contact.place ? (
                <ContactLine
                  icon={<IconPin />}
                  label="Place"
                  value={contact.place}
                />
              ) : null}
            </ul>

            {status === "done" ? (
              <SentSuccess
                email={sentEmail || contact.email}
                title="Message sent"
                body="Thanks for getting in touch. I'll reply soon to"
                note="Check your inbox for a confirmation"
                onAgain={() => {
                  setStatus("idle");
                  setSentEmail("");
                }}
              />
            ) : (
              <form onSubmit={onSubmit} className="sb-touch__form">
                {/* Honeypot — leave empty; bots often fill hidden fields */}
                <label className="sb-touch__hp" aria-hidden="true">
                  <span>Website</span>
                  <input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
                <div className="sb-touch__fields">
                  <label className="sb-touch__field">
                    <FieldLabel icon={<IconUser />}>Name</FieldLabel>
                    <input name="name" required autoComplete="name" />
                  </label>
                  <label className="sb-touch__field">
                    <FieldLabel icon={<IconMail />}>Email</FieldLabel>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </label>
                  <label className="sb-touch__field sb-touch__field--full">
                    <FieldLabel icon={<IconPhone />}>Number</FieldLabel>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Optional"
                    />
                  </label>
                  <div className="sb-touch__field sb-touch__field--full sb-touch__subject">
                    <FieldLabel icon={<IconList />}>Subject</FieldLabel>
                    <button
                      type="button"
                      className="sb-touch__select"
                      aria-haspopup="listbox"
                      aria-expanded={subjectOpen}
                      aria-controls={listId}
                      onClick={() => setSubjectOpen((v) => !v)}
                    >
                      <span className={subject ? "is-set" : ""}>
                        {subject || "Choose a subject"}
                      </span>
                      <span aria-hidden>▾</span>
                    </button>
                    <input
                      type="text"
                      name="subject"
                      value={subject}
                      required
                      readOnly
                      className="sr-only"
                      tabIndex={-1}
                    />
                    {subjectOpen ? (
                      <div id={listId} className="sb-touch__menu" role="listbox">
                        {SUBJECTS.map((group) => (
                          <div key={group.group}>
                            <p className="sb-touch__menu-group">{group.group}</p>
                            <ul>
                              {group.items.map((item) => (
                                <li key={item}>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={subject === item}
                                    onClick={() => {
                                      setSubject(item);
                                      setSubjectOpen(false);
                                    }}
                                  >
                                    {item}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <label className="sb-touch__field sb-touch__field--full sb-touch__note">
                    <FieldLabel icon={<IconPen />}>Note</FieldLabel>
                    <textarea name="message" required rows={4} />
                  </label>
                </div>

                {status === "error" && error ? (
                  <p className="sb-touch__error" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="sb-touch__send">
                  <button
                    type="submit"
                    className="sb-touch__send-btn"
                    disabled={status === "saving"}
                  >
                    {status === "saving" ? "Sending" : contact.ctaLabel || "Send"}
                    <span className="sb-touch__send-orb" aria-hidden>
                      →
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
