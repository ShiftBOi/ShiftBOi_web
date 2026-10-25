"use client";

import {
  formatTimelineDate,
  maskTimelineDateInput,
  parseTimelineDate,
} from "@/lib/projects";
import { cn } from "cn";
import { CalendarDays, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type StepperItem = {
  id?: string;
  meta?: string;
  title: string;
  body?: string;
  /** Raw ISO/date value for CMS date input */
  dateValue?: string;
};

export type StepperEditApi = {
  onDateChange: (index: number, date: string) => void;
  onTitleChange: (index: number, title: string) => void;
  onDelete?: (index: number) => void;
};

function TimelineDateField({
  iso,
  onChange,
}: {
  iso: string;
  onChange: (iso: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => formatTimelineDate(iso));

  useEffect(() => {
    setText(formatTimelineDate(iso));
  }, [iso]);

  function commit(next: string) {
    const parsed = parseTimelineDate(next);
    if (parsed === null) {
      setText(formatTimelineDate(iso));
      return;
    }
    onChange(parsed);
    setText(parsed ? formatTimelineDate(parsed) : "");
  }

  return (
    <div className="hq-cs-cms-tl-meta">
      <input
        type="text"
        className="hq-cs-cms-field hq-cs-stepper__meta hq-cs-cms-tl-typed"
        value={text}
        placeholder="DD/MM/YY"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-label="Date (DD/MM/YY)"
        maxLength={8}
        onChange={(e) => {
          const next = maskTimelineDateInput(e.target.value);
          setText(next);
          const parsed = parseTimelineDate(next);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <input
        ref={pickerRef}
        type="date"
        className="hq-cs-cms-tl-date"
        value={iso.slice(0, 10)}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          setText(formatTimelineDate(v));
        }}
      />
      <button
        type="button"
        className="hq-cs-cms-tl-cal"
        title="Pick date"
        aria-label="Pick date"
        onClick={() => {
          const el = pickerRef.current;
          if (!el) return;
          try {
            el.showPicker?.();
          } catch {
            el.click();
          }
        }}
      >
        <CalendarDays className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Vertical timeline with a continuous rail.
 * Same markup/CSS for public + CMS (`edit` enables inline fields).
 */
export function CaseStudyStepper({
  items,
  className,
  ariaLabel,
  edit,
}: {
  items: StepperItem[];
  className?: string;
  ariaLabel?: string;
  edit?: StepperEditApi;
}) {
  if (items.length === 0 && !edit) return null;

  return (
    <ol className={cn("hq-cs-stepper", className)} aria-label={ariaLabel}>
      {items.map((item, i) => {
        const num = String(i + 1).padStart(2, "0");
        const last = i === items.length - 1;
        const rawDate = (item.dateValue || "").slice(0, 10);

        return (
          <li
            key={item.id ?? `${item.title}-${i}`}
            className={cn("hq-cs-stepper__item", last && "is-last")}
          >
            <div className="hq-cs-stepper__track" aria-hidden>
              <span className="hq-cs-stepper__dot">
                <span>{num}</span>
              </span>
            </div>
            <div className="hq-cs-stepper__main">
              {edit ? (
                <div className="hq-cs-cms-row-tools">
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

              {edit ? (
                <TimelineDateField
                  iso={rawDate}
                  onChange={(date) => edit.onDateChange(i, date)}
                />
              ) : item.meta ? (
                <p className="hq-cs-stepper__meta">{item.meta}</p>
              ) : null}

              {edit ? (
                <input
                  className="hq-cs-cms-field hq-cs-stepper__title"
                  value={item.title}
                  placeholder="What happened"
                  onChange={(e) => edit.onTitleChange(i, e.target.value)}
                />
              ) : (
                <p className="hq-cs-stepper__title">{item.title}</p>
              )}

              {!edit && item.body ? (
                <p className="hq-cs-stepper__body">{item.body}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
