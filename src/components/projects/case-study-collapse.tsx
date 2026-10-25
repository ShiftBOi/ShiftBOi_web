"use client";

import { cn } from "cn";
import { GripVertical, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

export type CollapseItem = {
  id?: string;
  title: string;
  body?: string;
};

export type CollapseEditApi = {
  openIndex: number;
  onOpenChange: (index: number) => void;
  onTitleChange: (index: number, title: string) => void;
  onBodyChange: (index: number, body: string) => void;
  onDelete?: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
};

/**
 * Numbered accordion for feature modules — collapse only, no timeline rail.
 * Same markup/CSS for public + CMS (`edit` enables inline fields).
 */
export function CaseStudyCollapse({
  items,
  className,
  ariaLabel,
  edit,
}: {
  items: CollapseItem[];
  className?: string;
  ariaLabel?: string;
  edit?: CollapseEditApi;
}) {
  const baseId = useId();
  const firstOpenable = items.findIndex((item) => Boolean(item.body?.trim()));
  const [openLocal, setOpenLocal] = useState(
    firstOpenable >= 0 ? firstOpenable : -1
  );
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);

  const open = edit ? edit.openIndex : openLocal;
  const setOpen = edit
    ? edit.onOpenChange
    : (next: number) => setOpenLocal(next);

  if (items.length === 0 && !edit) return null;

  return (
    <ul className={cn("hq-cs-collapse", className)} aria-label={ariaLabel}>
      {items.map((item, i) => {
        const num = String(i + 1).padStart(2, "0");
        const last = i === items.length - 1;
        const body = item.body?.trim() || "";
        const canToggle = edit ? true : body.length > 0;
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const triggerId = `${baseId}-trigger-${i}`;

        return (
          <li
            key={item.id ?? `${item.title}-${i}`}
            className={cn(
              "hq-cs-collapse__item",
              last && "is-last",
              isOpen && "is-open",
              !canToggle && "is-static",
              edit && dragOver === i && "is-drag-over"
            )}
            onDragOver={
              edit?.onReorder
                ? (e) => {
                    e.preventDefault();
                    setDragOver(i);
                  }
                : undefined
            }
            onDragLeave={
              edit?.onReorder
                ? (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOver(null);
                    }
                  }
                : undefined
            }
            onDrop={
              edit?.onReorder
                ? (e) => {
                    e.preventDefault();
                    const from = dragFrom.current;
                    dragFrom.current = null;
                    setDragOver(null);
                    if (from == null || from === i) return;
                    edit.onReorder?.(from, i);
                    setOpen(i);
                  }
                : undefined
            }
          >
            <div className="hq-cs-collapse__track" aria-hidden>
              <span className="hq-cs-collapse__dot">
                <span>{num}</span>
              </span>
            </div>

            <div className="hq-cs-collapse__main">
              {edit ? (
                <div className="hq-cs-cms-row-tools">
                  {edit.onReorder ? (
                    <button
                      type="button"
                      className="hq-cs-cms-icon-btn hq-cs-cms-icon-btn--ghost cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                      draggable
                      onDragStart={() => {
                        dragFrom.current = i;
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      <GripVertical className="size-3.5" />
                    </button>
                  ) : null}
                  {edit.onDelete ? (
                    <button
                      type="button"
                      className="hq-cs-cms-icon-btn hq-cs-cms-icon-btn--ghost hq-cs-cms-icon-btn--danger"
                      title="Delete"
                      onClick={() => edit.onDelete?.(i)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ) : null}

              {canToggle ? (
                <button
                  type="button"
                  id={triggerId}
                  className="hq-cs-collapse__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {edit ? (
                    <input
                      className="hq-cs-cms-field hq-cs-collapse__title"
                      value={item.title}
                      placeholder="Feature title"
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setOpen(i)}
                      onChange={(e) => edit.onTitleChange(i, e.target.value)}
                    />
                  ) : (
                    <span className="hq-cs-collapse__title">{item.title}</span>
                  )}
                  <span className="hq-cs-collapse__icon" aria-hidden>
                    <span />
                    <span />
                  </span>
                </button>
              ) : (
                <p className="hq-cs-collapse__title is-static">{item.title}</p>
              )}

              {canToggle ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="hq-cs-collapse__panel"
                  hidden={!isOpen}
                >
                  {edit ? (
                    <textarea
                      className="hq-cs-collapse__body hq-cs-collapse__body--edit"
                      value={item.body || ""}
                      placeholder="Feature description"
                      rows={1}
                      ref={(el) => {
                        if (!el) return;
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                      onChange={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                        edit.onBodyChange(i, e.target.value);
                      }}
                    />
                  ) : (
                    <p className="hq-cs-collapse__body">{body}</p>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
