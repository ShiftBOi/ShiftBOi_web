"use client";

import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Memory = {
  id: string;
  text: string;
  group: string;
  sourceKind: string;
  sourceDate: string;
};

const GROUPS = [
  { id: "all", label: "All" },
  { id: "about", label: "About you" },
  { id: "preferences", label: "Preferences" },
  { id: "projects", label: "Projects" },
  { id: "people", label: "People" },
] as const;

export function MemoryPanel() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [group, setGroup] = useState("preferences");
  const [settings, setSettings] = useState({
    savedMemories: true,
    chatHistory: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchJson<{
        data?: {
          memories?: Memory[];
          settings?: { savedMemories?: boolean; chatHistory?: boolean };
        };
      }>("/api/cms/assistant/memory");
      if (ok && data.data) {
        setMemories(data.data.memories || []);
        if (data.data.settings) {
          setSettings({
            savedMemories: data.data.settings.savedMemories !== false,
            chatHistory: data.data.settings.chatHistory !== false,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return memories.filter((m) => {
      if (filter !== "all" && m.group !== filter) return false;
      if (q && !m.text.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [memories, filter, q]);

  const capacity = 4000;
  const used = memories.reduce((s, m) => s + m.text.length, 0);
  const pct = Math.min(100, Math.round((used / capacity) * 100));

  async function toggle(key: "savedMemories" | "chatHistory", on: boolean) {
    setSettings((s) => ({ ...s, [key]: on }));
    await fetchJson("/api/cms/assistant/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { [key]: on } }),
    });
  }

  async function add() {
    const text = draft.trim();
    if (!text) return;
    await fetchJson("/api/cms/assistant/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, group }),
    });
    setDraft("");
    await load();
  }

  async function forget(id: string) {
    await fetchJson(`/api/cms/assistant/memory?id=${id}`, {
      method: "DELETE",
    });
    setMemories((m) => m.filter((x) => x.id !== id));
  }

  return (
    <div className="cms-ai-panel">
      <header className="cms-ai-panel__head">
        <div>
          <p className="cms-eyebrow">Memory</p>
          <h2 className="cms-title">What the assistant remembers</h2>
          <p className="cms-subtitle">
            Short facts across chats — edit, forget, or turn injection off.
          </p>
        </div>
        <div className="cms-ai-meter" title={`${pct}% full`}>
          <span>{pct}% full</span>
          <div className={cn("cms-ai-meter__bar", pct >= 90 && "is-warn")}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      <div className="cms-ai-switches">
        <label>
          <input
            type="checkbox"
            checked={settings.savedMemories}
            onChange={(e) => void toggle("savedMemories", e.target.checked)}
          />
          <span>
            <strong>Reference saved memories</strong>
            <em>Uses and adds to the memories below</em>
          </span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.chatHistory}
            onChange={(e) => void toggle("chatHistory", e.target.checked)}
          />
          <span>
            <strong>Reference chat history</strong>
            <em>Keeps earlier turns in the open thread</em>
          </span>
        </label>
      </div>

      <div className="cms-ai-filters">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={cn(filter === g.id && "is-active")}
            onClick={() => setFilter(g.id)}
          >
            {g.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="cms-ai-filters__search"
        />
      </div>

      <div className={cn("cms-ai-mem-list", !settings.savedMemories && "is-dim")}>
        {loading ? (
          <div className="cms-system__empty">
            <Loader2 className="size-8 animate-spin opacity-40" />
          </div>
        ) : visible.length === 0 ? (
          <div className="cms-system__empty">
            <p>No memories in this filter yet.</p>
          </div>
        ) : (
          visible.map((m) => (
            <article key={m.id} className="cms-ai-mem">
              <p>{m.text}</p>
              <footer>
                <span>
                  {m.group} · {m.sourceKind === "manual" ? "Added by you" : "From a chat"}
                </span>
                <button type="button" onClick={() => void forget(m.id)}>
                  <Trash2 className="size-3.5" /> Forget
                </button>
              </footer>
            </article>
          ))
        )}
      </div>

      <div className="cms-ai-add">
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          {GROUPS.filter((g) => g.id !== "all").map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add memory (one sentence, no period)"
          maxLength={200}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button type="button" className="cms-btn" onClick={() => void add()}>
          Add
        </button>
      </div>
    </div>
  );
}
