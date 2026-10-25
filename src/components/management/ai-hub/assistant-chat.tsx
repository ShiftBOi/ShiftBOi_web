"use client";

import {
  AssistantComposer,
  type ComposerAttachment,
  type MentionOption,
} from "@/components/management/ai-hub/assistant-composer";
import {
  AssistantMessageTurn,
  type AssistantToolChip,
} from "@/components/management/ai-hub/assistant-message-turn";
import { expandSlashTokens } from "@/components/management/ai-hub/command-chip";
import { expandToolTokens } from "@/components/management/ai-hub/composer-badges";
import { CmsMark } from "@/components/management/cms-mark";
import DropdownMenu from "@/components/arc/dropdown-menu/dropdown-menu";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";
import { QUICK_MENU } from "@/lib/assistant/commands";
import {
  DEFAULT_TRANSLATE_MODEL,
  TRANSLATE_MODELS,
} from "@/lib/llm-models";
import {
  Bookmark,
  FolderKanban,
  Inbox,
  Languages,
  MessageSquarePlus,
  PenLine,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const QUICK_ICONS: Record<(typeof QUICK_MENU)[number]["icon"], LucideIcon> = {
  sparkles: Sparkles,
  folder: FolderKanban,
  languages: Languages,
  inbox: Inbox,
  pen: PenLine,
  search: Search,
  user: MessageSquarePlus,
  bookmark: Bookmark,
};

type ToolChip = AssistantToolChip;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Composer text without attachment block — used for retry. */
  inputText?: string;
  mentions?: MentionOption[];
  attachments?: ComposerAttachment[];
  reasoning?: string;
  thoughtFor?: number;
  tools?: ToolChip[];
  sources?: Array<{ title: string; snippet: string }>;
  status?: string;
};

type ThreadRow = {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
};

