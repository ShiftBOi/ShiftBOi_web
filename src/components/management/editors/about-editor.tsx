"use client";

import {
  AboutEditorPanel,
  type AboutTranslateOptions,
} from "@/components/management/about-editor-panel";
import {
  CmsFloatingSave,
  CmsHeader,
  CmsTabs,
} from "@/components/management/cms-chrome";
import { useCmsNotify } from "@/components/management/cms-notify";
import {
  AboutStageChrome,
  ExperienceTimelineEditor,
  PitchBioCanvas,
  ProfileHeroCanvas,
  SkillsShelvesEditor,
  StudyListEditor,
} from "@/components/management/editors/about-landing-stage";
import { normalizeCmsHtml } from "@/components/management/rich-text-field";
import { fetchJson } from "@/lib/fetch-json";
import {
  emptyLocaleMap,
  translationRelation,
  type TranslationRelation,
} from "@/lib/locale-relations";
import { languages, type Locale } from "@/i18n/settings";
import { BookOpen, UserCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type HubView = "page" | "profile";
type SaveSection = "story" | "education" | "experience" | "skills" | "profile";

type AboutMap = Record<Locale, { headline: string; bio: string; pitch: string }>;

type ProfileState = {
  name: string;
  title: string;
  wordmark: string;
  heroSubhead: string;
  heroHelper: string;
  email: string;
};

type EduFields = { degree: string; institution: string; field: string };
type EduRow = {
  id: string;
  order: number;
  translations: Record<Locale, EduFields>;
};

type WorkFields = { title: string; company: string; description: string };
type WorkRow = {
  id: string;
  order: number;
  year: string;
  translations: Record<Locale, WorkFields>;
};

type SkillRow = { id: string; name: string; category: string; order: number };

type DirtyMap = Record<SaveSection, boolean>;

const SECTION_LABEL: Record<SaveSection, string> = {
  story: "Story",
  education: "Study",
  experience: "Experience",
  skills: "Skills",
  profile: "Profile",
};

const TRANSLATE_FIELDS = [
  { id: "pitch", name: "Pitch" },
  { id: "bio", name: "Bio" },
  { id: "education", name: "Study" },
  { id: "experience", name: "Experience" },
];

const HASH_TO_VIEW: Record<string, HubView> = {
  profile: "profile",
  page: "page",
  story: "page",
  pitch: "page",
  about: "page",
  study: "page",
  education: "page",
  experience: "page",
  skills: "page",
};

const SCROLL_IDS = new Set([
  "pitch",
  "about",
  "study",
  "education",
  "experience",
  "skills",
]);

function emptyAbout(): AboutMap {
  return emptyLocaleMap(() => ({ headline: "", bio: "", pitch: "" }));
}

function emptyEduFields(): EduFields {
  return { degree: "", institution: "", field: "" };
}

function emptyWorkFields(): WorkFields {
  return { title: "", company: "", description: "" };
}

function emptyProfile(): ProfileState {
  return {
    name: "",
    title: "",
    wordmark: "ShiftBOi",
    heroSubhead: "",
    heroHelper: "",
    email: "",
  };
}

function emptyDirty(): DirtyMap {
  return {
    story: false,
    education: false,
    experience: false,
    skills: false,
    profile: false,
  };
}

function tmpId() {
  return `tmp-${crypto.randomUUID()}`;
}

function isTmp(id: string) {
  return id.startsWith("tmp-");
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function aboutEqual(a: AboutMap, b: AboutMap) {
  for (const loc of languages) {
    if (normalizeCmsHtml(a[loc].pitch) !== normalizeCmsHtml(b[loc].pitch)) {
      return false;
    }
    if (normalizeCmsHtml(a[loc].bio) !== normalizeCmsHtml(b[loc].bio)) {
      return false;
    }
    if (
      normalizeCmsHtml(a[loc].headline) !== normalizeCmsHtml(b[loc].headline)
    ) {
      return false;
    }
  }
  return true;
}

function localeRow<T extends Record<string, unknown>>(
  item: Partial<Record<TranslationRelation, T | null | undefined>>,
  locale: Locale
): T | null {
  return item[translationRelation(locale)] ?? null;
}

function eduFromApi(item: Record<string, unknown>): EduRow {
  const translations = emptyLocaleMap(emptyEduFields);
  for (const loc of languages) {
    const row = localeRow(
      item as Partial<Record<TranslationRelation, EduFields | null>>,
      loc
    );
    translations[loc] = {
      degree: row?.degree || "",
      institution: row?.institution || "",
      field: row?.field || "",
    };
  }
  return {
    id: item.id as string,
    order: item.order as number,
    translations,
  };
}

function workFromApi(item: Record<string, unknown>): WorkRow {
  const translations = emptyLocaleMap(emptyWorkFields);
  for (const loc of languages) {
    const row = localeRow(
      item as Partial<Record<TranslationRelation, WorkFields | null>>,
      loc
    );
    translations[loc] = {
      title: row?.title || "",
      company: row?.company || "",
      description: row?.description || "",
    };
  }
  return {
    id: item.id as string,
    order: item.order as number,
    year: String(item.year || ""),
    translations,
  };
}

function eduView(row: EduRow, locale: Locale): EduFields & { id: string; order: number } {
  return { id: row.id, order: row.order, ...row.translations[locale] };
}

function workView(
  row: WorkRow,
  locale: Locale
): WorkFields & { id: string; order: number; year: string } {
  return {
    id: row.id,
    order: row.order,
    year: row.year,
    ...row.translations[locale],
  };
}

function scrollToHash(hash: string) {
  const id = hash === "education" ? "study" : hash;
  if (!SCROLL_IDS.has(id) && id !== "study") return;
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function AboutEditor({
  initialCategory,
}: {
  initialCategory?: string;
} = {}) {
  const notify = useCmsNotify();
  const [view, setView] = useState<HubView>(() =>
    initialCategory === "profile" ? "profile" : "page"
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [about, setAbout] = useState<AboutMap>(emptyAbout());
  const [originalAbout, setOriginalAbout] = useState<AboutMap>(emptyAbout());
  const [profile, setProfile] = useState<ProfileState>(emptyProfile());
  const [originalProfile, setOriginalProfile] =
    useState<ProfileState>(emptyProfile());
  const [education, setEducation] = useState<EduRow[]>([]);
  const [originalEducation, setOriginalEducation] = useState<EduRow[]>([]);
  const [work, setWork] = useState<WorkRow[]>([]);
  const [originalWork, setOriginalWork] = useState<WorkRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [originalSkills, setOriginalSkills] = useState<SkillRow[]>([]);
  const [dirty, setDirty] = useState<DirtyMap>(emptyDirty());
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const dirtySections = useMemo(() => {
    const order: SaveSection[] = [
      "story",
      "education",
      "experience",
      "skills",
      "profile",
    ];
    return order.filter((id) => dirty[id]);
  }, [dirty]);

  function recomputeDirty(next?: {
    about?: AboutMap;
    profile?: ProfileState;
    education?: EduRow[];
    skills?: SkillRow[];
    work?: WorkRow[];
  }) {
    const a = next?.about ?? about;
    const p = next?.profile ?? profile;
    const e = next?.education ?? education;
    const s = next?.skills ?? skills;
    const w = next?.work ?? work;
    setDirty({
      story: !aboutEqual(a, originalAbout),
      education: !sameJson(e, originalEducation),
      experience: !sameJson(w, originalWork),
      skills: !sameJson(s, originalSkills),
      profile: !sameJson(p, originalProfile),
    });
  }

  const load = useCallback(async () => {
    const [aboutRes, contentRes] = await Promise.all([
      fetchJson<{
        success?: boolean;
        data?: {
          about?: Record<string, unknown>;
          education?: Record<string, unknown>[];
          work?: Record<string, unknown>[];
          skills?: SkillRow[];
        };
        error?: string;
      }>("/api/cms/about"),
      fetchJson<{ profile?: ProfileState; error?: string }>(
        "/api/cms/content"
      ),
    ]);

    if (!aboutRes.ok || !aboutRes.data.data) {
      notify.error(
        "Couldn’t load about",
        aboutRes.data.error || "Try again"
      );
      return;
    }

    const next = emptyAbout();
    const a = aboutRes.data.data.about;
    if (a) {
      for (const loc of languages) {
        const key = translationRelation(loc);
        const row = a[key] as
          | { headline?: string; bio?: string; pitch?: string }
          | undefined;
        if (row)
          next[loc] = {
            headline: row.headline || "",
            bio: row.bio || "",
            pitch: row.pitch || "",
          };
      }
    }
    setAbout(next);
    setOriginalAbout(next);

    const edu = (aboutRes.data.data.education || []).map(eduFromApi);
    setEducation(edu);
    setOriginalEducation(edu);

    const workRows = (aboutRes.data.data.work || []).map(workFromApi);
    setWork(workRows);
    setOriginalWork(workRows);

    const skillRows = (aboutRes.data.data.skills || []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      order: s.order,
    }));
    setSkills(skillRows);
    setOriginalSkills(skillRows);

    if (contentRes.ok && contentRes.data.profile) {
      const p = {
        name: contentRes.data.profile.name,
        title: contentRes.data.profile.title,
        wordmark: contentRes.data.profile.wordmark,
        heroSubhead: contentRes.data.profile.heroSubhead,
        heroHelper: contentRes.data.profile.heroHelper,
        email: contentRes.data.profile.email,
      };
      setProfile(p);
      setOriginalProfile(p);
    }
    setDirty(emptyDirty());
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const raw = window.location.hash.replace("#", "");
    if (!raw) return;
    const nextView = HASH_TO_VIEW[raw];
    if (nextView) setView(nextView);
    if (nextView === "page") scrollToHash(raw);
  }, []);

  function discardSection(id: SaveSection) {
    if (id === "story") setAbout(originalAbout);
    if (id === "education") {
      setEducation(originalEducation);
      setEditingEduId(null);
    }
    if (id === "experience") {
      setWork(originalWork);
      setEditingWorkId(null);
    }
    if (id === "skills") {
      setSkills(originalSkills);
      setEditingSkillId(null);
    }
    if (id === "profile") setProfile(originalProfile);
    setDirty((d) => ({ ...d, [id]: false }));
  }

  function discardVisible() {
    for (const id of dirtySections) discardSection(id);
  }

  function selectView(next: HubView) {
    if (next === view) return;
    setView(next);
    window.history.replaceState(null, "", next === "profile" ? "#profile" : "#page");
  }

  async function persistEducation(rows: EduRow[], original: EduRow[]) {
    const keep = new Set(rows.map((r) => r.id));
    for (const row of original) {
      if (!keep.has(row.id) && !isTmp(row.id)) {
        await fetchJson(`/api/cms/about/education/${row.id}`, { method: "DELETE" });
      }
    }
    for (const row of rows) {
      if (isTmp(row.id)) {
        await fetchJson("/api/cms/about/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: row.order,
            translations: row.translations,
          }),
        });
        continue;
      }
      const before = original.find((r) => r.id === row.id);
      if (!before || !sameJson(before, row)) {
        await fetchJson(`/api/cms/about/education/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: row.order,
            translations: row.translations,
          }),
        });
      }
    }
  }

  async function persistSkills(rows: SkillRow[], original: SkillRow[]) {
    const keep = new Set(rows.map((r) => r.id));
    for (const row of original) {
      if (!keep.has(row.id) && !isTmp(row.id)) {
        await fetchJson(`/api/cms/about/skills/${row.id}`, { method: "DELETE" });
      }
    }
    for (const row of rows) {
      if (isTmp(row.id)) {
        await fetchJson("/api/cms/about/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            category: row.category,
            order: row.order,
          }),
        });
        continue;
      }
      const before = original.find((r) => r.id === row.id);
      if (!before || !sameJson(before, row)) {
        await fetchJson(`/api/cms/about/skills/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
      }
    }
  }

  async function persistWork(rows: WorkRow[], original: WorkRow[]) {
    const keep = new Set(rows.map((r) => r.id));
    for (const row of original) {
      if (!keep.has(row.id) && !isTmp(row.id)) {
        await fetchJson(`/api/cms/about/work-experience/${row.id}`, { method: "DELETE" });
      }
    }
    for (const row of rows) {
      if (isTmp(row.id)) {
        await fetchJson("/api/cms/about/work-experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: row.year,
            order: row.order,
            translations: row.translations,
          }),
        });
        continue;
      }
      const before = original.find((r) => r.id === row.id);
      if (!before || !sameJson(before, row)) {
        await fetchJson(`/api/cms/about/work-experience/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: row.year,
            order: row.order,
            translations: row.translations,
          }),
        });
      }
    }
  }

  async function saveSections(ids: SaveSection[]) {
    if (!ids.length) return;
    setSaving(true);
    try {
      const keepStory = !ids.includes("story") && dirty.story ? about : null;
      const keepEdu =
        !ids.includes("education") && dirty.education ? education : null;
      const keepWork =
        !ids.includes("experience") && dirty.experience ? work : null;
      const keepSkills =
        !ids.includes("skills") && dirty.skills ? skills : null;
      const keepProfile =
        !ids.includes("profile") && dirty.profile ? profile : null;

      for (const id of ids) {
        if (id === "story") {
          const { ok, data } = await fetchJson<{ error?: string }>(
            "/api/cms/about",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ translations: about }),
            }
          );
          if (!ok) throw new Error(data.error || "Story save failed");
        } else if (id === "education") {
          await persistEducation(education, originalEducation);
          setEditingEduId(null);
        } else if (id === "experience") {
          await persistWork(work, originalWork);
          setEditingWorkId(null);
        } else if (id === "skills") {
          await persistSkills(skills, originalSkills);
          setEditingSkillId(null);
        } else if (id === "profile") {
          const { ok, data } = await fetchJson<{ error?: string }>(
            "/api/cms/content",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                section: "profile",
                ...profile,
                heroHeadline: about.en.headline,
              }),
            }
          );
          if (!ok) throw new Error(data.error || "Profile save failed");
        }
      }

      await load();

      // Restore drafts for sections we did not save
      if (keepStory) setAbout(keepStory);
      if (keepEdu) setEducation(keepEdu);
      if (keepWork) setWork(keepWork);
      if (keepSkills) setSkills(keepSkills);
      if (keepProfile) setProfile(keepProfile);
      setDirty({
        story: Boolean(keepStory),
        education: Boolean(keepEdu),
        experience: Boolean(keepWork),
        skills: Boolean(keepSkills),
        profile: Boolean(keepProfile),
      });

      const labels = ids.map((id) => SECTION_LABEL[id]).join(" · ");
      notify.success("Saved", labels);
    } catch (error) {
      notify.error(
        "Save failed",
        error instanceof Error ? error.message : "Unexpected error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function translateWithAi(opts: AboutTranslateOptions) {
    if (opts.target === locale) return;
    const include = (field: string) =>
      opts.mode === "all" || opts.fields.has(field);

    setTranslating(true);
    try {
      const content: Record<string, unknown> = {};

      if (include("pitch") && about[locale].pitch) {
        content.pitch = about[locale].pitch;
      }
      if (include("bio") && about[locale].bio) {
        content.bio = about[locale].bio;
      }
      if (include("education") && education.length) {
        content.education = education.map((row) => eduView(row, locale));
      }
      if (include("experience") && work.length) {
        content.work = work.map((row) => {
          const src = workView(row, locale);
          return {
            id: src.id,
            title: src.title,
            company: src.company,
            description: src.description,
          };
        });
      }

      if (!Object.keys(content).length) {
        throw new Error("Nothing to translate — pick fields with content");
      }

      const { ok, data } = await fetchJson<{
        success?: boolean;
        error?: string;
        data?: {
          bio?: string;
          pitch?: string;
          education?: Array<Partial<EduFields> & { id?: string }>;
          work?: Array<Partial<WorkFields> & { id?: string }>;
        };
      }>("/api/ai/translate/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage: locale,
          targetLanguage: opts.target,
          model: opts.model,
          content,
        }),
      });
      if (!ok || !data.success || !data.data) {
        throw new Error(data.error || "Translate failed");
      }

      const translated = data.data;
      let nextAbout = about;
      let nextEdu = education;
      let nextWork = work;

      if (include("pitch") || include("bio")) {
        nextAbout = {
          ...about,
          [opts.target]: {
            ...about[opts.target],
            pitch: include("pitch")
              ? (translated.pitch ?? about[locale].pitch)
              : about[opts.target].pitch,
            bio: include("bio")
              ? (translated.bio ?? about[locale].bio)
              : about[opts.target].bio,
          },
        };
        setAbout(nextAbout);
      }

      if (include("education") && translated.education) {
        const byId = new Map(
          translated.education.map((r) => [r.id, r])
        );
        nextEdu = education.map((row) => {
          const t = byId.get(row.id);
          if (!t) return row;
          const prev = row.translations[opts.target] || emptyEduFields();
          return {
            ...row,
            translations: {
              ...row.translations,
              [opts.target]: {
                degree: t.degree ?? prev.degree,
                institution: t.institution ?? prev.institution,
                field: t.field ?? prev.field,
              },
            },
          };
        });
        setEducation(nextEdu);
      }

      if (include("experience") && translated.work) {
        const byId = new Map(translated.work.map((r) => [r.id, r]));
        nextWork = work.map((row) => {
          const t = byId.get(row.id);
          if (!t) return row;
          const prev = row.translations[opts.target] || emptyWorkFields();
          return {
            ...row,
            translations: {
              ...row.translations,
              [opts.target]: {
                title: t.title ?? prev.title,
                company: t.company ?? prev.company,
                description: t.description ?? prev.description,
              },
            },
          };
        });
        setWork(nextWork);
      }

      setLocale(opts.target);
      recomputeDirty({
        about: nextAbout,
        education: nextEdu,
        work: nextWork,
      });
      notify.success(
        "Translation drafted",
        `${locale.toUpperCase()} → ${opts.target.toUpperCase()}. Review, then Save.`
      );
    } catch (error) {
      notify.error(
        "Translate failed",
        error instanceof Error ? error.message : "Unexpected error"
      );
    } finally {
      setTranslating(false);
    }
  }

  function addSkillLocal(category: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [
      ...skills,
      {
        id: tmpId(),
        name: trimmed,
        category,
        order: skills.length,
      },
    ];
    setSkills(next);
    recomputeDirty({ skills: next });
  }

  function addEducationLocal() {
    const id = tmpId();
    const next = [
      ...education,
      {
        id,
        order: education.length,
        translations: emptyLocaleMap(emptyEduFields),
      },
    ];
    setEducation(next);
    setEditingEduId(id);
    recomputeDirty({ education: next });
  }

  function addWorkLocal() {
    const id = tmpId();
    const next = [
      ...work,
      {
        id,
        order: work.length,
        year: String(new Date().getFullYear()),
        translations: emptyLocaleMap(emptyWorkFields),
      },
    ];
    setWork(next);
    setEditingWorkId(id);
    recomputeDirty({ work: next });
  }

  function patchEdu(id: string, patch: Partial<EduFields>) {
    const cur = education.find((r) => r.id === id);
    if (!cur) return;
    const fields = { ...cur.translations[locale], ...patch };
    if (sameJson(cur.translations[locale], fields)) return;
    const next = education.map((r) =>
      r.id === id
        ? {
            ...r,
            translations: { ...r.translations, [locale]: fields },
          }
        : r
    );
    setEducation(next);
    recomputeDirty({ education: next });
  }

  function patchWork(
    id: string,
    patch: Partial<WorkFields & { year: string }>
  ) {
    const cur = work.find((r) => r.id === id);
    if (!cur) return;
    const { year, ...fieldsPatch } = patch;
    const fields = { ...cur.translations[locale], ...fieldsPatch };
    const nextYear = year !== undefined ? year : cur.year;
    if (
      sameJson(cur.translations[locale], fields) &&
      nextYear === cur.year
    ) {
      return;
    }
    const next = work.map((r) =>
      r.id === id
        ? {
            ...r,
            year: nextYear,
            translations: { ...r.translations, [locale]: fields },
          }
        : r
    );
    setWork(next);
    recomputeDirty({ work: next });
  }

  const current = about[locale];
  const eduRowsView = education.map((r) => eduView(r, locale));
  const workRowsView = work.map((r) => workView(r, locale));

  const studyEditor = (
    <StudyListEditor
      rows={eduRowsView}
      editingId={editingEduId}
      onEdit={setEditingEduId}
      onChange={(id, patch) => patchEdu(id, patch)}
      onSave={() => setEditingEduId(null)}
      onCancel={() => setEditingEduId(null)}
      onRemove={(id) => {
        void (async () => {
          const ok = await notify.confirm({
            title: "Delete degree?",
            description: "Removed after you save Study.",
            confirmLabel: "Delete",
            danger: true,
          });
          if (!ok) return;
          const next = education.filter((r) => r.id !== id);
          setEducation(next);
          if (editingEduId === id) setEditingEduId(null);
          recomputeDirty({ education: next });
        })();
      }}
      onAdd={addEducationLocal}
    />
  );

  return (
    <div className="relative pb-24">
      <CmsHeader
        eyebrow="About"
        title="Landing page"
        subtitle="One stage — pitch through experience · save or translate each block"
      />

      <CmsTabs
        value={view}
        onChange={selectView}
        tabs={[
          {
            id: "page",
            label: "Page",
            hint: "Pitch → study → work → skills",
            icon: BookOpen,
          },
          {
            id: "profile",
            label: "Profile",
            hint: "Name & site chrome",
            icon: UserCircle,
          },
        ]}
      />

      {view === "profile" ? (
        <AboutStageChrome locale={locale} surface="dark">
          <ProfileHeroCanvas
            profile={profile}
            onChange={(key, value) => {
              if (profile[key] === value) return;
              const next = { ...profile, [key]: value };
              setProfile(next);
              recomputeDirty({ profile: next });
            }}
          />
        </AboutStageChrome>
      ) : (
        <AboutStageChrome locale={locale} surface="dark">
          <PitchBioCanvas
            locale={locale}
            pitch={current.pitch}
            bio={current.bio}
            onPitchChange={(html) => {
              if (
                normalizeCmsHtml(html) ===
                normalizeCmsHtml(about[locale].pitch)
              ) {
                return;
              }
              const nextAbout: AboutMap = {
                ...about,
                [locale]: { ...about[locale], pitch: html },
              };
              setAbout(nextAbout);
              recomputeDirty({ about: nextAbout });
            }}
            onBioChange={(html) => {
              if (
                normalizeCmsHtml(html) === normalizeCmsHtml(about[locale].bio)
              ) {
                return;
              }
              const nextAbout: AboutMap = {
                ...about,
                [locale]: { ...about[locale], bio: html },
              };
              setAbout(nextAbout);
              recomputeDirty({ about: nextAbout });
            }}
            educationSlot={studyEditor}
          />

          <div className="cms-about-vita">
            <ExperienceTimelineEditor
              rows={workRowsView}
              editingId={editingWorkId}
              onEdit={setEditingWorkId}
              onChange={(id, patch) => patchWork(id, patch)}
              onSave={() => setEditingWorkId(null)}
              onCancel={() => setEditingWorkId(null)}
              onRemove={async (id) => {
                const ok = await notify.confirm({
                  title: "Delete role?",
                  description: "Removed after you save Experience.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (!ok) return;
                const next = work.filter((r) => r.id !== id);
                setWork(next);
                if (editingWorkId === id) setEditingWorkId(null);
                recomputeDirty({ work: next });
              }}
              onAdd={addWorkLocal}
            />
          </div>

          <div className="mt-4">
            <SkillsShelvesEditor
              skills={skills}
              editingId={editingSkillId}
              onAdd={addSkillLocal}
              onEdit={setEditingSkillId}
              onChange={(id, patch) => {
                const cur = skills.find((s) => s.id === id);
                if (!cur) return;
                const row = { ...cur, ...patch };
                if (sameJson(cur, row)) return;
                const next = skills.map((s) => (s.id === id ? row : s));
                setSkills(next);
                recomputeDirty({ skills: next });
              }}
              onSave={() => setEditingSkillId(null)}
              onCancel={() => setEditingSkillId(null)}
              onRemove={async (id) => {
                const ok = await notify.confirm({
                  title: "Delete skill?",
                  description: "Removed after you save Skills.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (!ok) return;
                const next = skills.filter((s) => s.id !== id);
                setSkills(next);
                if (editingSkillId === id) setEditingSkillId(null);
                recomputeDirty({ skills: next });
              }}
            />
          </div>
        </AboutStageChrome>
      )}

      {view === "page" ? (
        <AboutEditorPanel
          currentLang={locale}
          onLangChange={setLocale}
          onTranslate={translateWithAi}
          translating={translating}
          fields={TRANSLATE_FIELDS}
        />
      ) : null}

      <CmsFloatingSave
        visible={dirtySections.length > 0}
        saving={saving}
        sections={dirtySections.map((id) => ({
          id,
          label: SECTION_LABEL[id],
          onSave: () => void saveSections([id]),
        }))}
        onSave={() => void saveSections(dirtySections)}
        onCancel={discardVisible}
      />
    </div>
  );
}
