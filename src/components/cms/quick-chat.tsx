"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { useCmsChat } from "@/components/cms/chat-context";

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
  parts?: Array<{
    type: string;
    toolName?: string;
    state?: string;
    output?: unknown;
  }>;
}) {
  if (!Array.isArray(message.parts)) return [];
  return message.parts
    .filter((p) => typeof p.type === "string" && p.type.startsWith("tool-"))
    .map((p) => {
      const name = p.type.replace(/^tool-/, "") || p.toolName || "tool";
      const out = p.output as
        | {
            ok?: boolean;
            action?: string;
            project?: { editUrl?: string; title?: string };
          }
        | undefined;
      return { name, state: p.state, out };
    });
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 11.5 19 4.75 12.4 19.5l-1.7-6.2L4.5 11.5Z" fill="currentColor" />
    </svg>
  );
}

function ChatThread({
  tabId,
  active,
  onFirstMessage,
}: {
  tabId: string;
  active: boolean;
  onFirstMessage: (text: string) => void;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const titledRef = useRef(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/cms/chat" }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: tabId,
    transport,
    onFinish: () => {
      router.refresh();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!active || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, active, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (!titledRef.current) {
      titledRef.current = true;
      onFirstMessage(text);
    }
    await sendMessage({ text });
  }

  return (
    <div
      className="cms-chat-thread"
      hidden={!active}
      aria-hidden={!active}
    >
      <div ref={listRef} className="cms-chat-thread-body">
        <div className="cms-quickchat-msg is-assistant">
          <p>
            Paste project notes — name, timeline, stack, metrics. I’ll create,
            edit, or delete against the CMS database.
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
                          <Link href={t.out.project.editUrl}>
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

      <form className="cms-chat-thread-form" onSubmit={(e) => void onSubmit(e)}>
        {messages.length > 0 ? (
          <button
            type="button"
            className="cms-chat-thread-clear"
            onClick={() => setMessages([])}
          >
            Clear
          </button>
        ) : null}
        <div className="cms-chat-thread-compose">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Create, edit, or delete a project…"
            disabled={busy || !active}
            className="cms-quickchat-card-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className="cms-quickchat-card-send"
            disabled={busy || !input.trim() || !active}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

export function CmsChatPanel() {
  const {
    open,
    tabs,
    activeId,
    width,
    setWidth,
    closeChat,
    setActiveId,
    addTab,
    closeTab,
    renameTab,
  } = useCmsChat();
  const dragging = useRef(false);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const next = window.innerWidth - e.clientX;
      setWidth(next);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.classList.remove("cms-chat-resizing");
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setWidth]);

  function startResize(e: ReactPointerEvent) {
    e.preventDefault();
    dragging.current = true;
    document.body.classList.add("cms-chat-resizing");
  }

  return (
    <aside
      className={`cms-chat-panel${open ? " is-open" : ""}`}
      role="complementary"
      aria-label="CMS Assistant"
      aria-hidden={!open}
      inert={!open ? true : undefined}
      style={open ? { width: width, flexBasis: width } : undefined}
    >
      <div
        className="cms-chat-resize"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize assistant panel"
        aria-valuenow={width}
        aria-valuemin={280}
        aria-valuemax={560}
        title="Drag to resize"
      />

      <header className="cms-chat-panel-head">
        <div className="cms-chat-tabs" role="tablist" aria-label="Chat tabs">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <div
                key={tab.id}
                className={`cms-chat-tab${active ? " is-active" : ""}`}
                role="presentation"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="cms-chat-tab-btn"
                  onClick={() => setActiveId(tab.id)}
                  title={tab.title}
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  className="cms-chat-tab-close"
                  aria-label={`Close ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="cms-chat-tab-add"
            onClick={addTab}
            aria-label="New chat tab"
            title="New chat"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="cms-chat-panel-x"
          onClick={closeChat}
          aria-label="Close assistant panel"
          title="Close panel"
        >
          ×
        </button>
      </header>

      <div className="cms-chat-panel-body">
        {tabs.map((tab) => (
          <ChatThread
            key={tab.id}
            tabId={tab.id}
            active={tab.id === activeId}
            onFirstMessage={(text) => renameTab(tab.id, text)}
          />
        ))}
        {tabs.length === 0 ? (
          <div className="cms-chat-empty">
            <p>No chats open.</p>
            <button type="button" className="cms-dash-action is-primary" onClick={addTab}>
              Start a chat
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

/** @deprecated FAB removed — use CmsChatPanel + topbar toggle */
export function CmsQuickChat() {
  return <CmsChatPanel />;
}
