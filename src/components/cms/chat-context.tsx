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

export type CmsChatTab = {
  id: string;
  title: string;
};

type CmsChatContextValue = {
  open: boolean;
  tabs: CmsChatTab[];
  activeId: string | null;
  width: number;
  setWidth: (w: number) => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveId: (id: string) => void;
  addTab: () => void;
  closeTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
};

const CmsChatContext = createContext<CmsChatContextValue | null>(null);

const WIDTH_KEY = "webport-cms-chat-width";
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 560;

export function clampChatWidth(w: number) {
  if (typeof window === "undefined") {
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
  }
  const cap = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.42));
  return Math.min(cap, Math.max(MIN_WIDTH, Math.round(w)));
}

function newTab(n: number): CmsChatTab {
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: n <= 1 ? "Chat" : `Chat ${n}`,
  };
}

export function CmsChatProvider({ children }: { children: ReactNode }) {
  const [seed] = useState(() => newTab(1));
  const [open, setOpen] = useState(false);
  const [tabs, setTabs] = useState<CmsChatTab[]>([seed]);
  const [activeId, setActiveId] = useState<string | null>(seed.id);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIDTH_KEY);
      if (!raw) return;
      const n = Number(raw);
      if (Number.isFinite(n)) setWidthState(clampChatWidth(n));
    } catch {
      /* ignore */
    }
  }, []);

  const setWidth = useCallback((w: number) => {
    const next = clampChatWidth(w);
    setWidthState(next);
    try {
      localStorage.setItem(WIDTH_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const openChat = useCallback(() => {
    setOpen(true);
    setTabs((prev) => {
      if (prev.length > 0) return prev;
      const t = newTab(1);
      setActiveId(t.id);
      return [t];
    });
  }, []);

  const closeChat = useCallback(() => setOpen(false), []);

  const toggleChat = useCallback(() => {
    setOpen((v) => {
      if (v) return false;
      setTabs((prev) => {
        if (prev.length > 0) return prev;
        const t = newTab(1);
        setActiveId(t.id);
        return [t];
      });
      return true;
    });
  }, []);

  const addTab = useCallback(() => {
    setTabs((prev) => {
      const t = newTab(prev.length + 1);
      setActiveId(t.id);
      return [...prev, t];
    });
    setOpen(true);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        setOpen(false);
        setActiveId(null);
        return [];
      }
      setActiveId((cur) => (cur === id ? next[next.length - 1]!.id : cur));
      return next;
    });
  }, []);

  const renameTab = useCallback((id: string, title: string) => {
    const trimmed = title.trim().slice(0, 28);
    if (!trimmed) return;
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
    );
  }, []);

  const value = useMemo(
    () => ({
      open,
      tabs,
      activeId,
      width,
      setWidth,
      openChat,
      closeChat,
      toggleChat,
      setActiveId,
      addTab,
      closeTab,
      renameTab,
    }),
    [
      open,
      tabs,
      activeId,
      width,
      setWidth,
      openChat,
      closeChat,
      toggleChat,
      addTab,
      closeTab,
      renameTab,
    ],
  );

  return (
    <CmsChatContext.Provider value={value}>{children}</CmsChatContext.Provider>
  );
}

export function useCmsChat() {
  const ctx = useContext(CmsChatContext);
  if (!ctx) {
    throw new Error("useCmsChat must be used within CmsChatProvider");
  }
  return ctx;
}
