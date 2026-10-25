"use client";

import { SectionCard } from "@/components/landing/section-card";
import { SectionMark } from "@/components/landing/section-mark";
import { Signature } from "@/components/landing/signature";
import { SkillBadge } from "@/components/landing/skill-badge";
import { RichTextField } from "@/components/management/rich-text-field";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/settings";
import { SKILL_CATEGORY_ORDER } from "@/lib/skill-badges";
import { cn } from "cn";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Ghost text field that looks like landing copy until focused. */
export function InlineText({
  value,
  onChange,
  placeholder,
  className,
  multiline,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  const shared = cn(
    "cms-about-inline",
    mono && "cms-about-inline--mono",
    className
  );
  if (multiline) {
    return (
      <textarea
        className={shared}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      className={shared}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function AboutStageChrome({
  children,
  toolbar,
  locale,
  surface = "default",
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  locale?: Locale;
  /** `dark` = black content shell (profile chrome). */
  surface?: "default" | "dark";
}) {
  return (
    <div
      className={cn(
        "cms-about-stage hq-shell",
        surface === "dark" && "cms-about-stage--dark"
      )}
      data-locale={locale || "en"}
    >
      {toolbar ? <div className="cms-about-stage__bar">{toolbar}</div> : null}
      <div className="cms-about-stage__canvas">{children}</div>
    </div>
  );
}

export function PitchBioCanvas({
  locale,
  pitch,
  bio,
  onPitchChange,
  onBioChange,
  educationSlot,
}: {
  locale: Locale;
  pitch: string;
  bio: string;
  onPitchChange: (html: string) => void;
  onBioChange: (html: string) => void;
  educationSlot?: ReactNode;
}) {
  const t = getDictionary(locale).landing;

  return (
    <>
      <section
        id="pitch"
        className="hq-pitch grid w-full grid-cols-12 px-3 pt-8 pb-2 sm:px-5 sm:pt-10 lg:px-8 lg:pt-12"
        style={{ containerType: "inline-size" }}
      >
        <div className="hq-pitch__media relative col-span-12 p-2 sm:col-span-4 lg:col-span-3">
          <div className="relative mx-auto w-full max-w-[13rem] sm:max-w-none">
            <div className="hq-pitch__photo relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
              <Image
                src="/tianqi.jpeg"
                alt="Portrait"
                fill
                sizes="(max-width: 640px) 40vw, 20vw"
                className="object-cover object-center"
              />
            </div>
            <div className="pointer-events-none relative z-10 -mt-[calc(22%+1.25rem)] flex justify-end overflow-visible px-1 py-5">
              <Signature className="svg-sign w-[115%] max-w-none shrink-0 origin-center -rotate-[7deg] translate-x-[18%] max-sm:w-[95%] max-sm:translate-x-[8%]" />
            </div>
          </div>
        </div>
        <div className="hq-pitch__body col-span-12 flex flex-col items-start justify-start gap-3 pt-2 text-base leading-none sm:col-span-7 sm:col-start-6 sm:gap-5 sm:pt-4 lg:col-span-8 lg:col-start-5 lg:pt-6 lg:text-lg xl:pt-8">
          <p className="cms-about-stage__hint px-2">Pitch · homepage</p>
          <RichTextField
            tone="dark"
            value={pitch}
            onChange={onPitchChange}
            placeholder="Write the pitch visitors see under the hero…"
            minHeight={140}
            className="hq-pitch__text is-lead cms-about-pitch w-full p-2 select-text [&_br]:block"
          />
        </div>
      </section>

      <SectionCard className="m-0 mt-4">
        <section id="about" className="w-full px-1 pt-10 pb-10 lg:pt-12 lg:pb-12">
          <div className="grid w-full grid-cols-12 items-start gap-y-10 lg:gap-x-10 lg:gap-y-0">
            <div className="col-span-12 flex min-w-0 flex-col gap-5 lg:col-span-6">
              <SectionMark label={t.about} size="md" delay={0} className="px-2" />
              <p className="cms-about-stage__hint px-2">Bio · about column</p>
              <RichTextField
                tone="dark"
                value={bio}
                onChange={onBioChange}
                placeholder="Your bio — same weight and rhythm as the live About column…"
                minHeight={180}
                className="cms-about-bio w-full p-2 select-text [&_br]:block"
              />
            </div>
            <div
              id="study"
              className="col-span-12 flex min-w-0 flex-col gap-5 border-t border-[var(--hq-line)] pt-10 lg:col-span-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
            >
              <SectionMark label={t.study} size="md" delay={0} className="px-2" />
              {educationSlot}
            </div>
          </div>
        </section>
      </SectionCard>
    </>
  );
}

export type EduDraft = {
  id: string;
  degree: string;
  institution: string;
  field: string;
};

export function StudyListEditor({
  rows,
  editingId,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onRemove,
  onAdd,
}: {
  rows: EduDraft[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onChange: (id: string, patch: Partial<EduDraft>) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col">
      {rows.length === 0 ? (
        <p className="cms-about-stage__empty px-2">No degrees yet — add one to match the Study column.</p>
      ) : (
        rows.map((row, index) => {
          const editing = editingId === row.id;
          return (
            <div
              key={row.id}
              className={cn(
                "group relative grid w-full min-w-0 grid-cols-12 gap-x-2 gap-y-1 py-4",
                index > 0 && "border-t border-[var(--hq-line)]"
              )}
            >
              {editing ? (
                <>
                  <div className="col-span-4 p-1 sm:col-span-3">
                    <InlineText
                      mono
                      value={row.degree}
                      onChange={(v) => onChange(row.id, { degree: v })}
                      placeholder="Degree"
                      className="cms-about-inline--degree"
                    />
                  </div>
                  <div className="col-span-8 flex min-w-0 flex-col gap-1 p-1 sm:col-span-9">
                    <InlineText
                      value={row.institution}
                      onChange={(v) => onChange(row.id, { institution: v })}
                      placeholder="Institution"
                      className="cms-about-inline--inst"
                    />
                    <InlineText
                      mono
                      value={row.field}
                      onChange={(v) => onChange(row.id, { field: v })}
                      placeholder="Field"
                      className="cms-about-inline--field"
                    />
                    <div className="mt-2 flex gap-1">
                      <button
                        type="button"
                        className="cms-about-icon-btn is-ok"
                        onClick={() => onSave(row.id)}
                        aria-label="Done editing"
                        title="Done — use Unsaved bar to save"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="cms-about-icon-btn"
                        onClick={onCancel}
                        aria-label="Close editor"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="col-span-4 p-2 font-[family-name:var(--font-hq-mono-2)] text-xs text-[var(--hq-l2)] uppercase sm:col-span-3">
                    {row.degree || "—"}
                  </span>
                  <div className="col-span-8 flex min-w-0 flex-col gap-1 p-2 sm:col-span-9">
                    <span
                      className="block max-w-full text-base leading-tight tracking-[-0.02em] lg:text-lg"
                      style={{ fontVariationSettings: '"wdth" 110' }}
                    >
                      {row.institution || "Institution"}
                    </span>
                    {row.field ? (
                      <span className="block max-w-full font-[family-name:var(--font-hq-mono-2)] text-xs text-[var(--hq-l2)] uppercase">
                        {row.field}
                      </span>
                    ) : null}
                  </div>
                  <div className="cms-about-row-actions absolute top-3 right-0 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="cms-about-icon-btn"
                      onClick={() => onEdit(row.id)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="cms-about-icon-btn is-danger"
                      onClick={() => onRemove(row.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
      <button type="button" className="cms-about-add mt-2" onClick={onAdd}>
        <Plus className="size-3.5" /> Add degree
      </button>
    </div>
  );
}

export type SkillDraft = {
  id: string;
  name: string;
  category: string;
};

export function SkillsShelvesEditor({
  skills,
  editingId,
  onAdd,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  skills: SkillDraft[];
  editingId: string | null;
  onAdd: (category: string, name: string) => void;
  onEdit: (id: string) => void;
  onChange: (id: string, patch: Partial<SkillDraft>) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
}) {
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const draftRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingCategory) draftRef.current?.focus();
  }, [addingCategory]);

  function openAdd(category: string) {
    setAddingCategory(category);
    setDraftName("");
    if (editingId) onCancel();
  }

  function commitAdd() {
    const name = draftName.trim();
    if (!name || !addingCategory) return;
    onAdd(addingCategory, name);
    setDraftName("");
    setAddingCategory(null);
  }

  function cancelAdd() {
    setDraftName("");
    setAddingCategory(null);
  }

  return (
    <SectionCard className="hq-section-card--grey m-0 !border-0 !shadow-none !ring-0">
      <section id="skills" className="w-full py-8 sm:py-10">
        <SectionMark label="Skills" size="md" delay={0} className="px-2" />
        <p className="cms-about-stage__hint mt-3 px-2">
          Hover a shelf · dotted + adds inline
        </p>

        <div className="mt-8 lg:mt-10">
          {SKILL_CATEGORY_ORDER.map((category, index) => {
            const ordered = skills.filter((s) => s.category === category);
            const isAdding = addingCategory === category;
            return (
              <div
                key={category}
                className={cn(
                  "cms-about-shelf group/shelf grid gap-4 py-7 sm:py-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:py-9",
                  index > 0 && "cms-about-shelf-rule"
                )}
              >
                <div className="min-w-0 px-2">
                  <h3
                    className="hq-section-title text-lg leading-tight sm:text-xl"
                    style={{ fontVariationSettings: '"wdth" 112' }}
                  >
                    {category}
                  </h3>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 px-2">
                  {ordered.map((skill) =>
                    editingId === skill.id ? (
                      <div key={skill.id} className="cms-about-skill-edit">
                        <InlineText
                          value={skill.name}
                          onChange={(v) => onChange(skill.id, { name: v })}
                          className="!min-w-[8rem] flex-1"
                        />
                        <select
                          className="cms-about-select"
                          value={skill.category}
                          onChange={(e) =>
                            onChange(skill.id, { category: e.target.value })
                          }
                        >
                          {SKILL_CATEGORY_ORDER.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="cms-about-icon-btn is-ok"
                          onClick={() => onSave(skill.id)}
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="cms-about-icon-btn"
                          onClick={onCancel}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        key={skill.id}
                        className="group relative inline-flex"
                      >
                        <SkillBadge name={skill.name} />
                        <span className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="cms-about-icon-btn is-compact"
                            onClick={() => onEdit(skill.id)}
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            className="cms-about-icon-btn is-compact is-danger"
                            onClick={() => onRemove(skill.id)}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </span>
                      </span>
                    )
                  )}

                  {isAdding ? (
                    <div className="cms-about-skill-inline-add">
                      <input
                        ref={draftRef}
                        type="text"
                        className="cms-about-skill-inline-add__input"
                        value={draftName}
                        placeholder="Skill name"
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitAdd();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelAdd();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="cms-about-icon-btn is-ok is-compact"
                        disabled={!draftName.trim()}
                        onClick={commitAdd}
                        aria-label="Confirm skill"
                      >
                        <Check className="size-3" />
                      </button>
                      <button
                        type="button"
                        className="cms-about-icon-btn is-compact"
                        onClick={cancelAdd}
                        aria-label="Cancel"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="cms-about-skill-dot"
                      onClick={() => openAdd(category)}
                      aria-label={`Add skill to ${category}`}
                      title={`Add to ${category}`}
                    >
                      <Plus className="size-3.5" strokeWidth={2.25} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SectionCard>
  );
}

export type WorkDraft = {
  id: string;
  year: string;
  title: string;
  company: string;
  description: string;
};

export function ExperienceTimelineEditor({
  rows,
  editingId,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onRemove,
  onAdd,
}: {
  rows: WorkDraft[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onChange: (id: string, patch: Partial<WorkDraft>) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const items = [...rows].reverse();
  const featuredIndex = items.findIndex((item) => /\sand\s/i.test(item.title));
  const currentIndex = featuredIndex >= 0 ? featuredIndex : Math.max(items.length - 1, 0);

  return (
    <section id="experience" className="w-full px-2 py-8 sm:px-3 sm:py-10 lg:px-4 lg:py-12">
      <SectionMark label="Experience" size="md" delay={0} className="px-2" />
      <div className="mt-4 flex justify-end px-2">
        <button type="button" className="cms-about-add" onClick={onAdd}>
          <Plus className="size-3.5" /> Add role
        </button>
      </div>
      {items.length === 0 ? (
        <p className="cms-about-stage__empty mt-6 px-2">No roles yet.</p>
      ) : (
        <ol className="mt-8">
          {items.map((item, index) => {
            const current = index === currentIndex;
            const first = index === 0;
            const last = index === items.length - 1;
            const editing = editingId === item.id;
            return (
              <li
                key={item.id}
                className="group grid grid-cols-[3.4rem_1rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4.25rem_1.15rem_minmax(0,1fr)] sm:gap-x-4"
              >
                <div className="pt-1 text-right">
                  {editing ? (
                    <InlineText
                      mono
                      value={item.year}
                      onChange={(v) => onChange(item.id, { year: v })}
                      placeholder="Year"
                      className="!text-right !text-[11px]"
                    />
                  ) : (
                    <p
                      className={cn(
                        "font-[family-name:var(--font-hq-mono-2)] text-[11px] tracking-[0.12em] uppercase sm:text-xs",
                        current ? "text-[var(--hq-accent)]" : "text-[var(--hq-l3)]"
                      )}
                    >
                      {item.year || "—"}
                    </p>
                  )}
                </div>
                <div className="relative flex justify-center">
                  {first ? null : (
                    <span className="absolute top-0 h-2.5 w-px bg-[var(--hq-line)]" />
                  )}
                  {last ? null : (
                    <span className="absolute top-2.5 bottom-0 w-px bg-[var(--hq-line)]" />
                  )}
                  <span
                    className={cn(
                      "relative z-10 mt-1.5 rounded-full ring-4 ring-[var(--hq-bg)]",
                      current
                        ? "size-3.5 bg-[var(--hq-accent)]"
                        : "size-3 border-2 border-[var(--hq-accent)] bg-[var(--hq-bg)]"
                    )}
                  />
                </div>
                <div className={cn("relative min-w-0 pb-8 sm:pb-10", last && "pb-2")}>
                  {editing ? (
                    <div className="flex flex-col gap-2 pr-8">
                      <InlineText
                        value={item.title}
                        onChange={(v) => onChange(item.id, { title: v })}
                        placeholder="Role title"
                        className="cms-about-inline--title"
                      />
                      <InlineText
                        value={item.company}
                        onChange={(v) => onChange(item.id, { company: v })}
                        placeholder="Company"
                        className="cms-about-inline--company"
                      />
                      <InlineText
                        multiline
                        value={item.description}
                        onChange={(v) => onChange(item.id, { description: v })}
                        placeholder="What you did…"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="cms-about-icon-btn is-ok"
                          onClick={() => onSave(item.id)}
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="cms-about-icon-btn"
                          onClick={onCancel}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3
                        className="hq-section-title max-w-[18em] text-base leading-[1.05] text-balance sm:text-lg"
                        style={{ fontVariationSettings: '"wdth" 112' }}
                      >
                        {item.title || "Untitled role"}
                      </h3>
                      {item.company ? (
                        <p className="mt-1 text-sm text-[var(--hq-l2)]">{item.company}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--hq-l2)]">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="cms-about-row-actions absolute top-0 right-0 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          className="cms-about-icon-btn"
                          onClick={() => onEdit(item.id)}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="cms-about-icon-btn is-danger"
                          onClick={() => onRemove(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function ProfileHeroCanvas({
  profile,
  onChange,
}: {
  profile: {
    wordmark: string;
    name: string;
    title: string;
    email: string;
    heroSubhead: string;
    heroHelper: string;
  };
  onChange: (key: keyof typeof profile, value: string) => void;
}) {
  return (
    <section className="cms-about-profile">
      <p className="cms-about-stage__hint">Site chrome · shown in nav & hero</p>
      <InlineText
        value={profile.wordmark}
        onChange={(v) => onChange("wordmark", v)}
        placeholder="ShiftBOi"
        className="cms-about-inline--wordmark"
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="cms-about-profile__field">
          <span>Name</span>
          <InlineText
            value={profile.name}
            onChange={(v) => onChange("name", v)}
            placeholder="Your name"
          />
        </label>
        <label className="cms-about-profile__field">
          <span>Title</span>
          <InlineText
            value={profile.title}
            onChange={(v) => onChange("title", v)}
            placeholder="Role / title"
          />
        </label>
        <label className="cms-about-profile__field sm:col-span-2">
          <span>Public email</span>
          <InlineText
            value={profile.email}
            onChange={(v) => onChange("email", v)}
            placeholder="hello@…"
          />
        </label>
        <label className="cms-about-profile__field sm:col-span-2">
          <span>Hero subhead</span>
          <InlineText
            multiline
            value={profile.heroSubhead}
            onChange={(v) => onChange("heroSubhead", v)}
            placeholder="Short line under the hero…"
          />
        </label>
        <label className="cms-about-profile__field sm:col-span-2">
          <span>Hero helper</span>
          <InlineText
            multiline
            value={profile.heroHelper}
            onChange={(v) => onChange("heroHelper", v)}
            placeholder="Supporting helper copy…"
          />
        </label>
      </div>
    </section>
  );
}
