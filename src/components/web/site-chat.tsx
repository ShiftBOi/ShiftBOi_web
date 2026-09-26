"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type FormEvent,
} from "react";
import gsap from "gsap";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

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
      <SiteChatWidget />
    </SiteChatContext.Provider>
  );
}

function messageText(message: { parts: Array<{ type: string; text?: string }> }) {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

const WELCOME =
  "Hi! I'm the ShiftBOi assistant. Ask me anything about the portfolio, focus areas, engagement, or getting in touch.";

const CHAT_STORAGE_KEY = "shiftboi-site-chat-v1";

type StoredChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: "text"; text: string }>;
};

function loadStoredMessages(): StoredChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is StoredChatMessage =>
        !!m &&
        typeof m === "object" &&
        typeof (m as StoredChatMessage).id === "string" &&
        ((m as StoredChatMessage).role === "user" ||
          (m as StoredChatMessage).role === "assistant") &&
        Array.isArray((m as StoredChatMessage).parts),
    );
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: StoredChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    if (messages.length === 0) {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore quota / private mode
  }
}

function useDustHover(
  wrapRef: RefObject<HTMLElement | null>,
  rootRef: RefObject<HTMLElement | null>,
  dustRef: RefObject<HTMLElement | null>,
) {
  const hoveringRef = useRef(false);
  const emitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const root = rootRef.current;
    const dust = dustRef.current;
    if (!wrap || !root || !dust) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = { inset: 0 };
    const PURPLE = "#7c3aed";
    const INSET_MAX = 10;

    const paintFrame = () => {
      root.style.boxShadow = `inset 0 0 0 ${frame.inset}px ${PURPLE}`;
    };

    gsap.set(frame, { inset: 0 });
    paintFrame();

    const spawnDust = () => {
      if (!hoveringRef.current || reduced) return;

      const w = root.offsetWidth;
      const h = root.offsetHeight;
      if (!w || !h) return;

      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * w;
        y = 0;
      } else if (side === 1) {
        x = w;
        y = Math.random() * h;
      } else if (side === 2) {
        x = Math.random() * w;
        y = h;
      } else {
        x = 0;
        y = Math.random() * h;
      }

      const size = 2 + Math.random() * 3.5;
      const angle = Math.atan2(y - h / 2, x - w / 2) + (Math.random() - 0.5) * 0.9;
      const dist = 18 + Math.random() * 36;
      const colors = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ffffff"];

      const mote = document.createElement("span");
      mote.className = "talk-dust-mote";
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.background = colors[Math.floor(Math.random() * colors.length)]!;
      mote.style.left = "0";
      mote.style.top = "0";
      dust.appendChild(mote);

      gsap.fromTo(
        mote,
        {
          x: x - size / 2,
          y: y - size / 2,
          opacity: 0.85 + Math.random() * 0.15,
          scale: 0.6 + Math.random() * 0.5,
        },
        {
          x: x - size / 2 + Math.cos(angle) * dist,
          y: y - size / 2 + Math.sin(angle) * dist,
          opacity: 0,
          scale: 0.2 + Math.random() * 0.35,
          duration: 0.95 + Math.random() * 1.1,
          ease: "power1.out",
          onComplete: () => mote.remove(),
        },
      );
    };

    const startEmit = () => {
      if (emitTimerRef.current || reduced) return;
      for (let i = 0; i < 6; i++) spawnDust();
      emitTimerRef.current = setInterval(spawnDust, 70);
    };

    const stopEmit = () => {
      if (emitTimerRef.current) {
        clearInterval(emitTimerRef.current);
        emitTimerRef.current = null;
      }
    };

    const enter = () => {
      if (hoveringRef.current) return;
      hoveringRef.current = true;
      gsap.killTweensOf(frame);
      gsap.to(frame, {
        inset: INSET_MAX,
        duration: reduced ? 0.01 : 0.5,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: paintFrame,
      });
      startEmit();
    };

    const leave = () => {
      if (!hoveringRef.current) return;
      hoveringRef.current = false;
      stopEmit();
      gsap.killTweensOf(frame);
      gsap.to(frame, {
        inset: 0,
        duration: reduced ? 0.01 : 0.4,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: paintFrame,
      });
    };

    wrap.addEventListener("pointerenter", enter);
    wrap.addEventListener("pointerleave", leave);
    root.addEventListener("focus", enter);
    root.addEventListener("blur", leave);

    return () => {
      hoveringRef.current = false;
      stopEmit();
      wrap.removeEventListener("pointerenter", enter);
      wrap.removeEventListener("pointerleave", leave);
      root.removeEventListener("focus", enter);
      root.removeEventListener("blur", leave);
      gsap.killTweensOf(frame);
      dust.replaceChildren();
    };
  }, [wrapRef, rootRef, dustRef]);
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

