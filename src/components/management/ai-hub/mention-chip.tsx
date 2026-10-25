"use client";

import { hydrateAllBadges } from "@/components/management/ai-hub/composer-badges";
import {
  hydrateComposerMarkdown,
  looksLikeComposerMarkdown,
  serializeComposerMarkdown,
} from "@/components/management/ai-hub/composer-markdown";
import { cn } from "cn";
import {
  FolderKanban,
  Inbox,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type MentionTone =
  | "project"
  | "about"
  | "inquiries"
  | "activities"
  | "default";

const MENTION_META: Record<
  MentionTone,
  { icon: LucideIcon; label: string }
> = {
  project: { icon: FolderKanban, label: "Project" },
  about: { icon: UserRound, label: "About" },
  inquiries: { icon: Inbox, label: "Inbox" },
  activities: { icon: FolderKanban, label: "Activities" },
  default: { icon: FolderKanban, label: "Mention" },
};

export function mentionTone(type: string): MentionTone {
  const t = type.toLowerCase();
  if (t === "project" || t === "projects") return "project";
  if (t === "about") return "about";
  if (t === "inquiries" || t === "inquiry" || t === "inbox") return "inquiries";
  if (t === "activities" || t === "activity") return "activities";
  return "default";
}

export function MentionChip({
  type,
  id,
  label,
  onRemove,
  className,
}: {
  type: string;
  id?: string;
  label?: string;
  onRemove?: () => void;
  className?: string;
}) {
  const tone = mentionTone(type);
  const meta = MENTION_META[tone];
  const Icon = meta.icon;
  const title = `@${type}${id ? `:${id}` : ""}`;
  const display = label || id || meta.label;

  return (
    <span
      className={cn(
        "cms-ai-mention",
        `cms-ai-mention--${tone}`,
        onRemove && "is-removable",
        className
      )}
      title={title}
    >
      <Icon className="cms-ai-mention__icon" aria-hidden="true" />
      <span className="cms-ai-mention__label">{display}</span>
      {onRemove ? (
        <button
          type="button"
          className="cms-ai-mention__remove"
          aria-label={`Remove ${title}`}
          onClick={onRemove}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

const ICON_SVG: Record<MentionTone, string> = {
  project:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  about:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 21a6 6 0 0 0-12 0"/><circle cx="12" cy="8" r="4"/></svg>',
  inquiries:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  activities:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
  default:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/></svg>',
};

/** DOM chip for contenteditable composers (inline in the sentence). */
export function createMentionElement(m: {
  type: string;
  id?: string;
  label: string;
}): HTMLSpanElement {
  const tone = mentionTone(m.type);
  const tag = m.id ? `@${m.type}:${m.id}` : `@${m.type}`;
  const el = document.createElement("span");
  el.className = `cms-ai-mention cms-ai-mention--${tone} cms-ai-mention--inline`;
  el.contentEditable = "false";
  el.dataset.mentionType = m.type;
  if (m.id) el.dataset.mentionId = m.id;
  el.dataset.mentionLabel = m.label;
  el.dataset.mention = tag;
  el.title = tag;
  el.innerHTML = `${ICON_SVG[tone]}<span class="cms-ai-mention__label"></span>`;
  const labelEl = el.querySelector(".cms-ai-mention__label");
  if (labelEl) labelEl.textContent = m.label || m.id || m.type;
  const svg = el.querySelector("svg");
  if (svg) svg.classList.add("cms-ai-mention__icon");
  return el;
}

export function serializeComposer(root: HTMLElement): {
  text: string;
  mentions: Array<{ type: string; id?: string; label: string }>;
} {
  return serializeComposerMarkdown(root);
}

export function textBeforeCaret(root: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !root.contains(sel.anchorNode)) {
    return serializeComposer(root).text;
  }
  const range = sel.getRangeAt(0).cloneRange();
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  const holder = document.createElement("div");
  holder.appendChild(pre.cloneContents());
  return serializeComposer(holder).text;
}

export function hydrateComposer(
  root: HTMLElement,
  text: string,
  catalog: Array<{ type: string; id?: string; label: string }>
) {
  if (looksLikeComposerMarkdown(text)) {
    hydrateComposerMarkdown(root, text, catalog, createMentionElement);
    return;
  }
  hydrateAllBadges(root, text, catalog);
}

export function placeCaretAtEnd(root: HTMLElement) {
  root.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Parse @type or @type:id tokens from plain text into chips + text. */
export function renderTextWithMentions(
  text: string,
  catalog?: Array<{ type: string; id?: string; label: string }>
): ReactNode[] {
  const re = /@([a-z][\w-]*)(?::([\w./-]+))?/gi;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const type = m[1] || "mention";
    const id = m[2];
    const hit = catalog?.find((c) => {
      if (c.type.toLowerCase() !== type.toLowerCase()) return false;
      if (id) return (c.id || "").toLowerCase() === id.toLowerCase();
      return !c.id;
    });
    nodes.push(
      <MentionChip
        key={`m-${key++}`}
        type={type}
        id={id}
        label={hit?.label || id || type}
      />
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
