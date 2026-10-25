"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumberField } from "@/components/arc/number-field/number-field";
import { BUILTIN_TOOLS, TOOL_SERVERS } from "@/lib/assistant/tool-catalog";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import { Settings2, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Settings = {
  savedMemories: boolean;
  chatHistory: boolean;
  knowledgeOn: boolean;
  knowledgeTopK: number;
  disabledToolIds: string[];
};

type Tab = "general" | "tools";

const NAV: { id: Tab; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "tools", label: "Tools", icon: Wrench },
];

export function AiSettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<Settings>({
    savedMemories: true,
    chatHistory: true,
    knowledgeOn: true,
    knowledgeTopK: 4,
    disabledToolIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      data?: {
        settings?: {
          savedMemories?: boolean;
          chatHistory?: boolean;
          knowledgeOn?: boolean;
          knowledgeTopK?: number;
          disabledToolIds?: string[];
        };
      };
    }>("/api/cms/assistant/memory");
    if (!ok || !data.data?.settings) return;
    const s = data.data.settings;
    setSettings({
      savedMemories: s.savedMemories !== false,
      chatHistory: s.chatHistory !== false,
      knowledgeOn: s.knowledgeOn !== false,
      knowledgeTopK: s.knowledgeTopK ?? 4,
      disabledToolIds: Array.isArray(s.disabledToolIds)
        ? s.disabledToolIds
        : [],
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTab("general");
      void load();
    }
  }, [open, load]);

  async function patch(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    setSaving(true);
    try {
      await fetchJson("/api/cms/assistant/memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            savedMemories: next.savedMemories,
            chatHistory: next.chatHistory,
            knowledgeOn: next.knowledgeOn,
            knowledgeTopK: next.knowledgeTopK,
            disabledToolIds: next.disabledToolIds,
          },
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  const disabled = useMemo(
    () => new Set(settings.disabledToolIds),
    [settings.disabledToolIds]
  );

  function toggleTool(id: string, enabled: boolean) {
    const next = new Set(settings.disabledToolIds);
    if (enabled) next.delete(id);
    else next.add(id);
    void patch({ disabledToolIds: [...next] });
  }

  const paneTitle = tab === "general" ? "General" : "Tools";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="cms-profile-dialog gap-0 overflow-hidden p-0"
        data-hq-scroll-thumb="off"
      >
        <div className="cms-profile" data-hq-scroll-thumb="off">
          <nav
            className="cms-profile__nav"
            aria-label="Assistant settings"
            data-hq-scroll-thumb="off"
          >
            <div className="cms-profile__nav-head">
              <DialogTitle className="cms-profile__nav-title">
                Assistant
              </DialogTitle>
              <DialogDescription className="cms-profile__nav-desc">
                Chat context &amp; tools
                {saving ? " · Saving…" : loaded ? "" : " · Loading…"}
              </DialogDescription>
            </div>
            <div className="cms-profile__nav-section">
              <p className="cms-profile__nav-label">Settings</p>
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "cms-profile__nav-item",
                    tab === id && "is-active"
                  )}
                  onClick={() => setTab(id)}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="cms-profile__pane">
            <h3 className="cms-settings-pane__title">{paneTitle}</h3>

            {tab === "general" ? (
              <div className="cms-settings-pane">
                <div
                  className="cms-settings-pane__body"
                  data-hq-scroll-thumb="off"
                >
                  <div className="cms-settings-list">
                    <SwitchRow
                      title="Remember preferences"
                      description="Keep short facts you ask it to remember"
                      checked={settings.savedMemories}
                      onCheckedChange={(on) =>
                        void patch({ savedMemories: on })
                      }
                    />
                    <SwitchRow
                      title="Thread context"
                      description="Include earlier messages in this chat"
                      checked={settings.chatHistory}
                      onCheckedChange={(on) =>
                        void patch({ chatHistory: on })
                      }
                    />
                    <SwitchRow
                      title="CMS context snippets"
                      description="Auto-pull matching site content into replies"
                      checked={settings.knowledgeOn}
                      onCheckedChange={(on) =>
                        void patch({ knowledgeOn: on })
                      }
                    />
                    {settings.knowledgeOn ? (
                      <div className="cms-settings-row">
                        <div className="cms-settings-row__copy">
                          <p className="cms-settings-row__label">
                            Snippet count
                          </p>
                          <p className="cms-settings-row__hint">
                            How many CMS snippets to attach (1–12)
                          </p>
                        </div>
                        <div className="cms-settings-row__control cms-ai-settings__number">
                          <NumberField
                            label="Snippet count"
                            size="sm"
                            min={1}
                            max={12}
                            step={1}
                            value={settings.knowledgeTopK}
                            onValueChange={(n) =>
                              void patch({ knowledgeTopK: n })
                            }
                            limitHint={false}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="cms-settings-pane__footer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="cms-settings-pane">
                <div
                  className="cms-settings-pane__body"
                  data-hq-scroll-thumb="off"
                >
                  <p className="cms-profile__pane-hint">
                    Turn tools off to keep the assistant from calling them.
                  </p>
                  <div className="cms-ai-settings__tools">
                    {TOOL_SERVERS.map((server) => {
                      const tools = BUILTIN_TOOLS.filter(
                        (t) => t.server === server.id
                      );
                      if (!tools.length) return null;
                      return (
                        <div
                          key={server.id}
                          className="cms-ai-settings__server"
                        >
                          <p className="cms-profile__nav-label">
                            {server.name}
                          </p>
                          <div className="cms-settings-list">
                            {tools.map((tool) => (
                              <SwitchRow
                                key={tool.id}
                                title={tool.name}
                                description={tool.description}
                                checked={!disabled.has(tool.id)}
                                onCheckedChange={(on) =>
                                  toggleTool(tool.id, on)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="cms-settings-pane__footer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <div className="cms-settings-row">
      <div className="cms-settings-row__copy">
        <p className="cms-settings-row__label">{title}</p>
        <p className="cms-settings-row__hint">{description}</p>
      </div>
      <div className="cms-settings-row__control">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          className={cn("cms-settings-switch", checked && "is-on")}
          onClick={() => onCheckedChange(!checked)}
        >
          <span className="cms-settings-switch__thumb" />
        </button>
      </div>
    </div>
  );
}
