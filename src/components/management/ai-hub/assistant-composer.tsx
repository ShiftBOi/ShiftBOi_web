"use client";

import {
  filterSlashCommands,
  getSlashCommand,
  type SlashCommand,
} from "@/lib/assistant/commands";
import { MediaFileTypeBadge } from "@/components/management/media-file-type-badge";
import {
  commandBadge,
  createCommandElement,
  hideCommandPortal,
} from "@/components/management/ai-hub/command-chip";
import {
  createToolElement,
  dismissStaleBadgePortals,
  filterTools,
  hideToolPortal,
  replaceTriggerWithBadge,
  toolBadge,
} from "@/components/management/ai-hub/composer-badges";
import {
  LlmModelIcon,
  type LlmBrandIcon,
} from "@/components/management/ai-hub/llm-model-icon";
import {
  createMentionElement,
  hydrateComposer,
  placeCaretAtEnd,
  serializeComposer,
  textBeforeCaret,
} from "@/components/management/ai-hub/mention-chip";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/arc/dropdown-menu/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { BuiltinToolDef } from "@/lib/assistant/tool-catalog";
import {
  clampMetric,
  type LlmModelMetrics,
} from "@/lib/llm-models";
import { cn } from "cn";
import {
  ArrowUp,
  AtSign,
  Check,
  ChevronDown,
  Hash,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  Terminal,
  Wrench,
  Zap,
  X,
} from "lucide-react";
import type { CSSProperties, MutableRefObject, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type ComposerModelItem = {
  value: string;
  label: string;
  hint?: string;
  icon: LlmBrandIcon;
  metrics: LlmModelMetrics;
  onSelect: () => void;
};

function MetricBars({ value }: { value: number }) {
  const filled = clampMetric(value);
  return (
    <span className="cms-ai-model-bars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={cn("cms-ai-model-bars__seg", i < filled && "is-on")}
          style={{ "--seg": i } as CSSProperties}
        />
      ))}
    </span>
  );
}

