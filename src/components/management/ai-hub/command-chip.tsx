"use client";

import { ToolChip } from "@/components/management/ai-hub/tool-chip";
import type { SlashCommand } from "@/lib/assistant/commands";
import { SLASH_COMMANDS } from "@/lib/assistant/commands";
import { BUILTIN_TOOLS } from "@/lib/assistant/tool-catalog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "cn";
import { Terminal } from "lucide-react";
import type { ReactNode } from "react";

const CMD_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>';

let portalEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function ensurePortal() {
  if (typeof document === "undefined") return null;
  if (portalEl && document.body.contains(portalEl)) return portalEl;
  portalEl = document.createElement("div");
  portalEl.className = "cms-ai-command-portal";
  portalEl.setAttribute("role", "tooltip");
  document.body.appendChild(portalEl);
  return portalEl;
}

let commandAnchor: HTMLElement | null = null;

export function hideCommandPortal() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  commandAnchor = null;
  if (portalEl) {
    portalEl.classList.remove("is-open");
    portalEl.innerHTML = "";
  }
}

export function dismissStaleCommandPortal() {
  if (commandAnchor && !commandAnchor.isConnected) hideCommandPortal();
}

function showCommandPortal(anchor: HTMLElement, cmd: SlashCommand) {
  if (!anchor.isConnected) return;
  const portal = ensurePortal();
  if (!portal) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  commandAnchor = anchor;

  portal.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = cmd.hint;
  portal.appendChild(title);

  if (cmd.fields && cmd.fields.length) {
    const list = document.createElement("ul");
    for (const f of cmd.fields) {
      const li = document.createElement("li");
      const code = document.createElement("code");
      code.textContent = f.name;
      li.appendChild(code);
      li.appendChild(document.createTextNode(` — ${f.hint}`));
      list.appendChild(li);
    }
    portal.appendChild(list);
  } else {
    const p = document.createElement("p");
    p.textContent = "Type your details after this badge.";
    portal.appendChild(p);
  }

  const root = document.querySelector(".cms-root");
  const theme = root?.getAttribute("data-cms-theme") || "light";
  portal.dataset.theme = theme === "dark" ? "dark" : "light";
  portal.classList.add("is-open");

  const rect = anchor.getBoundingClientRect();
  const gap = 8;
  const tipW = Math.min(288, window.innerWidth - 16);
  portal.style.width = `${tipW}px`;
  const tipH = portal.offsetHeight || 160;

  let left = rect.left;
  if (left + tipW > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - tipW - 8);
  }
  let top = rect.top - tipH - gap;
  if (top < 8) {
    top = rect.bottom + gap;
  }
  portal.style.left = `${Math.round(left)}px`;
  portal.style.top = `${Math.round(top)}px`;
}

function bindCommandPortal(el: HTMLElement, cmd: SlashCommand) {
  const show = () => showCommandPortal(el, cmd);
  const scheduleHide = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideCommandPortal, 80);
  };
  el.addEventListener("pointerenter", show);
  el.addEventListener("pointerleave", scheduleHide);
  el.addEventListener("focus", show);
  el.addEventListener("blur", scheduleHide);
}

export function commandBadge(cmd: SlashCommand) {
  return cmd.badge || cmd.label;
}

export function findSlashCommand(
  idOrBadge: string
): SlashCommand | undefined {
  const q = idOrBadge.trim().toLowerCase();
  return SLASH_COMMANDS.find(
    (c) =>
      c.id === q ||
      c.label.toLowerCase() === q ||
      (c.badge || "").toLowerCase() === q
  );
}

