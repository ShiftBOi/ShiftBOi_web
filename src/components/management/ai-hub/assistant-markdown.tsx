"use client";

import {
  InlineCitation,
  resolvePlatformCitation,
  type CitationSource,
} from "@/components/management/ai-hub/assistant-inline-citation";
import { MentionChip } from "@/components/management/ai-hub/mention-chip";
import { cn } from "cn";
import type { ReactNode } from "react";

/** Small safe markdown subset: paragraphs, lists, tables, bold, links, citations */
export function AssistantMarkdown({
  text,
  className,
  sources,
}: {
  text: string;
  className?: string;
  sources?: CitationSource[];
}) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("cms-ai-md", className)}>
      {blocks.map((b, i) => {
        if (b.type === "code") {
          return (
            <pre key={i} className="cms-ai-md__code">
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.type === "table") {
          return (
            <div key={i} className="cms-ai-md__table-wrap">
              <table className="cms-ai-md__table">
                <thead>
                  <tr>
                    {b.headers.map((h, j) => (
                      <th key={j}>{inline(h, sources)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{inline(cell, sources)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="cms-ai-md__ul">
              {b.items.map((item, j) => (
                <li key={j}>{inline(item, sources)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={i} className="cms-ai-md__ol">
              {b.items.map((item, j) => (
                <li key={j}>{inline(item, sources)}</li>
              ))}
            </ol>
          );
        }
        if (b.type === "h" || b.type === "p") {
          const Tag = b.type === "h" ? "h4" : "p";
          return (
            <Tag
              key={i}
              className={b.type === "h" ? "cms-ai-md__h" : "cms-ai-md__p"}
            >
              {inline(b.text, sources)}
            </Tag>
          );
        }
        return null;
      })}
    </div>
  );
}

function inline(text: string, sources?: CitationSource[]) {
  const parts: ReactNode[] = [];
  const re =
    /(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)|]+|\*\*[^*]+\*\*|`[^`]+`|@[a-z][\w-]*(?::[\w./-]+)?|\b(?:Next\.js|React|Vercel|Groq|TypeScript|Tailwind CSS|shadcn\/ui|Framer Motion|Prisma|GitHub|OpenAI)\b)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("[") && token.includes("](")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <InlineCitation
            key={key++}
            source={{ title: link[1]!, url: link[2]! }}
          />
        );
      } else {
        parts.push(token);
      }
    } else if (/^https?:\/\//i.test(token)) {
      let hostname = token;
      try {
        hostname = new URL(token).hostname.replace(/^www\./, "");
      } catch {
        /* keep */
      }
      parts.push(
        <InlineCitation
          key={key++}
          source={{ title: hostname, url: token, hostname }}
        />
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={key++} className="cms-ai-md__inline">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("@")) {
      const body = token.slice(1);
      const colon = body.indexOf(":");
      const type = colon >= 0 ? body.slice(0, colon) : body;
      const id = colon >= 0 ? body.slice(colon + 1) : undefined;
      parts.push(
        <MentionChip key={key++} type={type} id={id} label={id || type} />
      );
    } else {
      const platform = resolvePlatformCitation(token);
      if (platform) {
        const fromSources = sources?.find(
          (s) =>
            s.title.toLowerCase().includes(token.toLowerCase()) ||
            (s.url && platform.url && s.url.includes(new URL(platform.url).hostname))
        );
        parts.push(
          <InlineCitation
            key={key++}
            source={{
              ...platform,
              snippet: fromSources?.snippet || platform.snippet,
            }}
          />
        );
      } else {
        parts.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

type Block =
  | { type: "p" | "h" | "code"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function isTableRow(line: string) {
  const t = line.trim();
  if (!t.includes("|")) return false;
  // At least two pipes → cells
  return (t.match(/\|/g) || []).length >= 2;
}

function isTableSeparator(line: string) {
  const t = line.trim();
  if (!t.includes("-")) return false;
  // |---|---| or ---|---
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(t);
}

function splitCells(line: string) {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}

/** Recover tables flattened onto one line by grouping cells via the separator row. */
function expandFlatTable(line: string): string[] | null {
  const t = line.trim();
  if (!t.includes("|") || (t.match(/\|/g) || []).length < 5) return null;
  const cells = splitCells(t);
  const sepStart = cells.findIndex((c) => /^:?-{3,}:?$/.test(c));
  if (sepStart < 2) return null;
  let sepEnd = sepStart;
  while (sepEnd < cells.length && /^:?-{3,}:?$/.test(cells[sepEnd] || "")) {
    sepEnd += 1;
  }
  const headers = cells.slice(0, sepStart);
  while (headers.length && headers[headers.length - 1] === "") headers.pop();
  const cols = headers.length;
  if (cols < 2) return null;
  let sepCells = cells.slice(sepStart, sepEnd).filter((c) => c !== "");
  if (sepCells.length !== cols) {
    sepCells = headers.map(() => "---");
  }
  let body = cells.slice(sepEnd);
  while (body[0] === "") body = body.slice(1);
  // Drop empty spacer cells that sit between flattened rows
  const cleaned: string[] = [];
  for (const c of body) {
    if (c === "" && cleaned.length > 0 && cleaned.length % cols === 0) continue;
    cleaned.push(c);
  }
  if (cleaned.length < cols) return null;
  const toLine = (row: string[]) => `| ${row.join(" | ")} |`;
  const rows: string[] = [];
  for (let i = 0; i + cols <= cleaned.length; i += cols) {
    rows.push(toLine(cleaned.slice(i, i + cols)));
  }
  if (!rows.length) return null;
  return [toLine(headers), toLine(sepCells), ...rows];
}

function parseBlocks(src: string): Block[] {
  // Normalize flattened single-line tables into multi-line when possible
  let normalized = src.replace(/\r\n/g, "\n");
  const flatLines = normalized.split("\n");
  const rebuilt: string[] = [];
  for (const line of flatLines) {
    if (
      isTableRow(line) &&
      line.includes("|---") &&
      line.split("|---").length >= 2 &&
      !line.includes("\n")
    ) {
      const expanded = expandFlatTable(line);
      if (expanded && expanded.length >= 2) {
        rebuilt.push(...expanded);
        continue;
      }
    }
    rebuilt.push(line);
  }
  normalized = rebuilt.join("\n");

  const lines = normalized.split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        buf.push(lines[i]!);
        i += 1;
      }
      i += 1;
      out.push({ type: "code", text: buf.join("\n") });
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      out.push({ type: "h", text: line.replace(/^#{1,3}\s+/, "") });
      i += 1;
      continue;
    }
    if (
      /^(key\s*features|features|technology\s*stack|tech\s*stack|stack)\s*:?\s*$/i.test(
        line.trim()
      )
    ) {
      out.push({ type: "h", text: line.trim().replace(/:$/, "") });
      i += 1;
      continue;
    }
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1] || "")
    ) {
      const headers = splitCells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i] || "") && !isTableSeparator(lines[i] || "")) {
        const cells = splitCells(lines[i]!);
        // Pad / trim to header width
        while (cells.length < headers.length) cells.push("");
        rows.push(cells.slice(0, headers.length));
        i += 1;
      }
      out.push({ type: "table", headers, rows });
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i] || "")) {
        items.push((lines[i] || "").replace(/^[-*•]\s+/, ""));
        i += 1;
      }
      out.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] || "")) {
        items.push((lines[i] || "").replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      out.push({ type: "ol", items });
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i]?.trim() &&
      !/^[-*•]\s+/.test(lines[i] || "") &&
      !/^\d+\.\s+/.test(lines[i] || "") &&
      !lines[i]!.startsWith("```") &&
      !/^#{1,3}\s+/.test(lines[i] || "") &&
      !isTableRow(lines[i] || "") &&
      !/^(key\s*features|features|technology\s*stack|tech\s*stack|stack)\s*:?\s*$/i.test(
        (lines[i] || "").trim()
      )
    ) {
      buf.push(lines[i]!);
      i += 1;
    }
    out.push({ type: "p", text: buf.join(" ") });
  }
  return out;
}
