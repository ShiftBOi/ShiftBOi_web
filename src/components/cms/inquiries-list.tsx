"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

type InquiryRow = {
  id: string;
  email: string;
  name: string | null;
  message: string | null;
  source: string;
  read: boolean;
  createdAt: string;
};

export function InquiriesList({
  initial,
  initialUnread,
}: {
  initial: InquiryRow[];
  initialUnread: number;
}) {
  const [rows, setRows] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);

  const active = rows.find((r) => r.id === activeId) ?? null;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cms/inquiries");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.inquiries ?? []);
    setUnread(data.unread ?? 0);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function markRead(id: string, read: boolean) {
    startTransition(async () => {
      await fetch("/api/cms/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, read } : r)),
      );
      setUnread((n) => Math.max(0, n + (read ? -1 : 1)));
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this inquiry?")) return;
    startTransition(async () => {
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

  return (
    <div className="cms-inquiries-page">
      <section className="cms-dash-metrics" aria-label="Inbox snapshot">
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Inbox</p>
          <p className="cms-dash-metric-value">{rows.length}</p>
          <p className="cms-dash-metric-meta">messages</p>
        </div>
        <div className="cms-dash-metric">
          <p className="cms-dash-metric-label">Unread</p>
          <p className="cms-dash-metric-value">{unread}</p>
          <p className="cms-dash-metric-meta">waiting</p>
        </div>
      </section>

      <section className="cms-dash-panel cms-inquiries-panel">
        <div className="cms-dash-panel-head">
          <div>
            <p className="cms-dash-kicker">Get in touch</p>
            <h2 className="cms-dash-heading">Inquiries</h2>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="cms-dash-empty">
            No messages yet — submissions from the public Get in touch card land
            here.
          </p>
        ) : (
          <div className="cms-inquiries-layout">
            <ul className="cms-inquiries-list">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`cms-inquiry-row${!row.read ? " is-unread" : ""}${
                      activeId === row.id ? " is-active" : ""
                    }`}
                    onClick={() => {
                      setActiveId(row.id);
                      if (!row.read) markRead(row.id, true);
                    }}
                    disabled={pending}
                  >
                    <span className="cms-inquiry-row__name">
                      {row.name || "Anonymous"}
                    </span>
                    <span className="cms-inquiry-row__email">{row.email}</span>
                    <span className="cms-inquiry-row__meta">
                      {new Date(row.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="cms-inquiry-detail">
              {active ? (
                <>
                  <div className="cms-inquiry-detail__head">
                    <div>
                      <p className="cms-inquiry-detail__name">
                        {active.name || "Anonymous"}
                      </p>
                      <a
                        href={`mailto:${active.email}`}
                        className="cms-inquiry-detail__email"
                      >
                        {active.email}
                      </a>
                    </div>
                    <div className="cms-inquiry-detail__actions">
                      <button
                        type="button"
                        className="cms-btn cms-btn-ghost"
                        disabled={pending}
                        onClick={() => markRead(active.id, !active.read)}
                      >
                        {active.read ? "Mark unread" : "Mark read"}
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-ghost"
                        disabled={pending}
                        onClick={() => remove(active.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="cms-inquiry-detail__meta">
                    {new Date(active.createdAt).toLocaleString()} · {active.source}
                  </p>
                  <p className="cms-inquiry-detail__message">
                    {active.message || "(no message)"}
                  </p>
                </>
              ) : (
                <p className="cms-dash-empty">Select a message</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
