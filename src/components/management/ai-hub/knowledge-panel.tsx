"use client";

import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Source = {
  id: string;
  name: string;
  kind: string;
  status: string;
  chunks: number;
  updatedAt: string;
};

type Hit = {
  id: string;
  sourceName: string;
  location?: string | null;
  text: string;
  similarity: number;
  kind: string;
};

export function KnowledgePanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [note, setNote] = useState("");
  const [view, setView] = useState<"sources" | "retrieval">("sources");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchJson<{
        data?: { sources?: Source[]; chunkCount?: number };
      }>("/api/cms/assistant/knowledge");
      if (ok && data.data) {
        setSources(data.data.sources || []);
        setChunkCount(data.data.chunkCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      await fetchJson("/api/cms/assistant/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      await load();
    } finally {
      setSyncing(false);
    }
  }

  async function runQuery() {
    const q = query.trim();
    if (!q) return;
    const { ok, data } = await fetchJson<{ data?: { results?: Hit[] } }>(
      "/api/cms/assistant/knowledge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "query", query: q }),
      }
    );
    if (ok) setHits(data.data?.results || []);
  }

  async function addNote() {
    const text = note.trim();
    if (!text) return;
    await fetchJson("/api/cms/assistant/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", name: "Manual note", text }),
    });
    setNote("");
    await load();
  }

  return (
    <div className="cms-ai-panel">
      <header className="cms-ai-panel__head">
        <div>
          <p className="cms-eyebrow">Knowledge</p>
          <h2 className="cms-title">Support knowledge base</h2>
          <p className="cms-subtitle">
            {sources.length} sources · {chunkCount} chunks · keyword retrieval
          </p>
        </div>
        <button
          type="button"
          className="cms-btn cms-btn--ghost"
          onClick={() => void sync()}
          disabled={syncing}
        >
          <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          Sync CMS
        </button>
      </header>

      <div className="cms-system__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={cn("cms-system__tab", view === "sources" && "is-active")}
          onClick={() => setView("sources")}
        >
          Sources
        </button>
        <button
          type="button"
          role="tab"
          className={cn("cms-system__tab", view === "retrieval" && "is-active")}
          onClick={() => setView("retrieval")}
        >
          Test retrieval
        </button>
      </div>

      {view === "sources" ? (
        <>
          {loading ? (
            <div className="cms-system__empty">
              <Loader2 className="size-8 animate-spin opacity-40" />
            </div>
          ) : sources.length === 0 ? (
            <div className="cms-system__empty">
              <p>No sources yet — sync CMS content to index projects & about.</p>
            </div>
          ) : (
            <ul className="cms-ai-kb-list">
              {sources.map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong>
                  <span>
                    {s.kind} · {s.chunks} chunks · {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="cms-ai-add">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paste a manual note to index…"
            />
            <button type="button" className="cms-btn" onClick={() => void addNote()}>
              Add note
            </button>
          </div>
        </>
      ) : (
        <div className="cms-ai-retrieve">
          <div className="cms-ai-add">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the knowledge base…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runQuery();
              }}
            />
            <button type="button" className="cms-btn" onClick={() => void runQuery()}>
              <Search className="size-4" /> Search
            </button>
          </div>
          <ul className="cms-ai-kb-hits">
            {hits.map((h) => (
              <li key={h.id}>
                <header>
                  <strong>{h.sourceName}</strong>
                  <span>{Math.round(h.similarity * 100)}% match</span>
                </header>
                <p>{h.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
