"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useCmsNotify } from "@/components/cms/cms-notify";

type InquiryRow = {
  id: string;
  email: string;
  name: string | null;
  message: string | null;
  source: string;
  read: boolean;
  createdAt: string;
  replies?: ReplyRow[];
};

type ReplyRow = {
  id: string;
  inquiryId: string | null;
  to: string;
  subject: string;
  body: string;
  kind: string;
  createdAt: string;
};

type DraftRow = {
  id: string;
  to: string;
  subject: string;
  body: string;
  updatedAt: string;
};

type Folder = "inbox" | "sent" | "drafts";

const DRAFTS_KEY = "webport-cms-inquiry-drafts";

function loadDrafts(): DraftRow[] {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DraftRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDrafts(rows: DraftRow[]) {
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(rows));
}

export function InquiriesList({
  initial,
  initialUnread,
}: {
  initial: InquiryRow[];
  initialUnread: number;
}) {
  const notify = useCmsNotify();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [rows, setRows] = useState(initial);
  const [sent, setSent] = useState<ReplyRow[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);

  const active = useMemo(
    () => rows.find((r) => r.id === activeId) ?? null,
    [rows, activeId],
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cms/inquiries");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.inquiries ?? []);
    setUnread(data.unread ?? 0);
    setSent(data.sent ?? []);
  }, []);

  useEffect(() => {
    setDrafts(loadDrafts());
    void refresh();
  }, [refresh]);

  function markRead(id: string, read: boolean) {
    startTransition(async () => {
      await fetch("/api/cms/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read } : r)));
      setUnread((n) => Math.max(0, n + (read ? -1 : 1)));
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const ok = await notify.confirm({
        title: "Delete this inquiry?",
        danger: true,
        confirmLabel: "Delete",
      });
      if (!ok) return;
      await fetch("/api/cms/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delete: true }),
      });
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
      void refresh();
    });
  }

  function beginReply(row: InquiryRow, forward = false) {
    setFolder("inbox");
    setActiveId(row.id);
    setDraftId(null);
    setComposeTo(forward ? "" : row.email);
    setComposeSubject(
      `${forward ? "Fwd" : "Re"}: ${row.name || row.email} — ShiftBOi inquiry`,
    );
    const quoted = row.message
      ? `\n\n---\nOn ${new Date(row.createdAt).toLocaleString()}, ${row.name || row.email} wrote:\n${row.message}`
      : "";
    setComposeBody(forward ? quoted.trimStart() : quoted);
  }

  function openDraft(draft: DraftRow) {
    setFolder("drafts");
    setDraftId(draft.id);
    setComposeTo(draft.to);
    setComposeSubject(draft.subject);
    setComposeBody(draft.body);
  }

  function persistDraft() {
    const next: DraftRow = {
      id: draftId || `draft_${Date.now().toString(36)}`,
      to: composeTo,
      subject: composeSubject,
      body: composeBody,
      updatedAt: new Date().toISOString(),
    };
    const list = [next, ...drafts.filter((d) => d.id !== next.id)];
    setDrafts(list);
    saveDrafts(list);
    setDraftId(next.id);
    notify.success("Draft saved");
  }

  function sendMail(kind: "reply" | "forward" | "compose") {
    startTransition(async () => {
      if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
        notify.error("To, subject, and body are required");
        return;
      }
      const res = await fetch("/api/cms/inquiries/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: active?.id,
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody.trim(),
          kind,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        notify.error("Send failed", json?.error || "Unknown error");
        return;
      }
      if (draftId) {
        const list = drafts.filter((d) => d.id !== draftId);
        setDrafts(list);
        saveDrafts(list);
        setDraftId(null);
      }
      setComposeBody("");
      notify.success(
        json?.smtp?.sent
          ? "Message sent"
          : "Saved to Sent (SMTP preview in server logs)",
      );
      setFolder("sent");
      await refresh();
    });
  }

  const listItems =
    folder === "inbox"
      ? rows.map((row) => ({
          id: row.id,
          title: row.name || row.email,
          snip: row.message || row.email,
          unread: !row.read,
          onOpen: () => {
            setActiveId(row.id);
            if (!row.read) markRead(row.id, true);
            setComposeTo(row.email);
            setComposeSubject(`Re: ${row.name || row.email} — ShiftBOi inquiry`);
            setComposeBody("");
            setDraftId(null);
          },
        }))
      : folder === "sent"
        ? sent.map((row) => ({
            id: row.id,
            title: row.to,
            snip: row.subject,
            unread: false,
            onOpen: () => {
              setComposeTo(row.to);
              setComposeSubject(row.subject);
              setComposeBody(row.body);
              setDraftId(null);
              setActiveId(null);
            },
          }))
        : drafts.map((row) => ({
            id: row.id,
            title: row.to || "(no recipient)",
            snip: row.subject || row.body,
            unread: false,
            onOpen: () => openDraft(row),
          }));

  return (
    <div className="cms-mail">
      <aside className="cms-mail-folders" aria-label="Mail folders">
        {(
          [
            ["inbox", `Inbox${unread ? ` (${unread})` : ""}`],
            ["sent", `Sent (${sent.length})`],
            ["drafts", `Drafts (${drafts.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`cms-mail-folder${folder === id ? " is-active" : ""}`}
            onClick={() => setFolder(id)}
          >
            {label}
          </button>
        ))}
      </aside>

      <div className="cms-mail-list" aria-label="Messages">
        {listItems.length === 0 ? (
          <p className="cms-dash-empty" style={{ padding: "1rem" }}>
            {folder === "inbox"
              ? "No messages yet."
              : folder === "sent"
                ? "No sent mail yet."
                : "No drafts."}
          </p>
        ) : (
          listItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`cms-mail-row${item.unread ? " is-unread" : ""}${
                (folder === "inbox" ? activeId === item.id : draftId === item.id)
                  ? " is-active"
                  : ""
              }`}
              onClick={item.onOpen}
              disabled={pending}
            >
              <p className="cms-mail-from">{item.title}</p>
              <p className="cms-mail-snip">{item.snip}</p>
            </button>
          ))
        )}
      </div>

      <section className="cms-mail-detail" aria-label="Message detail">
        {folder === "inbox" && active ? (
          <>
            <div>
              <p className="cms-dash-kicker">{active.source}</p>
              <h2 className="cms-dash-heading">{active.name || "Anonymous"}</h2>
              <p className="cms-panel-lead">
                {active.email} · {new Date(active.createdAt).toLocaleString()}
              </p>
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {active.message || "(no message)"}
            </p>
            <div className="cms-actions">
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                onClick={() => beginReply(active, false)}
              >
                Reply
              </button>
              <button
                type="button"
                className="cms-btn"
                onClick={() => beginReply(active, true)}
              >
                Forward
              </button>
              <button
                type="button"
                className="cms-btn"
                onClick={() => markRead(active.id, !active.read)}
              >
                Mark {active.read ? "unread" : "read"}
              </button>
              <button
                type="button"
                className="cms-btn is-danger"
                onClick={() => remove(active.id)}
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div>
            <h2 className="cms-dash-heading">
              {folder === "drafts" ? "Draft" : folder === "sent" ? "Sent message" : "Compose"}
            </h2>
            <p className="cms-panel-lead">
              Replies go through SMTP when configured; otherwise they are logged
              on the server and stored in Sent.
            </p>
          </div>
        )}

        <div className="cms-mail-compose">
          <label className="cms-field">
            <span>To</span>
            <input
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="email@example.com"
            />
          </label>
          <label className="cms-field">
            <span>Subject</span>
            <input
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
            />
          </label>
          <label className="cms-field">
            <span>Message</span>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write a reply…"
            />
          </label>
          <div className="cms-actions">
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              disabled={pending}
              onClick={() =>
                sendMail(active ? "reply" : folder === "drafts" ? "compose" : "compose")
              }
            >
              {pending ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              className="cms-btn"
              disabled={pending}
              onClick={persistDraft}
            >
              Save draft
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
