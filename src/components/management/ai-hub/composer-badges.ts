/**
 * Unified composer badges: @mentions, /commands, #tools.
 * Hydrate/serialize/insert without wiping sibling chips.
 */

import {
  commandBadge,
  createCommandElement,
  dismissStaleCommandPortal,
  findSlashCommand,
  hideCommandPortal,
} from "@/components/management/ai-hub/command-chip";
import { createMentionElement } from "@/components/management/ai-hub/mention-chip";
import { SLASH_COMMANDS } from "@/lib/assistant/commands";
import { BUILTIN_TOOLS, type BuiltinToolDef } from "@/lib/assistant/tool-catalog";

const TOOL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

export function toolBadge(tool: BuiltinToolDef) {
  return `#${tool.id}`;
}

export function findTool(idOrBadge: string): BuiltinToolDef | undefined {
  const q = idOrBadge.trim().replace(/^#/, "").toLowerCase();
  return BUILTIN_TOOLS.find(
    (t) => t.id.toLowerCase() === q || t.name.toLowerCase() === q
  );
}

export function filterTools(query: string): BuiltinToolDef[] {
  const q = query.replace(/^#/, "").trim().toLowerCase();
  if (!q) return BUILTIN_TOOLS;
  return BUILTIN_TOOLS.filter(
    (t) =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.server.includes(q)
  );
}

export function createToolElement(tool: BuiltinToolDef): HTMLSpanElement {
  const badge = toolBadge(tool);
  const el = document.createElement("span");
  el.className = `cms-ai-toolchip cms-ai-toolchip--${tool.access} cms-ai-toolchip--inline`;
  el.contentEditable = "false";
  el.dataset.toolId = tool.id;
  el.dataset.toolBadge = badge;
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", `${badge}: ${tool.description}`);
  el.innerHTML = `${TOOL_ICON}<span class="cms-ai-toolchip__label"></span>`;
  const labelEl = el.querySelector(".cms-ai-toolchip__label");
  if (labelEl) labelEl.textContent = badge;
  const svg = el.querySelector("svg");
  if (svg) svg.classList.add("cms-ai-toolchip__icon");
  bindToolPortal(el, tool);
  return el;
}

let toolPortal: HTMLDivElement | null = null;
let toolHideTimer: ReturnType<typeof setTimeout> | null = null;
let toolAnchor: HTMLElement | null = null;

export function hideToolPortal() {
  if (toolHideTimer) {
    clearTimeout(toolHideTimer);
    toolHideTimer = null;
  }
  toolAnchor = null;
  if (toolPortal) {
    toolPortal.classList.remove("is-open");
    toolPortal.innerHTML = "";
  }
}

function hideToolPortalSoon() {
  if (toolHideTimer) clearTimeout(toolHideTimer);
  toolHideTimer = setTimeout(() => {
    toolHideTimer = null;
    hideToolPortal();
  }, 80);
}

/** Call from composer input — closes tips when badges are deleted without mouseleave. */
export function dismissStaleBadgePortals() {
  if (toolAnchor && !toolAnchor.isConnected) hideToolPortal();
  dismissStaleCommandPortal();
}

function showToolPortal(anchor: HTMLElement, tool: BuiltinToolDef) {
  if (typeof document === "undefined") return;
  if (!anchor.isConnected) return;
  if (toolHideTimer) {
    clearTimeout(toolHideTimer);
    toolHideTimer = null;
  }
  toolAnchor = anchor;
  if (!toolPortal || !document.body.contains(toolPortal)) {
    toolPortal = document.createElement("div");
    toolPortal.className = "cms-ai-command-portal";
    toolPortal.setAttribute("role", "tooltip");
    document.body.appendChild(toolPortal);
  }
  const root = document.querySelector(".cms-root");
  toolPortal.dataset.theme =
    root?.getAttribute("data-cms-theme") === "dark" ? "dark" : "light";
  toolPortal.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = tool.name;
  toolPortal.appendChild(title);
  const meta = document.createElement("p");
  meta.textContent = `${tool.server} · ${tool.access}`;
  toolPortal.appendChild(meta);
  const desc = document.createElement("p");
  desc.textContent = tool.description;
  toolPortal.appendChild(desc);
  toolPortal.classList.add("is-open");

  const rect = anchor.getBoundingClientRect();
  const tipW = Math.min(300, window.innerWidth - 16);
  toolPortal.style.width = `${tipW}px`;
  const tipH = toolPortal.offsetHeight || 120;
  let left = rect.left;
  if (left + tipW > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - tipW - 8);
  }
  let top = rect.top - tipH - 8;
  if (top < 8) top = rect.bottom + 8;
  toolPortal.style.left = `${Math.round(left)}px`;
  toolPortal.style.top = `${Math.round(top)}px`;
}

function bindToolPortal(el: HTMLElement, tool: BuiltinToolDef) {
  const show = () => showToolPortal(el, tool);
  const scheduleHide = () => hideToolPortalSoon();
  el.addEventListener("pointerenter", show);
  el.addEventListener("pointerleave", scheduleHide);
  el.addEventListener("focus", show);
  el.addEventListener("blur", scheduleHide);
}

/** Expand #tool_id badges into model instructions. */
export function expandToolTokens(text: string): string {
  let out = text;
  const ranked = [...BUILTIN_TOOLS].sort((a, b) => b.id.length - a.id.length);
  for (const tool of ranked) {
    const badge = toolBadge(tool);
    const escaped = badge.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|\\s)(${escaped})(?=\\s|$)`, "gi");
    out = out.replace(re, (_, pre: string) => {
      return `${pre}Use the \`${tool.id}\` tool (${tool.description}). `;
    });
  }
  return out;
}

