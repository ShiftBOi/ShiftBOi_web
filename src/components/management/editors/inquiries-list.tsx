"use client";

import { Input as ArcInput } from "@/components/arc/input/input";
import { useCmsNotify } from "@/components/management/cms-notify";
import {
  isEmptyCmsHtml,
  normalizeCmsHtml,
  RichTextField,
} from "@/components/management/rich-text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import {
  ArrowLeft,
  CheckCheck,
  FileText,
  Forward,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

type InquiryRow = {
  id: string | number;
  email: string;
  name: string | null;
  message: string | null;
  source: string;
  createdAt: string;
};

type OutboundMail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  mode: "reply" | "forward" | "compose";
  createdAt: string;
};

type ComposeMode = "reply" | "forward";
type ListTab = "all" | "unread" | "read";
type MailFolder = "inbox" | "sent" | "draft";

const READ_KEY = "cms-inquiry-read";
const SENT_KEY = "cms-inquiry-sent";
const DRAFT_KEY = "cms-inquiry-drafts";

function loadReadIds(): Set<string | number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as Array<string | number>;
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string | number>) {
  window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function loadOutbound(key: string): OutboundMail[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboundMail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOutbound(key: string, items: OutboundMail[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

function initials(name: string | null, email: string) {
  const base = (name || email.split("@")[0] || "?").trim();
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function avatarHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

const MAIL_LOCALE = "en-US";

function formatMailTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(MAIL_LOCALE, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(MAIL_LOCALE, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function formatFullDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(MAIL_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Client-only clock label — avoids SSR timezone hydration mismatch. */
function MailTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(formatMailTime(iso));
  }, [iso]);
  return <time dateTime={iso}>{label}</time>;
}

function subjectLine(row: InquiryRow) {
  const src = row.source?.trim();
  if (!src || src === "landing" || src === "hero") return "New inquiry";
  return `Inquiry · ${src}`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function previewText(message: string | null) {
  const t = normalizeCmsHtml(message || "").replace(/\s+/g, " ").trim();
  return t || "No message body";
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function plainToMailHtml(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const safe = escapeHtml(line);
      return `<p>${safe || "<br>"}</p>`;
    })
    .join("");
}

function quotedOriginalHtml(row: InquiryRow) {
  const who = row.name ? `${row.name} <${row.email}>` : row.email;
  const body = row.message?.trim() || "(no message)";
  return [
    "<p><br></p>",
    "<p>---------- Original message ----------</p>",
    `<p><strong>From:</strong> ${escapeHtml(who)}</p>`,
    `<p><strong>Date:</strong> ${escapeHtml(formatFullDate(row.createdAt))}</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(subjectLine(row))}</p>`,
    "<p><br></p>",
    plainToMailHtml(body),
  ].join("");
}

function replyQuoteHtml(row: InquiryRow) {
  const who = row.name || row.email;
  const body = row.message?.trim() || "(no message)";
  const quoted = body
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
  return [
    "<p><br></p>",
    "<p><br></p>",
    `<p style="color:#6b7280">On ${escapeHtml(formatFullDate(row.createdAt))}, ${escapeHtml(who)} wrote:</p>`,
    `<blockquote style="margin:0;padding-left:12px;border-left:2px solid #d1d5db;color:#6b7280">${quoted}</blockquote>`,
  ].join("");
}

type ListItem =
  | { kind: "inquiry"; row: InquiryRow; unread: boolean }
  | { kind: "outbound"; row: OutboundMail };

export function InquiriesList() {
  const notify = useCmsNotify();
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [sent, setSent] = useState<OutboundMail[]>([]);
  const [drafts, setDrafts] = useState<OutboundMail[]>([]);
  const [search, setSearch] = useState("");
  const [listTab, setListTab] = useState<ListTab>("all");
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() => new Set());
  const [detailOpen, setDetailOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string | number>>(() => new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobilePane, setMobilePane] = useState<"list" | "read">("list");

  const [compose, setCompose] = useState<ComposeMode | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [showSubject, setShowSubject] = useState(true);
  const [sending, setSending] = useState(false);
  const [draftEditId, setDraftEditId] = useState<string | null>(null);

  useEffect(() => {
    setReadIds(loadReadIds());
    setSent(loadOutbound(SENT_KEY));
    setDrafts(loadOutbound(DRAFT_KEY));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchJson<{ inquiries?: InquiryRow[]; error?: string }>(
      "/api/cms/content"
    )
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || "Failed to load");
          return;
        }
        setRows(data.inquiries || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.source) set.add(r.source);
    return [...set].sort();
  }, [rows]);

  const unreadCount = useMemo(
    () => rows.filter((r) => !readIds.has(r.id)).length,
    [rows, readIds]
  );

  const listItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (folder === "sent" || folder === "draft") {
      const pool = folder === "sent" ? sent : drafts;
      return pool
        .filter((r) => {
          if (!q) return true;
          return (
            r.to.toLowerCase().includes(q) ||
            r.subject.toLowerCase().includes(q) ||
            r.body.toLowerCase().includes(q)
          );
        })
        .map(
          (row): ListItem => ({
            kind: "outbound",
            row,
          })
        );
    }

    return rows
      .filter((r) => {
        const isRead = readIds.has(r.id);
        if (listTab === "unread" && isRead) return false;
        if (listTab === "read" && !isRead) return false;
        if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
        if (!q) return true;
        return (
          r.email.toLowerCase().includes(q) ||
          (r.name || "").toLowerCase().includes(q) ||
          (r.message || "").toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q)
        );
      })
      .map(
        (row): ListItem => ({
          kind: "inquiry",
          row,
          unread: !readIds.has(row.id),
        })
      );
  }, [
    folder,
    sent,
    drafts,
    rows,
    search,
    sourceFilter,
    listTab,
    readIds,
  ]);

  const listKeys = useMemo(
    () =>
      listItems.map((item) =>
        item.kind === "inquiry" ? `inq:${item.row.id}` : `out:${item.row.id}`
      ),
    [listItems]
  );

  const allChecked =
    listKeys.length > 0 && listKeys.every((k) => checkedKeys.has(k));
  const someChecked = listKeys.some((k) => checkedKeys.has(k));
  const checkedCount = listKeys.filter((k) => checkedKeys.has(k)).length;

  useEffect(() => {
    setCheckedKeys((prev) => {
      if (prev.size === 0) return prev;
      const allowed = new Set(listKeys);
      let changed = false;
      const next = new Set<string>();
      for (const k of prev) {
        if (allowed.has(k)) next.add(k);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [listKeys]);

  const selectedInquiry = useMemo(() => {
    if (!selectedKey?.startsWith("inq:")) return null;
    const id = selectedKey.slice(4);
    return (
      rows.find((r) => String(r.id) === id || r.id === Number(id)) ?? null
    );
  }, [selectedKey, rows]);

  const selectedOutbound = useMemo(() => {
    if (!selectedKey?.startsWith("out:")) return null;
    const id = selectedKey.slice(4);
    return (
      sent.find((r) => r.id === id) ?? drafts.find((r) => r.id === id) ?? null
    );
  }, [selectedKey, sent, drafts]);

  useEffect(() => {
    if (!selectedKey) return;
    const stillThere = listItems.some((item) =>
      item.kind === "inquiry"
        ? `inq:${item.row.id}` === selectedKey
        : `out:${item.row.id}` === selectedKey
    );
    if (!stillThere) {
      setSelectedKey(null);
      setDetailOpen(false);
    }
  }, [listItems, selectedKey]);

  function markRead(id: string | number) {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }

  function markUnread(id: string | number) {
    setReadIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveReadIds(next);
      return next;
    });
  }

  function toggleChecked(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCheckAll() {
    if (allChecked) {
      setCheckedKeys(new Set());
      return;
    }
    setCheckedKeys(new Set(listKeys));
  }

  function clearChecked() {
    setCheckedKeys(new Set());
  }

  function markCheckedRead(asRead: boolean) {
    const ids = [...checkedKeys]
      .filter((k) => k.startsWith("inq:"))
      .map((k) => Number(k.slice(4)))
      .filter((n) => Number.isFinite(n));
    if (ids.length === 0) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (asRead) next.add(id);
        else next.delete(id);
      }
      saveReadIds(next);
      return next;
    });
    clearChecked();
    notify.success(asRead ? "Marked as read" : "Marked as unread");
  }

  async function deleteChecked() {
    const inquiryIds = [...checkedKeys]
      .filter((k) => k.startsWith("inq:"))
      .map((k) => k.slice(4))
      .filter((id) => id.length > 0);
    const outIds = [...checkedKeys]
      .filter((k) => k.startsWith("out:"))
      .map((k) => k.slice(4));

    const count = inquiryIds.length + outIds.length;
    if (count === 0) return;

    const okConfirm = await notify.confirm({
      title: `Delete ${count} message${count === 1 ? "" : "s"}?`,
      description:
        folder === "inbox"
          ? "Selected inquiries will be permanently removed."
          : folder === "draft"
            ? "Selected drafts will be removed from this browser."
            : "Selected sent copies will be removed from this browser only.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!okConfirm) return;

    if (folder === "inbox" && inquiryIds.length > 0) {
      const results = await Promise.all(
        inquiryIds.map((id) =>
          fetchJson<{ error?: string }>(`/api/cms/inquiries/${id}`, {
            method: "DELETE",
          }).then((r) => ({ id, ok: r.ok }))
        )
      );
      const deleted = new Set(results.filter((r) => r.ok).map((r) => r.id));
      if (deleted.size === 0) {
        notify.error("Delete failed", "Could not delete selected messages");
        return;
      }
      setRows((prev) => prev.filter((r) => !deleted.has(String(r.id))));
      setReadIds((prev) => {
        const next = new Set(prev);
        for (const id of deleted) next.delete(id);
        saveReadIds(next);
        return next;
      });
      if (
        selectedKey?.startsWith("inq:") &&
        deleted.has(selectedKey.slice(4))
      ) {
        setSelectedKey(null);
        closeDetail();
      }
      if (deleted.size < inquiryIds.length) {
        notify.error(
          "Partially deleted",
          `${deleted.size} of ${inquiryIds.length} removed`
        );
        clearChecked();
        return;
      }
    } else if (outIds.length > 0) {
      if (folder === "draft") {
        setDrafts((prev) => {
          const next = prev.filter((d) => !outIds.includes(d.id));
          saveOutbound(DRAFT_KEY, next);
          return next;
        });
      } else {
        setSent((prev) => {
          const next = prev.filter((d) => !outIds.includes(d.id));
          saveOutbound(SENT_KEY, next);
          return next;
        });
      }
      if (
        selectedKey?.startsWith("out:") &&
        outIds.includes(selectedKey.slice(4))
      ) {
        setSelectedKey(null);
        closeDetail();
      }
    }

    clearChecked();
    notify.success(
      count === 1 ? "Message deleted" : `${count} messages deleted`
    );
  }

  function closeDetail() {
    setDetailOpen(false);
    setCompose(null);
    setDraftEditId(null);
    setMobilePane("list");
  }

  function openFolder(next: MailFolder) {
    setFolder(next);
    setSourceFilter("all");
    setListTab("all");
    setSelectedKey(null);
    clearChecked();
    closeDetail();
  }

  function selectInquiry(row: InquiryRow) {
    setSelectedKey(`inq:${row.id}`);
    markRead(row.id);
    setCompose(null);
    setDraftEditId(null);
    setDetailOpen(true);
    setMobilePane("read");
  }

  function selectOutbound(row: OutboundMail) {
    setSelectedKey(`out:${row.id}`);
    setCompose(null);
    setDraftEditId(null);
    setDetailOpen(true);
    setMobilePane("read");
  }

  function goBack() {
    if (compose) {
      setCompose(null);
      setDraftEditId(null);
      return;
    }
    closeDetail();
  }

  function openReply(row: InquiryRow) {
    setSelectedKey(`inq:${row.id}`);
    setDetailOpen(true);
    setCompose("reply");
    setDraftEditId(null);
    setComposeTo(row.email);
    setComposeSubject(`Re: ${subjectLine(row)}`);
    setShowSubject(true);
    setComposeBody(replyQuoteHtml(row));
    setMobilePane("read");
  }

  function openForward(row: InquiryRow) {
    setSelectedKey(`inq:${row.id}`);
    setDetailOpen(true);
    setCompose("forward");
    setDraftEditId(null);
    setComposeTo("");
    setComposeSubject(`Fwd: ${subjectLine(row)}`);
    setShowSubject(true);
    setComposeBody(quotedOriginalHtml(row));
    setMobilePane("read");
  }

  function openDraft(row: OutboundMail) {
    setSelectedKey(`out:${row.id}`);
    setDetailOpen(true);
    setCompose(row.mode === "forward" ? "forward" : "reply");
    setDraftEditId(row.id);
    setComposeTo(row.to);
    setComposeSubject(row.subject);
    setComposeBody(row.body);
    setShowSubject(true);
    setMobilePane("read");
  }

  function saveDraftFromCompose() {
    const to = composeTo.trim();
    const subject = composeSubject.trim();
    const body = composeBody;
    if (!to && !subject && isEmptyCmsHtml(body)) {
      setCompose(null);
      setDraftEditId(null);
      return;
    }
    const item: OutboundMail = {
      id: draftEditId || `d_${Date.now()}`,
      to,
      subject: subject || "(no subject)",
      body,
      mode: compose || "compose",
      createdAt: new Date().toISOString(),
    };
    setDrafts((prev) => {
      const next = [item, ...prev.filter((d) => d.id !== item.id)];
      saveOutbound(DRAFT_KEY, next);
      return next;
    });
    notify.success("Draft saved");
    setCompose(null);
    setDraftEditId(null);
  }

  async function sendCompose() {
    if (!compose) return;
    const to = composeTo.trim();
    const subject = composeSubject.trim();
    const html = composeBody;
    const plain = normalizeCmsHtml(html);
    if (!to.includes("@")) {
      notify.error("Send failed", "Enter a valid recipient email");
      return;
    }
    if (!subject || !plain) {
      notify.error("Send failed", "Subject and message are required");
      return;
    }
    setSending(true);
    const { ok, data } = await fetchJson<{ error?: string }>(
      "/api/cms/inquiries/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html, body: plain, mode: compose }),
      }
    );
    setSending(false);
    if (!ok) {
      notify.error("Send failed", data.error || "Try again");
      return;
    }

    const sentItem: OutboundMail = {
      id: `s_${Date.now()}`,
      to,
      subject,
      body: html,
      mode: compose,
      createdAt: new Date().toISOString(),
    };
    setSent((prev) => {
      const next = [sentItem, ...prev];
      saveOutbound(SENT_KEY, next);
      return next;
    });
    if (draftEditId) {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== draftEditId);
        saveOutbound(DRAFT_KEY, next);
        return next;
      });
    }

    notify.success(compose === "forward" ? "Forwarded" : "Reply sent", to);
    setCompose(null);
    setDraftEditId(null);
  }

  async function removeInquiry(row: InquiryRow) {
    const okConfirm = await notify.confirm({
      title: `Delete message from ${row.name || row.email}?`,
      description: "This permanently removes the inquiry from your inbox.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!okConfirm) return;

    const { ok, data } = await fetchJson<{ error?: string }>(
      `/api/cms/inquiries/${row.id}`,
      { method: "DELETE" }
    );
    if (!ok) {
      notify.error("Delete failed", data.error || "Try again");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setReadIds((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      saveReadIds(next);
      return next;
    });
    if (selectedKey === `inq:${row.id}`) {
      setSelectedKey(null);
      closeDetail();
    }
    notify.success("Message deleted");
  }

  async function removeOutbound(row: OutboundMail) {
    const isDraft = folder === "draft" || drafts.some((d) => d.id === row.id);
    const okConfirm = await notify.confirm({
      title: isDraft ? "Delete this draft?" : "Delete from Sent?",
      description: isDraft
        ? "This draft will be removed from this browser."
        : "This removes the sent copy from this browser only.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!okConfirm) return;

    if (isDraft) {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== row.id);
        saveOutbound(DRAFT_KEY, next);
        return next;
      });
    } else {
      setSent((prev) => {
        const next = prev.filter((d) => d.id !== row.id);
        saveOutbound(SENT_KEY, next);
        return next;
      });
    }
    if (selectedKey === `out:${row.id}`) {
      setSelectedKey(null);
      closeDetail();
    }
    notify.success(isDraft ? "Draft deleted" : "Removed from Sent");
  }

  return (
    <div
      className={cn(
        "cms-mail cms-mail--app",
        `is-pane-${mobilePane}`,
        detailOpen && "is-reading",
        compose && "is-compose"
      )}
    >
      <section className="cms-mail__listpane" aria-label="Messages">
        <header className="cms-mail__list-head">
          <div
            className="cms-mail__folder-tabs"
            role="tablist"
            aria-label="Mailbox"
          >
            <button
              type="button"
              role="tab"
              aria-selected={folder === "inbox"}
              className={cn(
                "cms-mail__folder-tab",
                folder === "inbox" && "is-on"
              )}
              onClick={() => openFolder("inbox")}
            >
              Inbox <em>{rows.length}</em>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={folder === "sent"}
              className={cn(
                "cms-mail__folder-tab",
                folder === "sent" && "is-on"
              )}
              onClick={() => openFolder("sent")}
            >
              Sent <em>{sent.length}</em>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={folder === "draft"}
              className={cn(
                "cms-mail__folder-tab",
                folder === "draft" && "is-on"
              )}
              onClick={() => openFolder("draft")}
            >
              Draft <em>{drafts.length}</em>
            </button>
          </div>

          <div className="cms-mail__list-tools">
            {folder === "inbox" ? (
              <div
                className="cms-mail__status-tabs"
                role="tablist"
                aria-label="Read status"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={listTab === "all"}
                  className={cn(
                    "cms-mail__status-tab",
                    listTab === "all" && "is-on"
                  )}
                  onClick={() => setListTab("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={listTab === "read"}
                  className={cn(
                    "cms-mail__status-tab",
                    listTab === "read" && "is-on"
                  )}
                  onClick={() => setListTab("read")}
                >
                  Read
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={listTab === "unread"}
                  className={cn(
                    "cms-mail__status-tab",
                    listTab === "unread" && "is-on"
                  )}
                  onClick={() => setListTab("unread")}
                >
                  Unread
                  {unreadCount > 0 ? <em>{unreadCount}</em> : null}
                </button>
              </div>
            ) : (
              <span className="cms-mail__list-meta">
                {listItems.length} messages
              </span>
            )}

            {folder === "inbox" && sources.length > 0 ? (
              <div className="cms-mail__label-chips" aria-label="Labels">
                <button
                  type="button"
                  className={cn(
                    "cms-mail__chip",
                    sourceFilter === "all" && "is-on"
                  )}
                  onClick={() => setSourceFilter("all")}
                >
                  All sources
                </button>
                {sources.map((src) => (
                  <button
                    key={src}
                    type="button"
                    className={cn(
                      "cms-mail__chip",
                      sourceFilter === src && "is-on"
                    )}
                    onClick={() => setSourceFilter(src)}
                  >
                    {src}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="cms-arc-search cms-mail__search">
              <Search className="cms-arc-search__icon" aria-hidden />
              <ArcInput
                label="Search mail"
                hideLabel
                placeholder="Search email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {error ? <p className="cms-mail__error">{error}</p> : null}

        {listItems.length > 0 ? (
          <div className="cms-mail__select-bar">
            <Checkbox
              className="cms-mail__check"
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onCheckedChange={() => toggleCheckAll()}
              aria-label={allChecked ? "Deselect all" : "Select all"}
            />
            {someChecked ? (
              <div className="cms-mail__bulk">
                <span className="cms-mail__bulk-count">
                  {checkedCount} selected
                </span>
                {folder === "inbox" ? (
                  <>
                    <button
                      type="button"
                      className="cms-mail__bulk-btn"
                      onClick={() => markCheckedRead(true)}
                    >
                      <MailOpen className="size-3.5" />
                      Read
                    </button>
                    <button
                      type="button"
                      className="cms-mail__bulk-btn"
                      onClick={() => markCheckedRead(false)}
                    >
                      <Mail className="size-3.5" />
                      Unread
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="cms-mail__bulk-btn is-danger"
                  onClick={() => void deleteChecked()}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  className="cms-mail__bulk-btn"
                  onClick={clearChecked}
                  title="Clear selection"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <span className="cms-mail__select-hint">
                <CheckCheck className="size-3.5 opacity-50" aria-hidden />
                Select messages
              </span>
            )}
          </div>
        ) : null}

        <div className="cms-mail__list" role="listbox">
          {loading && folder === "inbox" ? (
            <p className="cms-mail__empty">Loading…</p>
          ) : listItems.length === 0 ? (
            <div className="cms-mail__empty">
              <Inbox className="size-8 opacity-35" strokeWidth={1.5} />
              <p>
                {folder === "sent"
                  ? "No sent mail yet"
                  : folder === "draft"
                    ? "No drafts"
                    : "No messages here"}
              </p>
            </div>
          ) : (
            listItems.map((item) => {
              if (item.kind === "outbound") {
                const row = item.row;
                const key = `out:${row.id}`;
                const on = detailOpen && selectedKey === key;
                const checked = checkedKeys.has(key);
                const name = row.to.split("@")[0] || row.to;
                return (
                  <article
                    key={key}
                    className={cn(
                      "cms-mail__row",
                      on && "is-selected",
                      checked && "is-checked"
                    )}
                  >
                    <Checkbox
                      className="cms-mail__check"
                      checked={checked}
                      onCheckedChange={() => toggleChecked(key)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${name}`}
                    />
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      className="cms-mail__row-main"
                      onClick={() =>
                        folder === "draft"
                          ? openDraft(row)
                          : selectOutbound(row)
                      }
                    >
                      <span
                        className="cms-mail__avatar"
                        style={
                          { "--hue": avatarHue(row.to) } as CSSProperties
                        }
                        aria-hidden
                      >
                        {initials(name, row.to)}
                      </span>
                      <span className="cms-mail__from">{name}</span>
                      <span className="cms-mail__snippet">
                        <span className="cms-mail__subject">{row.subject}</span>
                        <span className="cms-mail__dash" aria-hidden>
                          —
                        </span>
                        <span className="cms-mail__preview">
                          {previewText(row.body)}
                        </span>
                      </span>
                      <MailTime iso={row.createdAt} />
                    </button>
                    <div className="cms-mail__card-actions">
                      <button
                        type="button"
                        title="Delete"
                        className="cms-mail__icon-btn is-danger"
                        onClick={() => void removeOutbound(row)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </article>
                );
              }

              const row = item.row;
              const unread = item.unread;
              const key = `inq:${row.id}`;
              const on = detailOpen && selectedKey === key;
              const checked = checkedKeys.has(key);
              const from = row.name || row.email.split("@")[0] || "Lead";
              return (
                <article
                  key={key}
                  className={cn(
                    "cms-mail__row",
                    on && "is-selected",
                    checked && "is-checked",
                    unread && "is-unread"
                  )}
                >
                  <Checkbox
                    className="cms-mail__check"
                    checked={checked}
                    onCheckedChange={() => toggleChecked(key)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${from}`}
                  />
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    className="cms-mail__row-main"
                    onClick={() => selectInquiry(row)}
                  >
                    <span
                      className="cms-mail__avatar"
                      style={
                        { "--hue": avatarHue(row.email) } as CSSProperties
                      }
                      aria-hidden
                    >
                      {initials(row.name, row.email)}
                    </span>
                    <span className="cms-mail__from">{from}</span>
                    {unread ? (
                      <span
                        className="cms-mail__unread-pip"
                        aria-label="Unread"
                      />
                    ) : null}
                    <span className="cms-mail__snippet">
                      <span className="cms-mail__subject">
                        {subjectLine(row)}
                      </span>
                      <span className="cms-mail__dash" aria-hidden>
                        —
                      </span>
                      <span className="cms-mail__preview">
                        {previewText(row.message)}
                      </span>
                    </span>
                    <MailTime iso={row.createdAt} />
                  </button>
                  <div className="cms-mail__card-actions">
                    <button
                      type="button"
                      title="Reply"
                      className="cms-mail__icon-btn"
                      onClick={() => openReply(row)}
                    >
                      <Reply className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Forward"
                      className="cms-mail__icon-btn"
                      onClick={() => openForward(row)}
                    >
                      <Forward className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      className="cms-mail__icon-btn is-danger"
                      onClick={() => void removeInquiry(row)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {detailOpen && (selectedInquiry || selectedOutbound) ? (
        <section
          key={selectedKey ?? "reader"}
          className="cms-mail__reader"
          aria-label="Reading pane"
        >
          <header className="cms-mail__reader-bar">
            <button type="button" className="cms-mail__back" onClick={goBack}>
              <ArrowLeft className="size-4" />
              Back
            </button>
            {!compose && selectedInquiry ? (
              <div className="cms-mail__reader-actions">
                <button
                  type="button"
                  className="cms-mail__action"
                  onClick={() => openReply(selectedInquiry)}
                >
                  <Reply className="size-3.5" />
                  Reply
                </button>
                <button
                  type="button"
                  className="cms-mail__action"
                  onClick={() => openForward(selectedInquiry)}
                >
                  <Forward className="size-3.5" />
                  Forward
                </button>
                <button
                  type="button"
                  className="cms-mail__action is-danger"
                  onClick={() => void removeInquiry(selectedInquiry)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            ) : !compose && selectedOutbound ? (
              <div className="cms-mail__reader-actions">
                {folder === "draft" ||
                drafts.some((d) => d.id === selectedOutbound.id) ? (
                  <button
                    type="button"
                    className="cms-mail__action cms-mail__action--solid"
                    onClick={() => openDraft(selectedOutbound)}
                  >
                    <FileText className="size-3.5" />
                    Edit draft
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cms-mail__action is-danger"
                  onClick={() => void removeOutbound(selectedOutbound)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="cms-mail__icon-btn"
                aria-label="Close composer"
                onClick={() => {
                  setCompose(null);
                  setDraftEditId(null);
                }}
              >
                <X className="size-4" />
              </button>
            )}
          </header>

          <div className="cms-mail__reader-scroll">
            {selectedInquiry ? (
              <>
                <article className="cms-mail__message-card">
                  <h2 className="cms-mail__reader-subject">
                    {subjectLine(selectedInquiry)}
                  </h2>

                  <div className="cms-mail__meta">
                    <span
                      className="cms-mail__avatar cms-mail__avatar--lg"
                      style={
                        {
                          "--hue": avatarHue(selectedInquiry.email),
                        } as CSSProperties
                      }
                      aria-hidden
                    >
                      {initials(selectedInquiry.name, selectedInquiry.email)}
                    </span>
                    <div className="cms-mail__meta-copy">
                      <p className="cms-mail__meta-name">
                        {selectedInquiry.name || "Anonymous"}
                      </p>
                      <p className="cms-mail__meta-email">
                        {selectedInquiry.email}
                      </p>
                      <p className="cms-mail__meta-to">
                        {formatFullDate(selectedInquiry.createdAt)}
                      </p>
                    </div>
                    <span className="cms-mail__tag">
                      {selectedInquiry.source}
                    </span>
                  </div>

                  <div className="cms-mail__body">
                    {selectedInquiry.message ? (
                      selectedInquiry.message.split(/\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <p className="cms-mail__body-empty">
                        No written message — contact details only.
                      </p>
                    )}
                  </div>
                </article>

                {!compose ? (
                  <div className="cms-mail__footer-actions">
                    <button
                      type="button"
                      className="cms-mail__action cms-mail__action--solid"
                      onClick={() => openReply(selectedInquiry)}
                    >
                      <Reply className="size-3.5" />
                      Reply
                    </button>
                    <button
                      type="button"
                      className="cms-mail__action"
                      onClick={() => openForward(selectedInquiry)}
                    >
                      <Forward className="size-3.5" />
                      Forward
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {!compose && selectedOutbound ? (
              <article className="cms-mail__message-card">
                <h2 className="cms-mail__reader-subject">
                  {selectedOutbound.subject}
                </h2>
                <div className="cms-mail__meta">
                  <span
                    className="cms-mail__avatar cms-mail__avatar--lg"
                    style={
                      {
                        "--hue": avatarHue(selectedOutbound.to),
                      } as CSSProperties
                    }
                    aria-hidden
                  >
                    {initials(null, selectedOutbound.to)}
                  </span>
                  <div className="cms-mail__meta-copy">
                    <p className="cms-mail__meta-name">
                      {selectedOutbound.to}
                    </p>
                    <p className="cms-mail__meta-to">
                      {folder === "draft" ||
                      drafts.some((d) => d.id === selectedOutbound.id)
                        ? "Draft"
                        : "Sent"}{" "}
                      · {formatFullDate(selectedOutbound.createdAt)}
                    </p>
                  </div>
                </div>
                <div
                  className="cms-mail__body cms-mail__body--html"
                  dangerouslySetInnerHTML={{
                    __html: looksLikeHtml(selectedOutbound.body)
                      ? selectedOutbound.body
                      : plainToMailHtml(selectedOutbound.body),
                  }}
                />
              </article>
            ) : null}

            {compose ? (
              <div className="cms-mail__reply">
                <div className="cms-mail__reply-head">
                  <span className="cms-mail__reply-mode">
                    {compose === "forward" ? (
                      <Forward className="size-3.5" />
                    ) : (
                      <Reply className="size-3.5" />
                    )}
                    {compose === "forward" ? "Forward" : "Reply"}
                  </span>
                  <div className="cms-mail__compose-toggles">
                    <button
                      type="button"
                      className={cn(
                        "cms-mail__compose-toggle",
                        showSubject && "is-on"
                      )}
                      onClick={() => setShowSubject((v) => !v)}
                    >
                      Subject
                    </button>
                    <button
                      type="button"
                      className="cms-mail__compose-ghost"
                      onClick={saveDraftFromCompose}
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      className="cms-mail__icon-btn"
                      aria-label="Close composer"
                      onClick={() => {
                        setCompose(null);
                        setDraftEditId(null);
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="cms-mail__reply-fields">
                  <div className="cms-mail__compose-row">
                    <span>To</span>
                    <span className="cms-mail__pill-wrap">
                      <input
                        className="cms-mail__pill-input"
                        type="email"
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        placeholder="name@email.com"
                        readOnly={compose === "reply" && !draftEditId}
                      />
                    </span>
                  </div>
                  {showSubject ? (
                    <div className="cms-mail__compose-row">
                      <span>Subject</span>
                      <input
                        className="cms-mail__compose-subject"
                        type="text"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="cms-mail__reply-editor">
                  <RichTextField
                    variant="mail"
                    value={composeBody}
                    onChange={setComposeBody}
                    placeholder="Write your reply…"
                    minHeight={140}
                  />
                </div>

                <div className="cms-mail__reply-foot">
                  <button
                    type="button"
                    className="cms-mail__compose-icon"
                    title="Discard"
                    onClick={() => {
                      setCompose(null);
                      setDraftEditId(null);
                    }}
                    disabled={sending}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="cms-mail__send"
                    disabled={sending}
                    onClick={() => void sendCompose()}
                  >
                    <Send className="size-3.5" />
                    {sending
                      ? "Sending…"
                      : compose === "forward"
                        ? "Send forward"
                        : "Send"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
