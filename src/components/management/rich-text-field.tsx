"use client";

import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Type,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

/**
 * Normalize contentEditable HTML for equality checks.
 * Focus/blur often injects `<br>` / empty `<div>` without a real edit.
 */
export function normalizeCmsHtml(html: string | undefined | null): string {
  if (!html) return "";
  const plain = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200B/g, "")
    .replace(/\n+/g, "\n")
    .trim();
  return plain;
}

export function isEmptyCmsHtml(html: string | undefined | null) {
  return normalizeCmsHtml(html) === "";
}

/**
 * CMS rich-text field — glass toolbar + contentEditable.
 * Adapted from ttianqii-web AboutContentEditor, styled for this CMS.
 */
export function RichTextField({
  value,
  onChange,
  placeholder = "Write here…",
  className,
  minHeight = 48,
  tone = "light",
  variant = "default",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  /** `dark` for case-study canvas */
  tone?: "light" | "dark";
  /** `mail` = always-visible bottom toolbar for compose */
  variant?: "default" | "mail";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const [empty, setEmpty] = useState(() => isEmptyCmsHtml(value));
  const [active, setActive] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (focused.current) return;
    if (el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
    setEmpty(isEmptyCmsHtml(value));
  }, [value]);

  useEffect(() => {
    if (!active) return;
    const bump = () => setTick((t) => t + 1);
    document.addEventListener("selectionchange", bump);
    return () => document.removeEventListener("selectionchange", bump);
  }, [active]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    const nextNorm = normalizeCmsHtml(html);
    setEmpty(nextNorm === "");
    // Skip no-op focus/blur — browsers often inject <br>/empty wrappers
    if (nextNorm === normalizeCmsHtml(value)) return;
    onChange(nextNorm === "" ? "" : html);
  }

  function exec(cmd: string, val?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
    setTick((t) => t + 1);
  }

  function isOn(cmd: string) {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  }

  function wrapHqUnderline() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) return;
    document.execCommand(
      "insertHTML",
      false,
      `<span class="hq-underline">${escapeHtml(sel.toString())}</span>`
    );
    emit();
  }

  function insertLink() {
    const sel = window.getSelection();
    const selected = sel && !sel.isCollapsed ? sel.toString() : "";
    const url = window.prompt("Link URL", "https://");
    if (!url?.trim()) return;
    ref.current?.focus();
    if (selected) {
      document.execCommand("createLink", false, url.trim());
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${escapeHtml(url.trim())}">${escapeHtml(url.trim())}</a>`
      );
    }
    emit();
  }

  const isMail = variant === "mail";

  const toolbar = (
    <div
      className={cn(
        "cms-rte__toolbar",
        isMail && "cms-rte__toolbar--mail",
        (active || isMail) && "is-visible"
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolBtn label="Normal" onClick={() => exec("formatBlock", "p")}>
        <Type className="size-3.5" />
      </ToolBtn>
      <span className="cms-rte__divider" />
      <ToolBtn label="Bold" on={isOn("bold")} onClick={() => exec("bold")}>
        <Bold className="size-3.5" />
      </ToolBtn>
      <ToolBtn
        label="Italic"
        on={isOn("italic")}
        onClick={() => exec("italic")}
      >
        <Italic className="size-3.5" />
      </ToolBtn>
      <ToolBtn
        label="Underline"
        on={isOn("underline")}
        onClick={() => exec("underline")}
      >
        <Underline className="size-3.5" />
      </ToolBtn>
      <span className="cms-rte__divider" />
      <ToolBtn
        label="Bullet list"
        on={isOn("insertUnorderedList")}
        onClick={() => exec("insertUnorderedList")}
      >
        <List className="size-3.5" />
      </ToolBtn>
      <ToolBtn
        label="Numbered list"
        on={isOn("insertOrderedList")}
        onClick={() => exec("insertOrderedList")}
      >
        <ListOrdered className="size-3.5" />
      </ToolBtn>
      <ToolBtn label="Link" onClick={insertLink}>
        <Link2 className="size-3.5" />
      </ToolBtn>
      {!isMail ? (
        <>
          <span className="cms-rte__divider" />
          <ToolBtn label="Accent underline" onClick={wrapHqUnderline}>
            <span className="text-[10px] font-semibold underline underline-offset-2">
              Acc
            </span>
          </ToolBtn>
          <ToolBtn
            label="Line break"
            onClick={() => exec("insertHTML", "<br>")}
          >
            <span className="text-[10px] font-semibold">BR</span>
          </ToolBtn>
        </>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "cms-rte",
        tone === "dark" && "cms-rte--dark",
        isMail && "cms-rte--mail"
      )}
    >
      {!isMail ? toolbar : null}

      <div className="cms-rte__field relative">
        {empty ? (
          <span className="cms-rte__placeholder">{placeholder}</span>
        ) : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          className={cn("cms-rte__editor", className)}
          style={{ minHeight }}
          onFocus={() => {
            focused.current = true;
            setActive(true);
          }}
          onBlur={() => {
            focused.current = false;
            setActive(false);
            emit();
          }}
          onInput={emit}
        />
      </div>

      {isMail ? toolbar : null}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  label,
  on,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  on?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("cms-rte__btn", on && "is-on")}
    >
      {children}
    </button>
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

