"use client";

import { useEffect, useRef } from "react";
import { sanitizeRichHtml } from "@/lib/rich-text";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onDone: () => void;
  placeholder?: string;
  className?: string;
};

function wrapSelection(className: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.className = className;
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

export function CmsRichText({
  value,
  onChange,
  onDone,
  placeholder = "Write here…",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = sanitizeRichHtml(value) || "";
    if (el.innerHTML !== next) el.innerHTML = next || "";
  }, [value]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    onChange(sanitizeRichHtml(el.innerHTML));
  }

  function run(cmd: string) {
    ref.current?.focus();
    document.execCommand(cmd);
    emit();
  }

  return (
    <div className={`cms-rich ${className}`}>
      <div className="cms-rich-toolbar" role="toolbar" aria-label="Text style">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("bold")}>
          Bold
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            ref.current?.focus();
            wrapSelection("rt-sm");
            emit();
          }}
        >
          Small
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            ref.current?.focus();
            wrapSelection("rt-lg");
            emit();
          }}
        >
          Large
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            ref.current?.focus();
            wrapSelection("rt-muted");
            emit();
          }}
        >
          Muted
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            ref.current?.focus();
            wrapSelection("rt-accent");
            emit();
          }}
        >
          Accent
        </button>
        <button type="button" className="is-done" onClick={onDone}>
          Done
        </button>
      </div>
      <div
        ref={ref}
        className="cms-rich-editor"
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onDone();
          }
        }}
      />
    </div>
  );
}
