"use client";

import { ExpandingButtonGroup } from "@/components/arc/expanding-button-group/expanding-button-group";
import { Input as ArcInput } from "@/components/arc/input/input";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { Check, Plus, Search, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function CmsHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="cms-eyebrow">{eyebrow}</p> : null}
        <h1 className="cms-title">{title}</h1>
        {subtitle ? <p className="cms-subtitle">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CmsTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{
    id: T;
    label: string;
    icon: LucideIcon;
    hint?: string;
    count?: number | null;
  }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("cms-tabs", className)}
      role="tablist"
      aria-label="Section"
    >
      {tabs.map(({ id, label, icon: Icon, hint, count }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={cn("cms-tabs__tab", on && "is-on")}
          >
            <span className="cms-tabs__tick" aria-hidden />
            <Icon className="cms-tabs__icon" strokeWidth={1.75} />
            <span className="cms-tabs__copy">
              <span className="cms-tabs__label">
                {label}
                {count != null ? (
                  <span className="cms-tabs__count">{count}</span>
                ) : null}
              </span>
              {hint ? <span className="cms-tabs__hint">{hint}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CmsToolbar({
  search,
  onSearch,
  placeholder = "Search…",
  onAdd,
  addLabel = "Add",
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="cms-arc-search w-full sm:max-w-sm">
        <Search className="cms-arc-search__icon" aria-hidden />
        <ArcInput
          label="Search"
          hideLabel
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {onAdd ? (
        <Button
          className="cms-btn cms-btn--primary h-11 rounded-[4px]"
          onClick={onAdd}
        >
          <Plus className="size-4" /> {addLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function CmsPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("cms-panel p-5 sm:p-6", className)}>{children}</div>
  );
}

export function CmsMessage({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mb-4 rounded-2xl bg-white/70 px-4 py-3 text-sm">{children}</p>
  );
}

export function CmsEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="py-16 text-center text-sm text-muted-foreground">{children}</p>
  );
}

export function CmsFloatingSave({
  visible,
  onSave,
  onCancel,
  saving,
  sections,
}: {
  visible: boolean;
  onSave: () => void;
  onCancel?: () => void;
  saving?: boolean;
  /** When set, each dirty section can be saved on its own; Save still means all. */
  sections?: Array<{ id: string; label: string; onSave: () => void }>;
}) {
  const multi = Boolean(sections && sections.length > 1);
  const singleLabel =
    sections?.length === 1 ? `Save ${sections[0].label}` : "Save";

  return (
    <div
      className={cn(
        "cms-float-save",
        visible ? "is-visible" : "is-hidden"
      )}
      aria-hidden={!visible}
    >
      <div className="cms-float-save__shell">
        <span className="cms-float-save__dot" aria-hidden />
        <span className="cms-float-save__label">
          {multi
            ? `Unsaved · ${sections!.map((s) => s.label).join(" · ")}`
            : sections?.length === 1
              ? `Unsaved · ${sections[0].label}`
              : "Unsaved"}
        </span>
        {multi ? (
          <div className="cms-float-save__sections">
            {sections!.map((s) => (
              <button
                key={s.id}
                type="button"
                className="cms-float-save__sec"
                disabled={saving}
                onClick={() => s.onSave()}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}
        <ExpandingButtonGroup
          label="Save actions"
          size="md"
          defaultExpanded="save"
          className="cms-float-save__ebg"
          items={[
            ...(onCancel
              ? [
                  {
                    id: "cancel",
                    label: "Discard",
                    icon: <X />,
                    disabled: saving,
                    onSelect: () => {
                      onCancel();
                    },
                  },
                ]
              : []),
            {
              id: "save",
              label: saving
                ? "Saving…"
                : multi
                  ? "Save all"
                  : singleLabel,
              doneLabel: "Saved",
              icon: <Check />,
              disabled: saving,
              onSelect: () => {
                onSave();
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