/**
 * Tokenize composer text into text / mention / command / tool pieces
 * and rebuild the DOM with badges. Preserves many chips of each type.
 */
export function hydrateAllBadges(
  root: HTMLElement,
  text: string,
  catalog: Array<{ type: string; id?: string; label: string }>
) {
  // Badges get destroyed without mouseleave — close floating tips now
  hideToolPortal();
  hideCommandPortal();
  root.replaceChildren();
  const frag = document.createDocumentFragment();

  // Build alternation of command badges (longest first), tools, mentions
  const cmdAlts = [...SLASH_COMMANDS]
    .map((c) => commandBadge(c))
    .sort((a, b) => b.length - a.length)
    .map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const toolAlts = BUILTIN_TOOLS.map((t) =>
    toolBadge(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).sort((a, b) => b.length - a.length);

  const parts: string[] = [];
  if (cmdAlts.length) parts.push(`(?:${cmdAlts.join("|")})`);
  if (toolAlts.length) parts.push(`(?:${toolAlts.join("|")})`);
  parts.push(`@[a-z][\\w-]*(?::[\\w./-]+)?`);

  const re = new RegExp(`(${parts.join("|")})`, "gi");
  const chunks = text.split(re);

  for (const chunk of chunks) {
    if (!chunk) continue;

    const cmd = findSlashCommand(chunk);
    if (cmd && commandBadge(cmd).toLowerCase() === chunk.toLowerCase()) {
      frag.appendChild(createCommandElement(cmd));
      continue;
    }

    const tool = findTool(chunk);
    if (tool && toolBadge(tool).toLowerCase() === chunk.toLowerCase()) {
      frag.appendChild(createToolElement(tool));
      continue;
    }

    const mention = chunk.match(/^@([a-z][\w-]*)(?::([\w./-]+))?$/i);
    if (mention) {
      const type = mention[1] || "mention";
      const id = mention[2];
      const hit = catalog.find((c) => {
        if (c.type.toLowerCase() !== type.toLowerCase()) return false;
        if (id) return (c.id || "").toLowerCase() === id.toLowerCase();
        return !c.id;
      });
      frag.appendChild(
        createMentionElement({
          type,
          id,
          label: hit?.label || id || type,
        })
      );
      continue;
    }

    frag.appendChild(document.createTextNode(chunk));
  }

  if (!frag.childNodes.length) {
    frag.appendChild(document.createTextNode(""));
  }
  root.appendChild(frag);
}

/** Insert a badge (or any node) at the caret inside the contenteditable. */
export function insertNodeAtCaret(root: HTMLElement, node: Node) {
  root.focus();
  const sel = window.getSelection();
  if (!sel) {
    root.appendChild(node);
    root.appendChild(document.createTextNode("\u00a0"));
    return;
  }
  if (!sel.rangeCount || !root.contains(sel.anchorNode)) {
    // Caret not in editor — append
    root.appendChild(node);
    const spacer = document.createTextNode("\u00a0");
    root.appendChild(spacer);
    const range = document.createRange();
    range.setStart(spacer, spacer.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  const range = sel.getRangeAt(0);
  range.deleteContents();

  // If caret is inside a text node mid-badge-query, trim the trigger token left of caret
  // (caller usually already cleaned via serialize path)

  range.insertNode(node);
  const spacer = document.createTextNode("\u00a0");
  if (node.parentNode) {
    if (node.nextSibling) {
      node.parentNode.insertBefore(spacer, node.nextSibling);
    } else {
      node.parentNode.appendChild(spacer);
    }
  }
  range.setStart(spacer, spacer.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Replace a trailing trigger (`/…`, `@…`, `#…`) before the caret with a badge,
 * keeping all other chips intact via serialize → hydrateAllBadges.
 */
export function replaceTriggerWithBadge(
  root: HTMLElement,
  opts: {
    triggerRe: RegExp;
    catalog: Array<{ type: string; id?: string; label: string }>;
    create: () => HTMLElement;
    serialize: (root: HTMLElement) => {
      text: string;
      mentions: Array<{ type: string; id?: string; label: string }>;
    };
    textBeforeCaret: (root: HTMLElement) => string;
  }
) {
  const before = opts.textBeforeCaret(root);
  const full = opts.serialize(root).text;
  const after = full.slice(before.length);
  const cleaned = before.replace(opts.triggerRe, "").replace(/\s+$/, "");
  const badgeNode = opts.create();
  // Temporary marker — we hydrate from text, so insert badge token into text
  const token =
    badgeNode.dataset.commandBadge ||
    badgeNode.dataset.toolBadge ||
    (badgeNode.dataset.mentionType
      ? badgeNode.dataset.mentionId
        ? `@${badgeNode.dataset.mentionType}:${badgeNode.dataset.mentionId}`
        : `@${badgeNode.dataset.mentionType}`
      : "");

  const next = `${cleaned}${cleaned ? " " : ""}${token}\u00a0${after.replace(/^\s+/, "")}`;
  const catalog = opts.catalog;
  // Merge mention from badge if needed
  if (badgeNode.dataset.mentionType) {
    const m = {
      type: badgeNode.dataset.mentionType,
      id: badgeNode.dataset.mentionId,
      label: badgeNode.dataset.mentionLabel || badgeNode.dataset.mentionId || badgeNode.dataset.mentionType,
    };
    if (
      !catalog.some(
        (c) => c.type === m.type && (c.id || "") === (m.id || "")
      )
    ) {
      catalog.push(m);
    }
  }
  hydrateAllBadges(root, next, catalog);

  // Place caret after the inserted badge (after token + nbsp)
  const target = (cleaned ? cleaned.length + 1 : 0) + token.length + 1;
  placeCaretAtBadgeOffset(root, target);
}

function placeCaretAtBadgeOffset(root: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = offset;

  function seek(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || "").length;
      if (remaining <= len) {
        const range = document.createRange();
        range.setStart(node, Math.max(0, remaining));
        range.collapse(true);
        sel!.removeAllRanges();
        sel!.addRange(range);
        return true;
      }
      remaining -= len;
      return false;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const el = node as HTMLElement;
    const token =
      el.dataset.commandBadge ||
      el.dataset.toolBadge ||
      el.dataset.mention ||
      "";
    if (token) {
      if (remaining <= token.length) {
        const range = document.createRange();
        range.setStartAfter(el);
        range.collapse(true);
        sel!.removeAllRanges();
        sel!.addRange(range);
        return true;
      }
      remaining -= token.length;
      return false;
    }
    for (const child of Array.from(el.childNodes)) {
      if (seek(child)) return true;
    }
    return false;
  }

  for (const child of Array.from(root.childNodes)) {
    if (seek(child)) return;
  }
  // fallback end
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