/** Case-insensitive substring highlight for mention / slash search. */
function highlightMatch(text: string, needle: string): ReactNode {
  if (!needle || !text) return text;
  const lower = text.toLowerCase();
  const n = needle.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(n, cursor);
    if (idx === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark key={key++} className="cms-ai-composer__hit">
        {text.slice(idx, idx + n.length)}
      </mark>
    );
    cursor = idx + n.length;
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function mentionNeedles(query: string): { typeQ: string; idQ: string } {
  const q = query.trim().toLowerCase();
  if (!q) return { typeQ: "", idQ: "" };
  const colon = q.indexOf(":");
  if (colon < 0) return { typeQ: q, idQ: q };
  return { typeQ: q.slice(0, colon), idQ: q.slice(colon + 1) };
}

export type MentionOption = {
  type: string;
  id?: string;
  label: string;
};

export type ComposerAttachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  text?: string;
  previewUrl?: string;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10_240 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function insertTextAtCaret(root: HTMLElement, text: string) {
  root.focus();
  const sel = window.getSelection();
  if (!sel) return;
  if (!sel.rangeCount || !root.contains(sel.anchorNode)) {
    placeCaretAtEnd(root);
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function AssistantComposer({
  disabled,
  streaming,
  placeholder = "Ask anything — try /help or @project",
  mentions,
  modelLabel,
  modelValue,
  modelItems,
  writeMode = "bypass",
  onWriteModeChange,
  onSend,
  onStop,
  onOpenSettings,
  insertCommandRef,
}: {
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  mentions: MentionOption[];
  modelLabel: string;
  modelValue: string;
  modelItems: ComposerModelItem[];
  writeMode?: "bypass" | "approval";
  onWriteModeChange?: (mode: "bypass" | "approval") => void;
  onSend: (
    text: string,
    selected: MentionOption[],
    attachments: ComposerAttachment[]
  ) => void;
  onStop: () => void;
  onOpenSettings?: () => void;
  /** Parent can insert a slash command badge (e.g. quick cards). */
  insertCommandRef?: MutableRefObject<((commandId: string) => void) | null>;
}) {
  const [value, setValue] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [atOpen, setAtOpen] = useState(false);
  const [hashOpen, setHashOpen] = useState(false);
  const [slashQ, setSlashQ] = useState("");
  const [atQ, setAtQ] = useState("");
  const [hashQ, setHashQ] = useState("");
  const [picked, setPicked] = useState<MentionOption[]>([]);
  const [files, setFiles] = useState<ComposerAttachment[]>([]);
  const [hi, setHi] = useState(0);
  const [empty, setEmpty] = useState(true);
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const slashItems = useMemo(() => filterSlashCommands(slashQ), [slashQ]);
  const toolItems = useMemo(() => filterTools(hashQ), [hashQ]);
  const atItems = useMemo(() => {
    const q = atQ.trim().toLowerCase();
    if (!q) return mentions;
    const colon = q.indexOf(":");
    return mentions.filter((m) => {
      const type = m.type.toLowerCase();
      const id = (m.id || "").toLowerCase();
      const label = m.label.toLowerCase();
      const tag = id ? `${type}:${id}` : type;
      if (colon >= 0) {
        const typeQ = q.slice(0, colon);
        const idQ = q.slice(colon + 1);
        if (typeQ && type !== typeQ && !type.startsWith(typeQ)) return false;
        if (!idQ) return true;
        return id.includes(idQ) || label.includes(idQ) || tag.includes(q);
      }
      return (
        type.includes(q) ||
        id.includes(q) ||
        label.includes(q) ||
        tag.includes(q)
      );
    });
  }, [mentions, atQ]);

  useEffect(() => {
    const el = editor.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(280, Math.max(40, el.scrollHeight))}px`;
  }, [value]);

  useEffect(() => {
    setHi(0);
  }, [slashQ, atQ, hashQ, slashOpen, atOpen, hashOpen]);

  function syncFromEditor() {
    const el = editor.current;
    if (!el) return;
    dismissStaleBadgePortals();
    const { text, mentions: inline } = serializeComposer(el);
    setValue(text);
    setPicked(inline);
    const blank =
      !text.replace(/\u200b/g, "").trim() &&
      !el.querySelector(
        "[data-mention-type], [data-command-id], [data-tool-id]"
      );
    setEmpty(blank);
    el.classList.toggle("is-empty", blank);

    const before = textBeforeCaret(el);
    const at = before.match(/(?:^|\s)@([\w.:/-]*)$/);
    const slash = before.match(/(?:^|\s)\/([\w-]*)$/);
    const hash = before.match(/(?:^|\s)#([\w_]*)$/);
    if (at) {
      setAtOpen(true);
      setSlashOpen(false);
      setHashOpen(false);
      setAtQ(at[1] || "");
      return;
    }
    if (slash) {
      setSlashOpen(true);
      setAtOpen(false);
      setHashOpen(false);
      setSlashQ(slash[1] || "");
      return;
    }
    if (hash) {
      setHashOpen(true);
      setAtOpen(false);
      setSlashOpen(false);
      setHashQ(hash[1] || "");
      return;
    }
    setSlashOpen(false);
    setAtOpen(false);
    setHashOpen(false);
  }

  function catalogWith(extra?: MentionOption) {
    if (!extra) return [...mentions, ...picked];
    const base = [...mentions, ...picked];
    if (base.some((x) => x.type === extra.type && x.id === extra.id)) return base;
    return [...base, extra];
  }

  function insertCommandBadge(cmd: SlashCommand) {
    const el = editor.current;
    if (!el || disabled || streaming) return;
    replaceTriggerWithBadge(el, {
      triggerRe: /\/[\w./-]*$/,
      catalog: catalogWith(),
      create: () => createCommandElement(cmd),
      serialize: serializeComposer,
      textBeforeCaret,
    });
    el.focus();
    syncFromEditor();
    setSlashOpen(false);
  }

  function applySlash(cmd: SlashCommand) {
    insertCommandBadge(cmd);
  }

  function applyTool(tool: BuiltinToolDef) {
    const el = editor.current;
    if (!el || disabled || streaming) return;
    replaceTriggerWithBadge(el, {
      triggerRe: /#[\w_]*$/,
      catalog: catalogWith(),
      create: () => createToolElement(tool),
      serialize: serializeComposer,
      textBeforeCaret,
    });
    el.focus();
    syncFromEditor();
    setHashOpen(false);
  }

  useEffect(() => {
    if (!insertCommandRef) return;
    insertCommandRef.current = (commandId: string) => {
      const cmd = getSlashCommand(commandId);
      if (cmd) insertCommandBadge(cmd);
    };
    return () => {
      insertCommandRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insertCommandRef, disabled, streaming, mentions, picked]);

  function applyAt(m: MentionOption) {
    const el = editor.current;
    if (!el) return;
    replaceTriggerWithBadge(el, {
      triggerRe: /@[\w.:/-]*$/,
      catalog: catalogWith(m),
      create: () =>
        createMentionElement({
          type: m.type,
          id: m.id,
          label: m.label,
        }),
      serialize: serializeComposer,
      textBeforeCaret,
    });
    syncFromEditor();
    setAtOpen(false);
    el.focus();
  }

  function insertTrigger(kind: "/" | "@" | "#") {
    const el = editor.current;
    if (!el || disabled || streaming) return;
    insertTextAtCaret(el, kind);
    syncFromEditor();
  }

  async function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: ComposerAttachment[] = [];
    for (const file of Array.from(list).slice(0, 4)) {
      if (file.size > 8_000_000) continue;
      const mime = file.type || "application/octet-stream";
      const isText =
        mime.startsWith("text/") ||
        /\.(md|txt|json|csv|ts|tsx|js|jsx|mjs|cjs|css|html)$/i.test(file.name);
      const isImage = mime.startsWith("image/");
      let text: string | undefined;
      if (isText) text = (await file.text()).slice(0, 12_000);
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mime,
        text,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      });
    }
    setFiles((prev) => [...prev, ...next].slice(0, 6));
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  useEffect(() => {
    return () => {
      for (const f of files) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
    };
    // Only revoke on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit() {
    const el = editor.current;
    if (!el || disabled || streaming) return;
    const { text, mentions: inline } = serializeComposer(el);
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    // Keep badge form in the thread UI; chat expands tokens before the API call
    onSend(trimmed || "(see attachments)", inline, files);
    for (const f of files) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
    el.replaceChildren();
    hideToolPortal();
    hideCommandPortal();
    setValue("");
    setPicked([]);
    setFiles([]);
    setEmpty(true);
    el.classList.add("is-empty");
    setSlashOpen(false);
    setAtOpen(false);
    setHashOpen(false);
  }

  const menuItems = slashOpen
    ? slashItems
    : atOpen
      ? atItems
      : hashOpen
        ? toolItems
        : [];
  const menuOpen = slashOpen || atOpen || hashOpen;
  const canSend = Boolean(value.trim() || files.length || picked.length);
  const activeModel =
    modelItems.find((item) => item.value === modelValue) ?? modelItems[0];

  return (
    <div className="cms-ai-composer">
      {menuOpen ? (
        <ul className="cms-ai-composer__menu" role="listbox">
          {menuItems.length === 0 ? (
            <li className="cms-ai-composer__menu-empty">No matches</li>
          ) : slashOpen ? (
            slashItems.map((cmd, i) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  className={cn(i === hi && "is-active")}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => applySlash(cmd)}
                >
                  <Terminal className="size-3.5 opacity-50" />
                  <span>
                    <strong>
                      {highlightMatch(commandBadge(cmd), slashQ)}
                    </strong>
                    <em>{cmd.hint}</em>
                  </span>
                </button>
              </li>
            ))
          ) : hashOpen ? (
            toolItems.map((tool, i) => (
              <li key={tool.id}>
                <button
                  type="button"
                  className={cn(i === hi && "is-active")}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => applyTool(tool)}
                >
                  <Wrench className="size-3.5 opacity-50" />
                  <span>
                    <strong>{highlightMatch(toolBadge(tool), hashQ)}</strong>
                    <em>
                      {tool.access} · {tool.description}
                    </em>
                  </span>
                </button>
              </li>
            ))
          ) : (
            atItems.map((m, i) => {
              const { typeQ, idQ } = mentionNeedles(atQ);
              const labelQ = idQ || typeQ;
              return (
                <li key={`${m.type}:${m.id || m.label}`}>
                  <button
                    type="button"
                    className={cn(i === hi && "is-active")}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => applyAt(m)}
                  >
                    <AtSign className="size-3.5 opacity-50" />
                    <span>
                      <strong>
                        @
                        {highlightMatch(m.type, typeQ)}
                        {m.id ? (
                          <>
                            :
                            {highlightMatch(m.id, idQ || typeQ)}
                          </>
                        ) : null}
                      </strong>
                      <em>{highlightMatch(m.label, labelQ)}</em>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <div className="cms-ai-composer__card">
        {files.length > 0 ? (
          <div className="cms-ai-composer__attach">
            {files.map((f) => (
              <div
                key={f.id}
                className={cn("cms-ai-file", f.previewUrl && "is-image")}
              >
                {f.previewUrl ? (
                  <span className="cms-ai-file__thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.previewUrl} alt="" />
                    <MediaFileTypeBadge
                      src={f.name}
                      mimeOrName={f.mime}
                      size="mini"
                      className="cms-media-type-badge--tight"
                    />
                  </span>
                ) : (
                  <span className="cms-ai-file__badge" aria-hidden="true">
                    <MediaFileTypeBadge
                      src={f.name}
                      mimeOrName={f.mime}
                      size="sm"
                    />
                  </span>
                )}
                <span className="cms-ai-file__meta">
                  <strong title={f.name}>{f.name}</strong>
                  <em>{formatBytes(f.size)}</em>
                </span>
                <button
                  type="button"
                  className="cms-ai-file__remove"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => removeFile(f.id)}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="cms-ai-composer__field">
          <div
            ref={editor}
            className={cn("cms-ai-composer__editor", empty && "is-empty")}
            contentEditable={!disabled && !streaming}
            role="textbox"
            aria-multiline="true"
            aria-label="Message"
            data-placeholder={placeholder}
            suppressContentEditableWarning
            onInput={() => syncFromEditor()}
            onKeyUp={() => syncFromEditor()}
            onClick={() => syncFromEditor()}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text/plain");
              if (!pasted) return;
              const el = editor.current;
              if (!el) return;
              // Structured briefs / markdown → pretty hydrate so titles & blurbs read clearly
              if (
                pasted.length > 40 &&
                /(?:^|\n)\s*(?:#{1,3}\s+|Key\s*Features|Technology\s*Stack|\*\*\d+[.)])/i.test(
                  pasted
                )
              ) {
                e.preventDefault();
                const current = serializeComposer(el).text.trim();
                hydrateComposer(
                  el,
                  current ? `${current}\n\n${pasted}` : pasted,
                  mentions
                );
                placeCaretAtEnd(el);
                syncFromEditor();
              }
            }}
            onKeyDown={(e) => {
              if (menuOpen && menuItems.length) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHi((h) => Math.min(menuItems.length - 1, h + 1));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHi((h) => Math.max(0, h - 1));
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  if (slashOpen) applySlash(slashItems[hi]!);
                  else if (hashOpen) applyTool(toolItems[hi]!);
                  else applyAt(atItems[hi]!);
                  return;
                }
                if (e.key === "Escape") {
                  setSlashOpen(false);
                  setAtOpen(false);
                  setHashOpen(false);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape" && streaming) onStop();
            }}
          />
        </div>

        <div className="cms-ai-composer__bar">
          <div className="cms-ai-composer__tools">
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              multiple
              accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.css,.html,text/*,image/*"
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            <button
              type="button"
              className="cms-ai-composer__tool"
              disabled={disabled || streaming}
              onClick={() => fileInput.current?.click()}
              title="Attach"
              aria-label="Attach file"
            >
              <Plus className="size-4" />
            </button>
            <span className="cms-ai-composer__divider" aria-hidden="true" />
            <button
              type="button"
              className="cms-ai-composer__tool"
              disabled={disabled || streaming}
              onClick={() => insertTrigger("/")}
              title="Commands"
              aria-label="Slash commands"
            >
              <Terminal className="size-4" />
            </button>
            <button
              type="button"
              className="cms-ai-composer__tool"
              disabled={disabled || streaming}
              onClick={() => insertTrigger("@")}
              title="Mention"
              aria-label="Mention"
            >
              <AtSign className="size-4" />
            </button>
            <button
              type="button"
              className="cms-ai-composer__tool"
              disabled={disabled || streaming}
              onClick={() => insertTrigger("#")}
              title="Tools"
              aria-label="Tools"
            >
              <Hash className="size-4" />
            </button>
            {onWriteModeChange ? (
              <>
                <span className="cms-ai-composer__divider" aria-hidden="true" />
                <button
                  type="button"
                  className={cn(
                    "cms-ai-composer__mode",
                    writeMode === "bypass" ? "is-bypass" : "is-approval"
                  )}
                  disabled={disabled || streaming}
                  onClick={() =>
                    onWriteModeChange(
                      writeMode === "bypass" ? "approval" : "bypass"
                    )
                  }
                  title={
                    writeMode === "bypass"
                      ? "Bypass — writes run immediately"
                      : "Approval — confirm create/edit first"
                  }
                  aria-label={
                    writeMode === "bypass"
                      ? "Write mode: Bypass"
                      : "Write mode: Approval"
                  }
                >
                  {writeMode === "bypass" ? (
                    <Zap className="size-3.5" />
                  ) : (
                    <ShieldAlert className="size-3.5" />
                  )}
                  <span>{writeMode === "bypass" ? "Bypass" : "Approve"}</span>
                </button>
              </>
            ) : null}
          </div>

          <div className="cms-ai-composer__bar-end">
            {onOpenSettings ? (
              <>
                <button
                  type="button"
                  className="cms-ai-composer__tool"
                  onClick={onOpenSettings}
                  aria-label="Assistant settings"
                  title="Settings"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
                <span
                  className="cms-ai-composer__divider"
                  aria-hidden="true"
                />
              </>
            ) : null}
            <DropdownMenu
              label={modelLabel}
              side="top"
              align="end"
              sideOffset={8}
              disabled={disabled || streaming}
              triggerClassName="cms-ai-composer__model-trigger"
              contentClassName="cms-ai-model-menu"
              onOpenChange={(open) => {
                if (open) {
                  setSlashOpen(false);
                  setAtOpen(false);
                }
              }}
              trigger={
                <>
                  <LlmModelIcon
                    brand={activeModel?.icon}
                    modelId={activeModel?.value}
                    className="size-3.5"
                  />
                  <span className="cms-ai-composer__model-label">
                    {modelLabel}
                  </span>
                  <ChevronDown
                    className="size-3.5 cms-ai-composer__chev"
                    aria-hidden="true"
                  />
                </>
              }
            >
              <div className="cms-ai-model-menu__head" aria-hidden="true">
                <span>Model</span>
                <span className="cms-ai-model-menu__cols">
                  <span>Speed</span>
                  <span>Qual</span>
                  <span>Cost</span>
                </span>
              </div>
              {modelItems.map((item, index) => {
                const selected = item.value === modelValue;
                return (
                  <DropdownMenuItem
                    key={item.value}
                    index={index}
                    className={cn(
                      "cms-ai-model-menu__item",
                      selected && "is-selected"
                    )}
                    onSelect={() => item.onSelect()}
                  >
                    <LlmModelIcon
                      brand={item.icon}
                      modelId={item.value}
                      className="size-4"
                    />
                    <span className="cms-ai-model-menu__copy">
                      <strong>{item.label}</strong>
                      {item.hint ? <em>{item.hint}</em> : null}
                    </span>
                    <span className="cms-ai-model-menu__metrics">
                      <MetricBars value={item.metrics.speed} />
                      <MetricBars value={item.metrics.quality} />
                      <MetricBars value={item.metrics.cost} />
                    </span>
                    <span
                      className="cms-ai-model-menu__check-slot"
                      aria-hidden={!selected}
                    >
                      {selected ? (
                        <Check className="cms-ai-model-menu__check" />
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenu>

            {streaming ? (
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="cms-ai-composer__send is-stop"
                onClick={onStop}
                aria-label="Stop"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon-sm"
                className="cms-ai-composer__send"
                disabled={disabled || !canSend}
                onClick={submit}
                aria-label="Send"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function placeCaretAtSerializedOffset(root: HTMLElement, offset: number) {
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
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.commandBadge || el.dataset.commandId) {
        const tag = el.dataset.commandBadge || "";
        if (remaining <= tag.length) {
          const range = document.createRange();
          range.setStartAfter(el);
          range.collapse(true);
          sel!.removeAllRanges();
          sel!.addRange(range);
          return true;
        }
        remaining -= tag.length;
        return false;
      }
      if (el.dataset.mentionType) {
        const tag = el.dataset.mention || "";
        if (remaining <= tag.length) {
          const range = document.createRange();
          range.setStartAfter(el);
          range.collapse(true);
          sel!.removeAllRanges();
          sel!.addRange(range);
          return true;
        }
        remaining -= tag.length;
        return false;
      }
      if (el.tagName === "BR") {
        if (remaining <= 1) {
          const range = document.createRange();
          range.setStartAfter(el);
          range.collapse(true);
          sel!.removeAllRanges();
          sel!.addRange(range);
          return true;
        }
        remaining -= 1;
        return false;
      }
      for (const child of Array.from(el.childNodes)) {
        if (seek(child)) return true;
      }
    }
    return false;
  }

  for (const child of Array.from(root.childNodes)) {
    if (seek(child)) return;
  }
  placeCaretAtEnd(root);
}
