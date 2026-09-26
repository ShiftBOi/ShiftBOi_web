"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

function messageText(message: {
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("");
  }
  return typeof message.content === "string" ? message.content : "";
}

function toolSummaries(message: {
  parts?: Array<{ type: string; toolName?: string; state?: string; output?: unknown }>;
}) {
  if (!Array.isArray(message.parts)) return [];
  return message.parts
    .filter((p) => typeof p.type === "string" && p.type.startsWith("tool-"))
    .map((p) => {
      const name = p.type.replace(/^tool-/, "") || p.toolName || "tool";
      const out = p.output as
        | { ok?: boolean; action?: string; project?: { editUrl?: string; title?: string } }
        | undefined;
      return { name, state: p.state, out };
    });
}

function ChatIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6.5 6.5l11 11M17.5 6.5l-11 11"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5.5 6.75h11.5a1.75 1.75 0 0 1 1.75 1.75v6.5a1.75 1.75 0 0 1-1.75 1.75H10.2L7.4 19.4a.4.4 0 0 1-.7-.28V16.75H5.5A1.75 1.75 0 0 1 3.75 15V8.5A1.75 1.75 0 0 1 5.5 6.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 11.5 19 4.75 12.4 19.5l-1.7-6.2L4.5 11.5Z" fill="currentColor" />
    </svg>
  );
}

export function CmsQuickChat() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/cms/chat" }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    onFinish: () => {
      router.refresh();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="cms-quickchat-dock">
      <div
        className={`cms-quickchat-card${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="CMS Quick Chat"
        aria-hidden={!open}
      >
        <header className="cms-quickchat-card-header">
          <div className="cms-quickchat-card-brand">
            <span className="cms-quickchat-card-dot" aria-hidden />
            <p className="cms-quickchat-card-title">CMS Assistant</p>
          </div>
          <div className="cms-quickchat-card-actions">
            {messages.length > 0 ? (
              <button
                type="button"
                className="cms-quickchat-card-clear"
                onClick={() => setMessages([])}
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              className="cms-quickchat-card-x"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </header>

        <div ref={listRef} className="cms-quickchat-card-body">
          <div className="cms-quickchat-msg is-assistant">
            <p>
              Paste project notes — name, timeline, stack, metrics. I’ll create, edit, or delete
              against the CMS database.
            </p>
          </div>
          {messages.map((m) => {
            const text = messageText(m);
            const tools = toolSummaries(m);
            return (
              <div key={m.id} className={`cms-quickchat-msg is-${m.role}`}>
                {text ? <p>{text}</p> : null}
                {tools.length > 0 ? (
                  <ul className="cms-quickchat-tools">
                    {tools.map((t, i) => (
                      <li key={`${m.id}-t-${i}`}>
                        <code>{t.name}</code>
                        {t.out?.action ? ` · ${t.out.action}` : ""}
                        {t.out?.project?.editUrl ? (
                          <>
                            {" · "}
                            <Link href={t.out.project.editUrl} onClick={() => setOpen(false)}>
                              {t.out.project.title || "Open"}
                            </Link>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
          {busy ? (
            <div className="cms-quickchat-typing" aria-live="polite" aria-label="Thinking">
              <Bouncy size="22" speed="1.75" color="#8b5cf6" />
            </div>
          ) : null}
          {error ? <p className="cms-quickchat-error">{error.message}</p> : null}
        </div>

        <form className="cms-quickchat-card-form" onSubmit={(e) => void onSubmit(e)}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Create, edit, or delete a project…"
            disabled={busy}
            className="cms-quickchat-card-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className="cms-quickchat-card-send"
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </form>
      </div>

      <button
        type="button"
        className={`cms-quickchat-fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Quick Chat" : "Open Quick Chat"}
        aria-expanded={open}
      >
        <ChatIcon open={open} />
      </button>
    </div>
  );
}