function SiteChatWidget() {
  const { open, closeChat, toggleChat } = useSiteChat();
  const [input, setInput] = useState("");
  const [bootError, setBootError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const dustRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useDustHover(wrapRef, fabRef, dustRef);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const stored = loadStoredMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
    setHydrated(true);
  }, [setMessages]);

  useEffect(() => {
    if (!hydrated || busy) return;
    saveStoredMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: m.parts
          .filter(
            (p): p is { type: "text"; text: string } =>
              p.type === "text" && typeof p.text === "string",
          )
          .map((p) => ({ type: "text" as const, text: p.text })),
      })),
    );
  }, [messages, busy, hydrated]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useEffect(() => {
    if (!error) return;
    const msg = error.message.toLowerCase();
    const offline =
      msg.includes("503") ||
      msg.includes("fetch") ||
      msg.includes("econnrefused") ||
      msg.includes("cannot connect") ||
      msg.includes("an error occurred");
    setBootError(
      offline
        ? "ยังเชื่อมต่อ Ollama ไม่ได้ — เปิด Terminal แล้วรัน `ollama serve`"
        : error.message,
    );
  }, [error]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 80;
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBootError(null);
    setInput("");
    stickToBottomRef.current = true;
    void sendMessage({ text });
  };

  const talkToHuman = () => {
    closeChat();
    document.getElementById("site-footer")?.scrollIntoView({ behavior: "smooth" });
  };

  const clearChat = () => {
    setMessages([]);
    setBootError(null);
    saveStoredMessages([]);
  };

  return (
    <div className="site-chat-dock" data-lenis-prevent>
      <div
        className={`site-chat-card ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="ShiftBOi Assistant"
        aria-hidden={!open}
      >
        <header className="site-chat-card-header">
          <div className="site-chat-card-brand">
            <span className="site-chat-card-dot" aria-hidden />
            <p className="site-chat-card-title">ShiftBOi Assistant</p>
          </div>
          <div className="site-chat-card-actions">
            <button type="button" className="site-chat-human" onClick={talkToHuman}>
              Talk to a human
            </button>
            <button
              type="button"
              className="site-chat-card-x"
              onClick={closeChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </header>

        <div ref={listRef} className="site-chat-card-body">
          <div className="site-chat-msg is-assistant">
            <p>{WELCOME}</p>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`site-chat-msg is-${m.role}`}>
              <p>{messageText(m)}</p>
            </div>
          ))}
          {busy ? (
            <div className="site-chat-typing" aria-live="polite" aria-label="Thinking">
              <Bouncy size="22" speed="1.75" color="#8b5cf6" />
            </div>
          ) : null}
          {bootError ? <p className="site-chat-error">{bootError}</p> : null}
        </div>

        <form className="site-chat-card-form" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about ShiftBOi..."
            disabled={busy}
            className="site-chat-card-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className="site-chat-card-send"
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </form>
        {messages.length > 0 ? (
          <button type="button" className="site-chat-card-clear" onClick={clearChat}>
            Clear
          </button>
        ) : null}
      </div>

      <div ref={wrapRef} className="talk-dust-wrap site-chat-fab-wrap">
        <span ref={dustRef} className="talk-dust-layer" aria-hidden />
        <button
          ref={fabRef}
          type="button"
          className={`site-chat-fab ${open ? "is-open" : ""}`}
          onClick={toggleChat}
          aria-label={open ? "Close chat" : "Open chat"}
          aria-expanded={open}
        >
          <ChatIcon open={open} />
        </button>
      </div>
    </div>
  );
}
