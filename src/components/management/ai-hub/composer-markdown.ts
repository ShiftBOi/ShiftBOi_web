/** Markdown-aware hydrate/serialize for the CMS assistant composer. */

import {
  commandBadge,
  createCommandElement,
  findSlashCommand,
} from "@/components/management/ai-hub/command-chip";
import {
  createToolElement,
  findTool,
  toolBadge,
} from "@/components/management/ai-hub/composer-badges";
import { SLASH_COMMANDS } from "@/lib/assistant/commands";
import { BUILTIN_TOOLS } from "@/lib/assistant/tool-catalog";

export function looksLikeComposerMarkdown(text: string) {
  return /(?:^|\n)\s*(?:#{1,3}\s+\S|\*\*[^*\n]+\*\*|\d+[.)]\s+\S|[-*•]\s+\S)/.test(
    text
  );
}

function badgeAlternation(): string {
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
  parts.push(`\\*\\*[^*]+\\*\\*`);
  return parts.join("|");
}

function appendInline(
  parent: HTMLElement,
  text: string,
  catalog: Array<{ type: string; id?: string; label: string }>,
  createMention: (m: {
    type: string;
    id?: string;
    label: string;
  }) => HTMLSpanElement
) {
  const re = new RegExp(`(${badgeAlternation()})`, "gi");
  const chunks = text.split(re);
  for (const chunk of chunks) {
    if (!chunk) continue;

    const cmd = findSlashCommand(chunk);
    if (cmd && commandBadge(cmd).toLowerCase() === chunk.toLowerCase()) {
      parent.appendChild(createCommandElement(cmd));
      continue;
    }

    const tool = findTool(chunk);
    if (tool && toolBadge(tool).toLowerCase() === chunk.toLowerCase()) {
      parent.appendChild(createToolElement(tool));
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
      parent.appendChild(
        createMention({
          type,
          id,
          label: hit?.label || id || type,
        })
      );
      continue;
    }

    const bold = chunk.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      const strong = document.createElement("strong");
      strong.appendChild(document.createTextNode(bold[1] || ""));
      parent.appendChild(strong);
      continue;
    }

    parent.appendChild(document.createTextNode(chunk));
  }
}

/**
 * Render markdown-ish text into the contenteditable with visible structure
 * (headings, bold, lists) while keeping a lossless path back via serialize.
 */
export function hydrateComposerMarkdown(
  root: HTMLElement,
  text: string,
  catalog: Array<{ type: string; id?: string; label: string }>,
  createMention: (m: {
    type: string;
    id?: string;
    label: string;
  }) => HTMLSpanElement
) {
  root.replaceChildren();
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const frag = document.createDocumentFragment();

  for (const line of lines) {
    const div = document.createElement("div");
    div.className = "cms-ai-composer__md-line";

    if (!line.trim()) {
      div.dataset.md = "blank";
      div.appendChild(document.createElement("br"));
      frag.appendChild(div);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1]!.length;
      div.dataset.md = `h${level}`;
      div.classList.add(`cms-ai-composer__md-h${level}`);
      appendInline(div, heading[2]!, catalog, createMention);
      frag.appendChild(div);
      continue;
    }

    const li = line.match(/^([-*•]|\d+[.)])\s+(.+)$/);
    if (li) {
      div.dataset.md = "li";
      div.dataset.mdMarker = li[1]!;
      div.classList.add("cms-ai-composer__md-li");
      appendInline(div, li[2]!, catalog, createMention);
      frag.appendChild(div);
      continue;
    }

    div.dataset.md = "p";
    appendInline(div, line, catalog, createMention);
    frag.appendChild(div);
  }

  if (!frag.childNodes.length) {
    frag.appendChild(document.createTextNode(""));
  }
  root.appendChild(frag);
}

/** Serialize structured composer DOM back to markdown (+ @mentions). */
export function serializeComposerMarkdown(root: HTMLElement): {
  text: string;
  mentions: Array<{ type: string; id?: string; label: string }>;
} {
  const mentions: Array<{ type: string; id?: string; label: string }> = [];
  const lines: string[] = [];

  function inlineOf(el: HTMLElement): string {
    let out = "";
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.textContent || "";
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const child = node as HTMLElement;
      if (child.dataset.commandBadge || child.dataset.commandId) {
        out += child.dataset.commandBadge || child.dataset.commandId || "";
        continue;
      }
      if (child.dataset.toolBadge || child.dataset.toolId) {
        out += child.dataset.toolBadge || `#${child.dataset.toolId}`;
        continue;
      }
      if (child.dataset.mentionType) {
        const type = child.dataset.mentionType;
        const id = child.dataset.mentionId;
        const label = child.dataset.mentionLabel || id || type;
        out += id ? `@${type}:${id}` : `@${type}`;
        mentions.push({ type, id, label });
        continue;
      }
      if (child.tagName === "BR") continue;
      if (child.tagName === "STRONG" || child.tagName === "B") {
        out += `**${inlineOf(child)}**`;
        continue;
      }
      out += inlineOf(child);
    }
    return out;
  }

  const blocks = Array.from(root.childNodes);
  // Flat text-only root (no md lines) — fall back to simple walk
  const hasMd = blocks.some(
    (n) =>
      n.nodeType === Node.ELEMENT_NODE &&
      Boolean((n as HTMLElement).dataset.md)
  );

  if (!hasMd) {
    let text = "";
    function walk(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      if (el.dataset.commandBadge || el.dataset.commandId) {
        text += el.dataset.commandBadge || el.dataset.commandId || "";
        return;
      }
      if (el.dataset.toolBadge || el.dataset.toolId) {
        text += el.dataset.toolBadge || `#${el.dataset.toolId}`;
        return;
      }
      if (el.dataset.mentionType) {
        const type = el.dataset.mentionType;
        const id = el.dataset.mentionId;
        const label = el.dataset.mentionLabel || id || type;
        text += id ? `@${type}:${id}` : `@${type}`;
        mentions.push({ type, id, label });
        return;
      }
      if (el.tagName === "BR") {
        text += "\n";
        return;
      }
      if (el.tagName === "STRONG" || el.tagName === "B") {
        text += `**${Array.from(el.childNodes).map((c) => (c.textContent || "")).join("")}**`;
        return;
      }
      if (el.tagName === "DIV" || el.tagName === "P") {
        if (text && !text.endsWith("\n")) text += "\n";
      }
      for (const child of Array.from(el.childNodes)) walk(child);
    }
    for (const child of blocks) walk(child);
    return { text, mentions };
  }

  for (const node of blocks) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || "").replace(/\u200b/g, "");
      if (t) lines.push(t);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const kind = el.dataset.md || "p";
    const inline = inlineOf(el);
    if (kind === "blank") {
      lines.push("");
      continue;
    }
    if (kind === "h1") {
      lines.push(`# ${inline}`);
      continue;
    }
    if (kind === "h2") {
      lines.push(`## ${inline}`);
      continue;
    }
    if (kind === "h3") {
      lines.push(`### ${inline}`);
      continue;
    }
    if (kind === "li") {
      const marker = el.dataset.mdMarker || "-";
      lines.push(`${marker} ${inline}`);
      continue;
    }
    lines.push(inline);
  }

  return { text: lines.join("\n"), mentions };
}
