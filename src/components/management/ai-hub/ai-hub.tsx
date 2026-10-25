"use client";

import { AiOpsPanel } from "@/components/management/ai-ops-panel";
import { AiSettingsModal } from "@/components/management/ai-hub/ai-settings-modal";
import { AssistantChat } from "@/components/management/ai-hub/assistant-chat";
import { KnowledgePanel } from "@/components/management/ai-hub/knowledge-panel";
import { MemoryPanel } from "@/components/management/ai-hub/memory-panel";
import { OrchestratorPanel } from "@/components/management/ai-hub/orchestrator-panel";
import { ToolsPanel } from "@/components/management/ai-hub/tools-panel";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  BookMarked,
  Brain,
  Layers,
  MessageSquare,
  Network,
  Plug,
  Settings2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type HubPanel =
  | "assistant"
  | "memory"
  | "knowledge"
  | "orchestrator"
  | "tools"
  | "ops";

function panelFromParam(value: string | null): HubPanel {
  if (
    value === "memory" ||
    value === "knowledge" ||
    value === "orchestrator" ||
    value === "tools" ||
    value === "ops" ||
    value === "assistant"
  ) {
    return value;
  }
  if (value === "log" || value === "usage" || value === "audit") return "ops";
  return "assistant";
}

const NAV: { id: HubPanel; label: string; icon: typeof Brain }[] = [
  { id: "assistant", label: "Assistant", icon: MessageSquare },
  { id: "memory", label: "Memory", icon: BookMarked },
  { id: "knowledge", label: "Knowledge", icon: Layers },
  { id: "orchestrator", label: "Orchestrator", icon: Network },
  { id: "tools", label: "Tools", icon: Plug },
  { id: "ops", label: "Ops", icon: Brain },
];

export function AiHub() {
  const searchParams = useSearchParams();
  const [panel, setPanel] = useState<HubPanel>(() =>
    panelFromParam(searchParams.get("tab")),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setPanel(panelFromParam(searchParams.get("tab")));
  }, [searchParams]);

  function select(next: HubPanel) {
    setPanel(next);
    const url = new URL(window.location.href);
    if (next === "assistant") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className={cn("cms-ai-hub", panel === "assistant" && "is-chat")}>
      <header className="cms-ai-bar">
        <div className="cms-ai-bar__brand">
          <span className="cms-ai-bar__mark" aria-hidden="true">
            <Brain className="size-4" />
          </span>
          <div>
            <p className="cms-eyebrow">AI</p>
            <h1 className="cms-ai-bar__title">Assistant</h1>
          </div>
        </div>

        <nav className="cms-ai-bar__nav" aria-label="AI panels">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = panel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cn("cms-ai-bar__link", active && "is-active")}
                aria-current={active ? "page" : undefined}
                onClick={() => select(item.id)}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="cms-ai-bar__end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="size-3.5" />
            Settings
          </Button>
        </div>
      </header>

      <div className="cms-ai-hub__body">
        {panel === "assistant" ? (
          <AssistantChat onOpenSettings={() => setSettingsOpen(true)} />
        ) : null}
        {panel === "memory" ? <MemoryPanel /> : null}
        {panel === "knowledge" ? <KnowledgePanel /> : null}
        {panel === "orchestrator" ? <OrchestratorPanel /> : null}
        {panel === "tools" ? <ToolsPanel /> : null}
        {panel === "ops" ? <AiOpsPanel /> : null}
      </div>

      <AiSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
