"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCmsNotify } from "@/components/cms/cms-notify";
import { BloubFace } from "@/components/cms/bloub-face";

type HubTab = "chat" | "usage" | "knowledge" | "memory";

type ThreadRow = {
  id: string;
  title: string | null;
  updatedAt: string;
  preview: string;
};

type MemoryRow = { id: string; key: string; value: string; updatedAt: string };
type KnowledgeRow = {
  id: string;
  title: string;
  content: string;
  source: string | null;
};
type UsagePayload = {
  provider: { provider: string; model: string };
  totals: { tokensIn: number; tokensOut: number; calls: number };
  logs: Array<{
    id: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    createdAt: string;
  }>;
};

const SLASH_CHIPS = [
  "/help",
  "/project list",
  "/inquiry list",
  "/search ",
  "/remember ",
];

const MENTIONS = ["@project:", "@inquiries", "@site", "@memory"];

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

function HubChat({ threadId }: { threadId: string | null }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/cms/chat",
        body: threadId ? { threadId } : {},
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: threadId || "hub-draft",
    transport,
    onFinish: () => router.refresh(),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    setMessages([]);
    if (!threadId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/cms/assistant/threads/${threadId}`);
      const json = await res.json().catch(() => null);
      if (cancelled || !res.ok || !json?.thread?.messages) return;
      setMessages(
        json.thread.messages.map(
          (m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text", text: m.content }],
          }),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId, setMessages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <>
      <div className="cms-ai-messages" ref={listRef}>
        {!messages.length ? (
          <div className="cms-ai-bubble is-assistant">
            Hi — I&apos;m Bloub. Ask about projects, site settings, or inquiries.
            Try a slash command or @mention below.
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`cms-ai-bubble is-${message.role === "user" ? "user" : "assistant"}`}
          >
            {messageText(message) || "…"}
          </div>
        ))}
        {busy ? <div className="cms-ai-bubble is-assistant">Thinking…</div> : null}
        {error ? (
          <div className="cms-ai-bubble is-assistant" style={{ color: "#cf4436" }}>
            {error.message}
          </div>
        ) : null}
      </div>
      <form className="cms-ai-composer" onSubmit={(e) => void onSubmit(e)}>
        <div className="cms-ai-slash">
          {SLASH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="cms-ai-chip"
              onClick={() => setInput((v) => (v ? `${v} ${chip}` : chip))}
            >
              {chip.trim()}
            </button>
          ))}
          {MENTIONS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="cms-ai-chip"
              onClick={() => setInput((v) => `${v}${chip}`)}
            >
              {chip}
            </button>
          ))}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Bloub…  (/help)"
          rows={3}
        />
        <div className="cms-actions">
          <button
            type="submit"
            className="cms-btn cms-btn-primary"
            disabled={busy || !input.trim()}
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}

export function AiHub() {
  const notify = useCmsNotify();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as HubTab) || "chat";
  const [tab, setTab] = useState<HubTab>(
    ["chat", "usage", "knowledge", "memory"].includes(initialTab)
      ? initialTab
      : "chat",
  );
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRow[]>([]);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [memKey, setMemKey] = useState("");
  const [memValue, setMemValue] = useState("");
  const [knowTitle, setKnowTitle] = useState("");
  const [knowContent, setKnowContent] = useState("");

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/cms/assistant/threads");
    const json = await res.json().catch(() => null);
    if (!res.ok) return;
    setThreads(json.threads || []);
  }, []);

  const loadMemory = useCallback(async () => {
    const res = await fetch("/api/cms/assistant/memory");
    const json = await res.json().catch(() => null);
    if (res.ok) setMemories(json.memories || []);
  }, []);

  const loadKnowledge = useCallback(async () => {
    const res = await fetch("/api/cms/assistant/knowledge");
    const json = await res.json().catch(() => null);
    if (res.ok) setKnowledge(json.knowledge || []);
  }, []);

  const loadUsage = useCallback(async () => {
    const res = await fetch("/api/cms/assistant/usage");
    const json = await res.json().catch(() => null);
    if (res.ok) setUsage(json);
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (tab === "memory") void loadMemory();
    if (tab === "knowledge") void loadKnowledge();
    if (tab === "usage") void loadUsage();
  }, [tab, loadMemory, loadKnowledge, loadUsage]);

  function setHubTab(next: HubTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "chat") params.delete("tab");
    else params.set("tab", next);
    router.replace(`/cms/ai${params.toString() ? `?${params}` : ""}`);
  }

  async function newThread() {
    const res = await fetch("/api/cms/assistant/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New chat" }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      notify.error("Could not create thread", json?.error);
      return;
    }
    setThreadId(json.thread.id);
    setHubTab("chat");
    await loadThreads();
  }

  async function clearThreads() {
    const ok = await notify.confirm({
      title: "Clear all chat history?",
      danger: true,
      confirmLabel: "Clear",
    });
    if (!ok) return;
    await fetch("/api/cms/assistant/threads", { method: "DELETE" });
    setThreadId(null);
    await loadThreads();
    notify.success("Chat history cleared");
  }

  async function saveMemory() {
    if (!memKey.trim() || !memValue.trim()) return;
    const res = await fetch("/api/cms/assistant/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: memKey, value: memValue }),
    });
    if (!res.ok) {
      notify.error("Could not save memory");
      return;
    }
    setMemKey("");
    setMemValue("");
    notify.success("Memory saved");
    await loadMemory();
  }

  async function saveKnowledge() {
    if (!knowTitle.trim() || !knowContent.trim()) return;
    const res = await fetch("/api/cms/assistant/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: knowTitle, content: knowContent }),
    });
    if (!res.ok) {
      notify.error("Could not save knowledge");
      return;
    }
    setKnowTitle("");
    setKnowContent("");
    notify.success("Knowledge added");
    await loadKnowledge();
  }

  return (
    <div className="cms-ai-hub">
      <aside className="cms-ai-side" aria-label="AI sections">
        {(
          [
            ["chat", "Chat"],
            ["usage", "Usage"],
            ["knowledge", "Knowledge"],
            ["memory", "Memory"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`cms-ai-side-btn${tab === id ? " is-active" : ""}`}
            onClick={() => setHubTab(id)}
          >
            {label}
          </button>
        ))}
      </aside>

      <section className="cms-ai-main">
        {tab === "chat" ? (
          <>
            <div className="cms-ai-thread-bar">
              <BloubFace size={22} active />
              <button type="button" className="cms-btn cms-btn-primary" onClick={() => void newThread()}>
                New thread
              </button>
              <button type="button" className="cms-btn" onClick={() => void loadThreads()}>
                Refresh
              </button>
              <button type="button" className="cms-btn is-danger" onClick={() => void clearThreads()}>
                Clear all
              </button>
              <div className="cms-ai-slash" style={{ marginLeft: "auto" }}>
                {threads.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`cms-ai-chip${threadId === t.id ? " is-active" : ""}`}
                    onClick={() => setThreadId(t.id)}
                    title={t.preview}
                  >
                    {(t.title || "Untitled").slice(0, 18)}
                  </button>
                ))}
              </div>
            </div>
            <HubChat threadId={threadId} />
          </>
        ) : null}

        {tab === "usage" ? (
          <div className="cms-ai-panel">
            <div className="cms-ai-card">
              <h3 className="cms-panel-title">Provider</h3>
              <p className="cms-panel-lead">
                {usage
                  ? `${usage.provider.provider} · ${usage.provider.model}`
                  : "Loading…"}
              </p>
              <p className="cms-panel-lead">
                Last 30 days: {usage?.totals.calls ?? 0} calls ·{" "}
                {usage?.totals.tokensIn ?? 0} in / {usage?.totals.tokensOut ?? 0}{" "}
                out
              </p>
            </div>
            {(usage?.logs || []).slice(0, 20).map((log) => (
              <div key={log.id} className="cms-ai-card">
                <strong>
                  {log.provider} / {log.model}
                </strong>
                <p className="cms-panel-lead">
                  {log.tokensIn} in · {log.tokensOut} out ·{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!usage?.logs?.length ? (
              <p className="cms-panel-lead">No usage logs yet.</p>
            ) : null}
          </div>
        ) : null}

        {tab === "knowledge" ? (
          <div className="cms-ai-panel">
            <div className="cms-ai-card">
              <label className="cms-field">
                <span>Title</span>
                <input value={knowTitle} onChange={(e) => setKnowTitle(e.target.value)} />
              </label>
              <label className="cms-field">
                <span>Content</span>
                <textarea value={knowContent} onChange={(e) => setKnowContent(e.target.value)} />
              </label>
              <button type="button" className="cms-btn cms-btn-primary" onClick={() => void saveKnowledge()}>
                Add knowledge
              </button>
            </div>
            {knowledge.map((row) => (
              <div key={row.id} className="cms-ai-card">
                <strong>{row.title}</strong>
                <p className="cms-panel-lead">{row.content.slice(0, 280)}</p>
                <button
                  type="button"
                  className="cms-btn is-danger"
                  onClick={async () => {
                    await fetch(`/api/cms/assistant/knowledge?id=${row.id}`, {
                      method: "DELETE",
                    });
                    await loadKnowledge();
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "memory" ? (
          <div className="cms-ai-panel">
            <div className="cms-ai-card">
              <label className="cms-field">
                <span>Key</span>
                <input value={memKey} onChange={(e) => setMemKey(e.target.value)} />
              </label>
              <label className="cms-field">
                <span>Value</span>
                <textarea value={memValue} onChange={(e) => setMemValue(e.target.value)} />
              </label>
              <button type="button" className="cms-btn cms-btn-primary" onClick={() => void saveMemory()}>
                Remember
              </button>
            </div>
            {memories.map((row) => (
              <div key={row.id} className="cms-ai-card">
                <strong>{row.key}</strong>
                <p className="cms-panel-lead">{row.value}</p>
                <button
                  type="button"
                  className="cms-btn is-danger"
                  onClick={async () => {
                    await fetch(
                      `/api/cms/assistant/memory?key=${encodeURIComponent(row.key)}`,
                      { method: "DELETE" },
                    );
                    await loadMemory();
                  }}
                >
                  Forget
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