/** Expand `/create project …` chips into model-facing prompts + user details. */
export function expandSlashTokens(text: string): string {
  let out = text;
  const ranked = [...SLASH_COMMANDS].sort(
    (a, b) => commandBadge(b).length - commandBadge(a).length
  );
  for (const cmd of ranked) {
    const badge = commandBadge(cmd);
    const escaped = badge.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|\\s)(${escaped})(?=\\s|$)`, "gi");
    out = out.replace(re, (_, pre: string) => {
      const prompt = cmd.prompt.replace(/\s+$/, "");
      return `${pre}${prompt}\n\n`;
    });
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function FieldsList({ cmd }: { cmd: SlashCommand }) {
  if (cmd.fields && cmd.fields.length) {
    return (
      <ul className="cms-ai-command-schema">
        {cmd.fields.map((f) => (
          <li key={f.name}>
            <code>{f.name}</code> — {f.hint}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="cms-ai-command-schema__empty">
      Type your details after this badge.
    </p>
  );
}

/** DOM chip for contenteditable — hover portals field schema above the chat. */
export function createCommandElement(cmd: SlashCommand): HTMLSpanElement {
  const badge = commandBadge(cmd);
  const el = document.createElement("span");
  el.className = `cms-ai-command cms-ai-command--${cmd.group || "ops"} cms-ai-command--inline`;
  el.contentEditable = "false";
  el.dataset.commandId = cmd.id;
  el.dataset.commandBadge = badge;
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", `${badge}: ${cmd.hint}`);
  el.innerHTML = `${CMD_ICON}<span class="cms-ai-command__label"></span>`;
  const labelEl = el.querySelector(".cms-ai-command__label");
  if (labelEl) labelEl.textContent = badge;
  const svg = el.querySelector("svg");
  if (svg) svg.classList.add("cms-ai-command__icon");
  bindCommandPortal(el, cmd);
  return el;
}

export function CommandChip({
  cmd,
  className,
}: {
  cmd: SlashCommand;
  className?: string;
}) {
  const badge = commandBadge(cmd);

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={10}
        closeDelay={80}
        render={
          <span
            className={cn(
              "cms-ai-command",
              `cms-ai-command--${cmd.group || "ops"}`,
              className
            )}
          />
        }
      >
        <Terminal className="cms-ai-command__icon" aria-hidden="true" />
        <span className="cms-ai-command__label">{badge}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        className="cms-ai-command-hovercard"
      >
        <strong className="cms-ai-command-hovercard__title">{cmd.hint}</strong>
        <FieldsList cmd={cmd} />
      </HoverCardContent>
    </HoverCard>
  );
}

/** Render `/commands` + `#tools` tokens in message bubbles as badges. */
export function renderTextWithCommands(
  text: string,
  wrapMentions: (chunk: string) => ReactNode[]
): ReactNode[] {
  const ranked = [...SLASH_COMMANDS].sort(
    (a, b) => commandBadge(b).length - commandBadge(a).length
  );
  const cmdPattern = ranked
    .map((c) =>
      commandBadge(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("|");
  const toolPattern = BUILTIN_TOOLS.map((t) =>
    `#${t.id}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
    .sort((a, b) => b.length - a.length)
    .join("|");
  const pattern = [cmdPattern, toolPattern].filter(Boolean).join("|");
  if (!pattern) return wrapMentions(text);

  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);
  const out: ReactNode[] = [];
  let key = 0;
  for (const part of parts) {
    if (!part) continue;
    const cmd = findSlashCommand(part);
    if (cmd && commandBadge(cmd).toLowerCase() === part.toLowerCase()) {
      out.push(<CommandChip key={`c-${key++}`} cmd={cmd} />);
      continue;
    }
    const toolHit = BUILTIN_TOOLS.find(
      (t) => `#${t.id}`.toLowerCase() === part.toLowerCase()
    );
    if (toolHit) {
      out.push(<ToolChip key={`t-${key++}`} tool={toolHit} />);
      continue;
    }
    out.push(
      ...wrapMentions(part).map((n, i) =>
        typeof n === "string" ? n : <span key={`m-${key++}-${i}`}>{n}</span>
      )
    );
  }
  return out;
}
