"use client";

import { useEffect, useState } from "react";
import { AssistantChat } from "@/components/management/ai-hub/assistant-chat";
import { useCmsChat } from "@/components/cms/chat-context";
import { cn } from "cn";

/** Right-rail CMS assistant — tabs + original chat UI (resize lives in Arc panels). */
export function CmsChatPanel() {
  const {
    open,
    tabs,
    activeId,
    closeChat,
    setActiveId,
    addTab,
    closeTab,
  } = useCmsChat();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (open) setBooted(true);
  }, [open]);

  return (
    <div
      className={cn("cms-chat-panel", "is-embedded", open && "is-open")}
      role="complementary"
      aria-label="CMS Assistant"
    >
      <header className="cms-chat-panel-head">
        <div className="cms-chat-tabs" role="tablist" aria-label="Assistant tabs">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <div
                key={tab.id}
                className={cn("cms-chat-tab", active && "is-active")}
                role="presentation"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="cms-chat-tab-btn"
                  onClick={() => setActiveId(tab.id)}
                  title={tab.title}
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  className="cms-chat-tab-close"
                  aria-label={`Close ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="cms-chat-tab-add"
            onClick={addTab}
            aria-label="New assistant tab"
            title="New tab"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="cms-chat-panel-x"
          onClick={closeChat}
          aria-label="Close assistant panel"
          title="Close panel"
        >
          ×
        </button>
      </header>

      <div className="cms-chat-panel-body">
        {booted
          ? tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "cms-chat-tab-pane",
                  tab.id === activeId && "is-active",
                )}
                hidden={tab.id !== activeId}
                inert={tab.id !== activeId ? true : undefined}
              >
                <AssistantChat compact />
              </div>
            ))
          : null}
      </div>
    </div>
  );
}

/** @deprecated FAB removed — use CmsChatPanel + topbar toggle */
export function CmsQuickChat() {
  return <CmsChatPanel />;
}
