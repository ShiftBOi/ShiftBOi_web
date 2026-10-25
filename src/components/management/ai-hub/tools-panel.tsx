"use client";

import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import { ChevronDown, Loader2, Plug } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Tool = {
  id: string;
  name: string;
  description: string;
  access: "read" | "write";
  tokens: number;
  enabled: boolean;
};

type Server = {
  id: string;
  name: string;
  transport: string;
  status: string;
  tools: Tool[];
  toolsOn: number;
  toolsTotal: number;
  tokens: number;
};

export function ToolsPanel() {
  const [servers, setServers] = useState<Server[]>([]);
  const [budget, setBudget] = useState(8000);
  const [tokens, setTokens] = useState(0);
  const [toolsOn, setToolsOn] = useState(0);
  const [toolsTotal, setToolsTotal] = useState(0);
  const [open, setOpen] = useState<string | null>("content");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchJson<{
        data?: {
          servers?: Server[];
          budget?: number;
          tokens?: number;
          toolsOn?: number;
          toolsTotal?: number;
        };
      }>("/api/cms/assistant/tools");
      if (ok && data.data) {
        setServers(data.data.servers || []);
        setBudget(data.data.budget || 8000);
        setTokens(data.data.tokens || 0);
        setToolsOn(data.data.toolsOn || 0);
        setToolsTotal(data.data.toolsTotal || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(toolId: string, enabled: boolean) {
    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        tools: s.tools.map((t) =>
          t.id === toolId ? { ...t, enabled } : t
        ),
      }))
    );
    await fetchJson("/api/cms/assistant/tools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId, enabled }),
    });
    await load();
  }

  const pct = Math.min(100, Math.round((tokens / budget) * 100));

  return (
    <div className="cms-ai-panel">
      <header className="cms-ai-panel__head">
        <div>
          <p className="cms-eyebrow">Tools</p>
          <h2 className="cms-title">ShiftBOi platform tools</h2>
          <p className="cms-subtitle">
            Built-in servers for projects, inquiries, knowledge, and memory —
            toggle what the assistant may call.
          </p>
        </div>
      </header>

      <div className="cms-ai-tools-meter">
        <div>
          <strong>
            {toolsOn} tools · {(tokens / 1000).toFixed(1)}k tokens of context
          </strong>
          <span>{(budget / 1000).toFixed(0)}k budget</span>
        </div>
        <div className={cn("cms-ai-meter__bar", pct > 100 && "is-warn")}>
          <i style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="cms-system__empty">
          <Loader2 className="size-8 animate-spin opacity-40" />
        </div>
      ) : (
        <ul className="cms-ai-servers">
          {servers.map((s) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} className={cn(isOpen && "is-open")}>
                <button
                  type="button"
                  className="cms-ai-servers__row"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : s.id)}
                >
                  <Plug className="size-4 opacity-60" />
                  <span>
                    <strong>{s.name}</strong>
                    <em>
                      Connected · Builtin · {s.toolsOn} of {s.toolsTotal} tools ·{" "}
                      {(s.tokens / 1000).toFixed(1)}k tokens
                    </em>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 opacity-40 transition",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen ? (
                  <ul className="cms-ai-servers__tools">
                    {s.tools.map((t) => (
                      <li key={t.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={t.enabled}
                            onChange={(e) =>
                              void toggle(t.id, e.target.checked)
                            }
                          />
                          <span>
                            <strong>{t.name}</strong>
                            <em>
                              {t.access} · {t.tokens} tok — {t.description}
                            </em>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