export function AssistantChat({
  onOpenSettings,
  compact = false,
}: {
  onOpenSettings?: () => void;
  /** Narrow rail layout for the CMS right sidebar panel */
  compact?: boolean;
} = {}) {
  const router = useRouter();
  const [model, setModel] = useState(DEFAULT_TRANSLATE_MODEL);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [title, setTitle] = useState("New chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [mentions, setMentions] = useState<MentionOption[]>([
    { type: "about", label: "About page" },
    { type: "inquiries", label: "Contact inquiries" },
    { type: "activities", label: "Activities & Updates" },
  ]);
  const [writeMode, setWriteMode] = useState<"bypass" | "approval">("bypass");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const toolsUsedRef = useRef(false);
  const insertCommandRef = useRef<((commandId: string) => void) | null>(null);

  const groqModels = useMemo(
    () => TRANSLATE_MODELS.filter((m) => m.provider === "groq"),
    []
  );

  const loadThreads = useCallback(async () => {
    try {
      const { ok, data } = await fetchJson<{
        data?: { threads?: ThreadRow[] };
      }>("/api/cms/assistant/threads");
      if (ok && data.data?.threads) setThreads(data.data.threads);
    } catch {
      /* threads optional — keep chat usable if API is down */
    }
  }, []);

  const loadMentions = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      projects?: Array<{ slug: string; name?: string; title?: string }>;
      data?: Array<{ slug: string; name?: string; title?: string }>;
    }>("/api/cms/projects?limit=40");
    if (!ok) return;
    const rows = Array.isArray(data.projects)
      ? data.projects
      : Array.isArray(data.data)
        ? data.data
        : [];
    const projects = rows.map((p) => ({
      type: "project",
      id: p.slug,
      label: p.name || p.title || p.slug,
    }));
    setMentions([
      { type: "about", label: "About page" },
      { type: "inquiries", label: "Contact inquiries" },
      { type: "activities", label: "Activities & Updates" },
      ...projects,
    ]);
  }, []);

  useEffect(() => {
    void loadThreads();
    void loadMentions();
  }, [loadThreads, loadMentions]);

  useEffect(() => {
    if (!stick.current || !scroller.current) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, streaming]);

  function newChat() {
    abortRef.current?.abort();
    setThreadId(null);
    setTitle("New chat");
    setMessages([]);
    setError(null);
    setStreaming(false);
  }

  async function openThread(id: string) {
    const { ok, data } = await fetchJson<{
      data?: {
        thread?: {
          id: string;
          title: string;
          model: string;
          messages: Array<{
            id: string;
            role: string;
            content: string;
            reasoning?: string | null;
            tools?: ToolChip[] | null;
            status: string;
          }>;
        };
      };
    }>(`/api/cms/assistant/threads/${id}`);
    if (!ok || !data.data?.thread) return;
    const t = data.data.thread;
    setThreadId(t.id);
    setTitle(t.title);
    setModel(t.model || DEFAULT_TRANSLATE_MODEL);
    setMessages(
      t.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          reasoning: m.reasoning || undefined,
          tools: (m.tools as ToolChip[]) || undefined,
          status: m.status,
        }))
    );
  }

  async function send(
    text: string,
    selected: MentionOption[],
    attachments: ComposerAttachment[] = []
  ) {
    setError(null);
    const attachBlock =
      attachments.length > 0
        ? `\n\nAttachments:\n${attachments
            .map((f) =>
              f.text
                ? `--- ${f.name} ---\n${f.text}`
                : `- ${f.name} (${f.mime}, ${f.size} bytes)`
            )
            .join("\n\n")}`
        : "";
    // Thread UI keeps badge tokens; expand for the model on the wire.
    const content = `${text}${attachBlock}`;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content,
      inputText: text,
      mentions: selected,
      attachments,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setStreaming(true);

    const assistantId = `a_${Date.now()}`;
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        tools: [],
        status: "streaming",
      },
    ]);

    const ac = new AbortController();
    abortRef.current = ac;
    toolsUsedRef.current = false;

    const apiMessages = next.map(({ role, content: c }) => ({
      role,
      content:
        role === "user" ? expandToolTokens(expandSlashTokens(c)) : c,
    }));

    try {
      const res = await fetch("/api/cms/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          threadId,
          model,
          mentions: selected,
          writeMode,
          messages: apiMessages,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Chat failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line) as Record<string, unknown>;
          } catch {
            continue;
          }
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantId) return msg;
              if (ev.type === "text") {
                return {
                  ...msg,
                  content: msg.content + String(ev.delta || ""),
                };
              }
              if (ev.type === "reasoning") {
                return {
                  ...msg,
                  reasoning: (msg.reasoning || "") + String(ev.delta || ""),
                };
              }
              if (ev.type === "reasoning-end") {
                return { ...msg, thoughtFor: Number(ev.seconds) || 1 };
              }
              if (ev.type === "sources") {
                return {
                  ...msg,
                  sources: ev.sources as ChatMessage["sources"],
                };
              }
              if (ev.type === "tool") {
                toolsUsedRef.current = true;
                const tool = ev.tool as ToolChip;
                const tools = [...(msg.tools || [])];
                const idx = tools.findIndex((t) => t.id === tool.id);
                if (idx >= 0) {
                  tools[idx] = {
                    ...tools[idx],
                    ...tool,
                    needConfirm: tool.needConfirm ?? tools[idx].needConfirm,
                  };
                } else tools.push(tool);
                return { ...msg, tools };
              }
              return msg;
            })
          );
          if (ev.type === "done") {
            setThreadId(String(ev.threadId));
            setTitle(String(ev.title || title));
            void loadThreads();
          }
          if (ev.type === "error") {
            setError(String(ev.message || "Error"));
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Chat failed");
      }
    } finally {
      setStreaming(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                status: ac.signal.aborted ? "stopped" : "done",
              }
            : m
        )
      );
      if (toolsUsedRef.current && !ac.signal.aborted) {
        router.refresh();
        void loadMentions();
      }
      abortRef.current = null;
    }
  }

  function retryFrom(msg: ChatMessage) {
    const idx = messages.findIndex((m) => m.id === msg.id);
    const prev = messages
      .slice(0, idx >= 0 ? idx : messages.length)
      .filter((m) => m.role === "user")
      .pop();
    if (!prev) return;
    void send(
      prev.inputText || prev.content,
      prev.mentions || [],
      prev.attachments || []
    );
  }

  function restoreTo(index: number) {
    setMessages((prev) => prev.slice(0, index + 1));
  }

  function resolveConfirm(
    assistantId: string,
    toolId: string,
    approve: boolean
  ) {
    const msg = messages.find((m) => m.id === assistantId);
    const tool = msg?.tools?.find((t) => t.id === toolId);
    const nc = tool?.needConfirm;
    if (!nc || streaming) return;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m;
        return {
          ...m,
          tools: (m.tools || []).map((t) =>
            t.id === toolId ? { ...t, confirmResolved: true } : t
          ),
        };
      })
    );

    const mention: MentionOption = {
      type: "project",
      id: nc.slug,
      label: nc.slug,
    };
    if (approve) {
      const action =
        nc.action === "unpublish"
          ? "unpublish"
          : nc.action === "delete"
            ? "delete"
            : nc.action;
      void send(
        `Yes — confirm ${action} for @project:${nc.slug}. Call the tool again with confirm:true.`,
        [mention]
      );
    } else {
      void send(
        `Cancel — do not ${nc.action} @project:${nc.slug}.`,
        [mention]
      );
    }
  }

  const modelLabel =
    groqModels.find((m) => m.id === model)?.name || "Model";

  return (
    <div className={compact ? "cms-ai-chat cms-ai-chat--rail" : "cms-ai-chat"}>
      <header className="cms-ai-chat__head">
        <DropdownMenu
          label={title}
          items={[
            {
              label: "New chat",
              icon: <MessageSquarePlus className="size-4" />,
              onSelect: newChat,
            },
            ...threads.map((t) => ({
              label: t.title,
              separatorBefore: t.id === threads[0]?.id,
              onSelect: () => void openThread(t.id),
            })),
          ]}
        />
        <Button type="button" variant="outline" size="sm" onClick={newChat}>
          <MessageSquarePlus className="size-3.5" />
          {compact ? null : "New"}
        </Button>
      </header>

      <div
        ref={scroller}
        className="cms-ai-chat__thread"
        onScroll={() => {
          const el = scroller.current;
          if (!el) return;
          stick.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.length === 0 ? (
          <div className="cms-ai-chat__empty">
            <div className="cms-ai-chat__empty-stage">
              <div className="cms-ai-chat__empty-hero">
                {!compact ? (
                  <div className="cms-ai-chat__watermark" aria-hidden="true">
                    <CmsMark className="cms-ai-chat__watermark-mark" title="" />
                  </div>
                ) : null}
                <div className="cms-ai-chat__empty-copy">
                  <p className="cms-ai-chat__kicker">ShiftBOi Assistant</p>
                  <h2>
                    What are we <em>working on</em>?
                  </h2>
                  <p className="cms-ai-chat__lede">
                    Projects, about, activities, and inquiries. Use{" "}
                    <code>/</code> commands, <code>@</code> mentions, or{" "}
                    <code>#</code> tools.
                  </p>
                </div>
              </div>
              <div className="cms-ai-quick">
                {(compact ? QUICK_MENU.slice(0, 4) : QUICK_MENU).map((item) => {
                  const Icon = QUICK_ICONS[item.icon];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="cms-ai-quick__card"
                      onClick={() => {
                        if (item.commandId && insertCommandRef.current) {
                          insertCommandRef.current(item.commandId);
                          return;
                        }
                        if (item.prompt) void send(item.prompt, []);
                      }}
                    >
                      <span className="cms-ai-quick__icon" aria-hidden="true">
                        <Icon className="size-4" />
                      </span>
                      <strong>{item.title}</strong>
                      <em>{item.subtitle}</em>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <AssistantMessageTurn
              key={msg.id}
              message={msg}
              index={index}
              mentions={mentions}
              streaming={streaming}
              isLast={index === messages.length - 1}
              onConfirm={(toolId, approve) =>
                resolveConfirm(msg.id, toolId, approve)
              }
              onRetry={() => retryFrom(msg)}
              onRestore={() => restoreTo(index)}
            />
          ))
        )}
        {error ? <p className="cms-ai-chat__error">{error}</p> : null}
      </div>

      <AssistantComposer
        streaming={streaming}
        mentions={mentions}
        modelLabel={modelLabel}
        modelValue={model}
        modelItems={groqModels.map((m) => ({
          value: m.id,
          label: m.name,
          hint: m.desc,
          icon: m.icon,
          metrics: m.metrics,
          onSelect: () => setModel(m.id),
        }))}
        writeMode={writeMode}
        onWriteModeChange={setWriteMode}
        onOpenSettings={onOpenSettings}
        insertCommandRef={insertCommandRef}
        onStop={() => abortRef.current?.abort()}
        onSend={(text, selected, attachments) =>
          void send(text, selected, attachments)
        }
      />
    </div>
  );
}
