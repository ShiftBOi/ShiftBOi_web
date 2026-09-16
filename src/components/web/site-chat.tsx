"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type SiteChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const SiteChatContext = createContext<SiteChatContextValue | null>(null);

export function useSiteChat() {
  const ctx = useContext(SiteChatContext);
  if (!ctx) {
    throw new Error("useSiteChat must be used within SiteChatProvider");
  }
  return ctx;
}

export function SiteChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, openChat, closeChat, toggleChat }),
    [open, openChat, closeChat, toggleChat],
  );

  return (
    <SiteChatContext.Provider value={value}>
      {children}
      <SiteChatDrawer />
    </SiteChatContext.Provider>
  );
}

function messageText(message: { parts: Array<{ type: string; text?: string }> }) {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

function SiteChatDrawer() {
  const { open, closeChat } = useSiteChat();
  const [input, setInput] = useState("");
  const [bootError, setBootError] = useState<string | null>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useEffect(() => {
    if (error) {
      setBootError(
        error.message.includes("503") || error.message.toLowerCase().includes("fetch")
          ? "ยังเชื่อมต่อ Ollama ไม่ได้ — รัน `ollama serve` แล้ว `ollama pull llama3.2`"
          : error.message,
      );
    }
  }, [error]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBootError(null);
    setInput("");
    void sendMessage({ text });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close chat"
        className={`site-chat-backdrop ${open ? "is-open" : ""}`}
        onClick={closeChat}
      />
      <aside
        className={`site-chat-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Talk to us chat"
      >
        <header className="site-chat-header">
          <div>
            <p className="site-chat-eyebrow">Talk to us</p>
            <h2 className="site-chat-title">Ask about this site</h2>
          </div>
          <button type="button" className="site-chat-close" onClick={closeChat} aria-label="Close">
            ×
          </button>
        </header>

        <div className="site-chat-body">
          {messages.length === 0 ? (
            <div className="site-chat-empty">
              <p>ถามอะไรก็ได้เกี่ยวกับ ShiftBOi / เนื้อหาในเว็บนี้</p>
              <div className="site-chat-suggestions">
                {[
                  "เว็บนี้เกี่ยวกับอะไร?",
                  "มี use cases อะไรบ้าง?",
                  "ราคาแพ็กเกจเป็นยังไง?",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="site-chat-chip"
                    onClick={() => {
                      setBootError(null);
                      void sendMessage({ text: q });
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="site-chat-hint">
                ฟรี 100% ผ่าน Ollama บนเครื่องคุณหรือเครื่องอื่นในเน็ตเวิร์ก
              </p>
            </div>
          ) : (
            <ul className="site-chat-messages">
              {messages.map((m) => (
                <li key={m.id} className={`site-chat-bubble is-${m.role}`}>
                  <span className="site-chat-role">{m.role === "user" ? "You" : "AI"}</span>
                  <p>{messageText(m)}</p>
                </li>
              ))}
              {busy ? <li className="site-chat-typing">กำลังพิมพ์…</li> : null}
            </ul>
          )}
          {bootError ? <p className="site-chat-error">{bootError}</p> : null}
        </div>

        <form className="site-chat-form" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำถาม…"
            disabled={busy}
            className="site-chat-input"
            autoComplete="off"
          />
          <button type="submit" className="site-chat-send" disabled={busy || !input.trim()}>
            Send
          </button>
          {messages.length > 0 ? (
            <button
              type="button"
              className="site-chat-clear"
              onClick={() => {
                setMessages([]);
                setBootError(null);
              }}
            >
              Clear
            </button>
          ) : null}
        </form>
      </aside>
    </>
  );
}
