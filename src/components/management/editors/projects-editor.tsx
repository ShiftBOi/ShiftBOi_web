"use client";

import {
  CmsFloatingSave,
  CmsHeader,
  CmsTabs,
} from "@/components/management/cms-chrome";
import { CoverBrandMark } from "@/components/landing/cover-brand-mark";
import { CoverFontLoader } from "@/components/landing/cover-font-loader";
import { CoverBrandComposer } from "@/components/management/cover-brand-composer";
import { useCmsNotify } from "@/components/management/cms-notify";
import { ProjectCaseStudyEditor } from "@/components/management/editors/project-case-study-editor";
import {
  buildCoverBrandSvg,
  normalizeCoverBrand,
  primaryCoverText,
  type CoverBrandLayout,
} from "@/lib/cover-brand";
import {
  ProjectEditorPanel,
  type TranslateField,
  type TranslateOptions,
} from "@/components/management/project-editor-panel";
import { Input as ArcInput } from "@/components/arc/input/input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeCoverFont } from "@/lib/cover-fonts";
import { fetchJson } from "@/lib/fetch-json";
import { isVideoUrl } from "@/lib/media-url";
import { publicAssetUrl } from "@/lib/public-asset";
import { normalizeLinks, summaryFromDescription } from "@/lib/projects";
import { type Locale } from "@/i18n/settings";
import { cn } from "cn";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type LocaleFields = {
  title: string;
  tagline?: string | null;
  role?: string | null;
  scope?: string | null;
  description: string;
  features: unknown;
  timeline: unknown;
};

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  year: string;
  coverImage?: string | null;
  logo?: string | null;
  coverText?: string | null;
  coverFont?: string | null;
  coverBrand?: CoverBrandLayout | null;
  coverBrandSvg?: string | null;
  galleryLayout?: string;
  isPublished: boolean;
  featured?: boolean;
  isNda?: boolean;
  techStack?: unknown;
  links?: unknown;
  screenshots?: unknown;
  projectType?: { id: string; name: string; type: string; color: string } | null;
  translations?: Partial<Record<Locale, LocaleFields | null>>;
};

type ProjectTypeRow = { id: string; type: string; color: string };

const PRESET_COLORS = [
  { name: "Sky", hex: "#3B82F6" },
  { name: "Ocean", hex: "#0EA5E9" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Mint", hex: "#10B981" },
  { name: "Moss", hex: "#65A30D" },
  { name: "Gold", hex: "#EAB308" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Coral", hex: "#F97316" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Berry", hex: "#E11D48" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Slate", hex: "#64748B" },
  { name: "Ink", hex: "#334155" },
] as const;

const DEFAULT_TYPE_COLOR = PRESET_COLORS[0].hex;

function colorLabel(hex: string) {
  return (
    PRESET_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())
      ?.name ?? hex.toUpperCase()
  );
}

function TypeColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const selected = colorLabel(value);

  return (
    <div className="cms-type-colors">
      <div
        className="cms-type-colors__preview"
        style={{ "--swatch": value } as CSSProperties}
      >
        <span className="cms-type-colors__dot" aria-hidden />
        <span className="cms-type-colors__meta">
          <strong>{selected}</strong>
          <code>{value.toUpperCase()}</code>
        </span>
      </div>
      <div
        className="cms-type-colors__grid"
        role="listbox"
        aria-label="Type color"
      >
        {PRESET_COLORS.map((color) => {
          const on = color.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color.hex}
              type="button"
              role="option"
              aria-selected={on}
              title={color.name}
              onClick={() => onChange(color.hex)}
              className={cn("cms-type-swatch", on && "is-on")}
              style={{ "--swatch": color.hex } as CSSProperties}
            >
              <span className="cms-type-swatch__fill" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InlineTypeColor({
  value,
  open,
  disabled,
  onToggle,
  onClose,
  onPick,
}: {
  value: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onPick: (hex: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    // Defer so the opening click doesn’t immediately close
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      className={cn("cms-type-inline-color", open && "is-open")}
    >
      <button
        type="button"
        className="cms-type-inline-color__dot"
        style={{ "--swatch": value } as CSSProperties}
        aria-label={`Color ${colorLabel(value)}. Click to change.`}
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
      />
      <div
        className="cms-type-inline-color__rail"
        role="listbox"
        aria-label="Pick color"
        aria-hidden={!open}
      >
        {PRESET_COLORS.map((color, i) => {
          const on = color.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color.hex}
              type="button"
              role="option"
              aria-selected={on}
              title={color.name}
              tabIndex={open ? 0 : -1}
              disabled={disabled || !open}
              onClick={() => onPick(color.hex)}
              className={cn("cms-type-swatch", on && "is-on")}
              style={
                {
                  "--swatch": color.hex,
                  "--i": i,
                } as CSSProperties
              }
            >
              <span className="cms-type-swatch__fill" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InlineTypeName({
  value,
  editing,
  disabled,
  onStart,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  editing: boolean;
  disabled?: boolean;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className="cms-type-inline-name"
        disabled={disabled}
        onClick={onStart}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      className="cms-type-inline-name__input"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}

const COVER_FALLBACK: Record<string, string> = {
  "e-medical-learning-platform":
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  notelink:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
};

function resolveCover(cover: string | null | undefined, slug: string) {
  if (cover && /^https?:\/\//i.test(cover)) return cover;
  if (cover?.startsWith("/")) return publicAssetUrl(cover) || cover;
  if (cover?.trim()) {
    const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
    if (base) return `${base}/${cover.replace(/^\//, "")}`;
  }
  return COVER_FALLBACK[slug] ?? COVER_FALLBACK.notelink;
}

export function ProjectsEditor() {
  const notify = useCmsNotify();
  const [tab, setTab] = useState<"projects" | "types">("projects");
  const [view, setView] = useState<"list" | "edit" | "cover">("list");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [types, setTypes] = useState<ProjectTypeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState<string>(DEFAULT_TYPE_COLOR);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [nameEditId, setNameEditId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [nameEditBaseline, setNameEditBaseline] = useState("");
  const [savingType, setSavingType] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ ok, data }, typesRes] = await Promise.all([
        fetchJson<{ success?: boolean; data?: ProjectRow[]; error?: string }>(
          "/api/projects?management=true"
        ),
        fetchJson<{
          success?: boolean;
          data?: ProjectTypeRow[];
        }>("/api/project-types"),
      ]);
      if (!ok) {
        notify.error("Couldn’t load projects", data.error || "Try again");
        return;
      }
      setProjects(data.data || []);
      if (typesRes.ok && typesRes.data.data) setTypes(typesRes.data.data);
    } catch (error) {
      notify.error(
        "Couldn’t load projects",
        error instanceof Error ? error.message : "Try again"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  const project = projects.find((p) => p.id === activeId) ?? null;
  const translation: LocaleFields = {
    title:
      project?.translations?.[locale]?.title ||
      (locale === "en" ? project?.name || "" : ""),
    tagline: project?.translations?.[locale]?.tagline ?? "",
    role: project?.translations?.[locale]?.role ?? "",
    scope: project?.translations?.[locale]?.scope ?? "",
    description: project?.translations?.[locale]?.description || "",
    features: project?.translations?.[locale]?.features ?? [],
    timeline: project?.translations?.[locale]?.timeline ?? null,
  };

  function openEdit(id: string) {
    setActiveId(id);
    setView("edit");
    setDirty(false);
  }

  function openCover(id: string) {
    setActiveId(id);
    setView("cover");
    setDirty(false);
  }

  function markDirty() {
    setDirty(true);
  }

  function patchProject(patch: Partial<ProjectRow>) {
    if (!project) return;
    markDirty();
    setProjects((prev) =>
      prev.map((row) => (row.id === project.id ? { ...row, ...patch } : row))
    );
  }

  function patchTranslation(patch: Partial<LocaleFields>) {
    if (!project) return;
    markDirty();
    setProjects((prev) =>
      prev.map((row) => {
        if (row.id !== project.id) return row;
        const current = row.translations?.[locale] || {
          title: "",
          tagline: "",
          role: "",
          scope: "",
          description: "",
          features: [],
          timeline: null,
        };
        return {
          ...row,
          translations: {
            ...row.translations,
            [locale]: { ...current, ...patch },
          },
        };
      })
    );
  }

  async function confirmLeave(description?: string) {
    if (!dirty) return true;
    return notify.confirm({
      title: "Leave without saving?",
      description: description || "Unsaved edits will be lost.",
      confirmLabel: "Leave",
      danger: true,
    });
  }

  async function changeLocale(next: Locale) {
    if (next === locale) return;
    if (dirty) {
      const ok = await notify.confirm({
        title: "Switch language?",
        description:
          "You have unsaved changes. They stay in this tab until Save.",
        confirmLabel: "Switch",
      });
      if (!ok) return;
    }
    setLocale(next);
  }

  async function cancelEdits() {
    setDirty(false);
    await load();
  }

  async function createProject() {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: ProjectRow;
      error?: string;
    }>("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Project",
        description: "",
        year: String(new Date().getFullYear()),
        isPublished: false,
        featured: false,
      }),
    });
    if (!ok) {
      notify.error("Create failed", data.error || "Try again");
      return;
    }
    await load();
    if (data.data?.id) openEdit(data.data.id);
  }

  async function save() {
    if (!project) return;
    setSaving(true);
    try {
      const layout = normalizeCoverBrand(
        project.coverBrand,
        project.coverText || ""
      );
      const coverText = primaryCoverText(layout) || null;
      const coverFont = normalizeCoverFont(project.coverFont);
      // Always bake the editable canvas into SVG for landing + CMS cards
      const coverBrandSvg = buildCoverBrandSvg({
        layout,
        text: coverText || "",
        logoUrl: project.logo,
        fontId: coverFont,
      });
      const { ok, data } = await fetchJson<{
        success?: boolean;
        error?: string;
        data?: ProjectRow;
      }>(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: project.slug,
          year: project.year,
          isPublished: project.isPublished,
          featured: Boolean(project.featured),
          isNda: project.isNda,
          coverImage: project.coverImage,
          logo: project.logo ?? null,
          coverText,
          coverFont,
          coverBrand: layout,
          coverBrandSvg,
          galleryLayout: project.galleryLayout || "bento",
          techStack: project.techStack,
          links: normalizeLinks(project.links),
          screenshots: project.screenshots,
          projectTypeId: project.projectType?.id ?? null,
          translations: {
            [locale]: {
              title: translation.title,
              tagline: translation.tagline || null,
              role: translation.role || null,
              scope: null,
              description: translation.description,
              features: translation.features,
              timeline: translation.timeline,
            },
          },
        }),
      });
      if (ok && data.success !== false) {
        const fromServer = data.data;
        patchProject({
          coverText: fromServer?.coverText ?? coverText,
          coverFont: fromServer?.coverFont ?? coverFont,
          coverBrand: (fromServer?.coverBrand as CoverBrandLayout) ?? layout,
          coverBrandSvg: fromServer?.coverBrandSvg ?? coverBrandSvg,
        });
        setDirty(false);
        const fromCover = view === "cover";
        const fromEdit = view === "edit";
        const leaveAfterSave = fromCover || fromEdit;
        notify.success("Saved", {
          description: leaveAfterSave
            ? "Returning to projects"
            : "SVG updated on landing and CMS cards",
          duration: 2000,
        });
        await load();
        if (leaveAfterSave) {
          await new Promise((r) => setTimeout(r, 2000));
          setView("list");
        }
      } else {
        notify.error("Save failed", data.error || "Couldn’t write project");
      }
    } catch (error) {
      notify.error(
        "Save failed",
        error instanceof Error ? error.message : "Unexpected error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string, name: string) {
    const okConfirm = await notify.confirm({
      title: `Delete ${name}?`,
      description: "This permanently removes the project and its cover.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!okConfirm) return;
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/projects/${id}`, {
      method: "DELETE",
    });
    if (!ok) {
      notify.error("Delete failed", data.error || "Try again");
      return;
    }
    notify.success("Project deleted");
    if (activeId === id) {
      setActiveId(null);
      setView("list");
    }
    await load();
  }

  async function translateWithAi(opts: TranslateOptions) {
    if (!project || opts.target === locale) return;
    setTranslating(true);
    try {
      const include = (field: TranslateField) =>
        opts.mode === "all" || opts.fields.has(field);

      const content: Record<string, unknown> = {};
      if (include("title") && translation.title) content.title = translation.title;
      if (include("tagline") && translation.tagline) content.tagline = translation.tagline;
      if (include("description") && translation.description) {
        content.description = translation.description;
      }
      if (include("features") && translation.features) {
        content.features = translation.features;
      }
      if (include("timeline") && translation.timeline) {
        content.timeline = translation.timeline;
      }
      // Keep role/scope with tagline/title context when translating all
      if (opts.mode === "all") {
        if (translation.role) content.role = translation.role;
        if (translation.scope) content.scope = translation.scope;
      }

      const { ok, data } = await fetchJson<{
        success?: boolean;
        error?: string;
        data?: LocaleFields;
      }>("/api/ai/translate/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage: locale,
          targetLanguage: opts.target,
          model: opts.model,
          mode: "fields",
          projectSlug: project.slug,
          content,
        }),
      });
      if (!ok || !data.success || !data.data) {
        throw new Error(data.error || "Translate failed");
      }
      const translated = data.data;
      const existing = project.translations?.[opts.target];
      markDirty();
      setProjects((prev) =>
        prev.map((row) => {
          if (row.id !== project.id) return row;
          return {
            ...row,
            translations: {
              ...row.translations,
              [opts.target]: {
                title: include("title")
                  ? (translated.title ?? translation.title)
                  : (existing?.title ?? ""),
                tagline: include("tagline")
                  ? (translated.tagline ?? translation.tagline)
                  : (existing?.tagline ?? ""),
                role:
                  opts.mode === "all"
                    ? (translated.role ?? translation.role)
                    : (existing?.role ?? translation.role),
                scope:
                  opts.mode === "all"
                    ? (translated.scope ?? translation.scope)
                    : (existing?.scope ?? translation.scope),
                description: include("description")
                  ? (translated.description ?? translation.description)
                  : (existing?.description ?? ""),
                features: include("features")
                  ? (translated.features ?? translation.features)
                  : (existing?.features ?? []),
                timeline: include("timeline")
                  ? (translated.timeline ?? translation.timeline)
                  : (existing?.timeline ?? null),
              },
            },
          };
        })
      );
      setLocale(opts.target);
      notify.success(
        "Translation drafted",
        `${locale.toUpperCase()} → ${opts.target.toUpperCase()}. Review, then Save.`
      );
    } catch (error) {
      notify.error("Translate failed", error instanceof Error ? error.message : "Try again");
    } finally {
      setTranslating(false);
    }
  }

  async function uploadImage(file: File, folder: string) {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const { ok, data } = await fetchJson<{ url?: string; error?: string }>(
      "/api/cms/upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder }),
      }
    );
    if (!ok || !data.url) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  async function onCoverPick(file: File | null) {
    if (!file || !project) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "coverimage");
      patchProject({ coverImage: url });
      notify.info("Cover on R2", "Click Save to publish");
    } catch (error) {
      notify.error("Upload failed", error instanceof Error ? error.message : "Try again");
    } finally {
      setUploading(false);
    }
  }

  function onCoverUrl(url: string) {
    if (!url.trim()) return;
    patchProject({ coverImage: url.trim() });
    notify.info("Cover selected", "Click Save to publish");
  }

  async function onUploadAsset(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, "cover-assets");
      notify.info("Asset on R2", "Click Save to publish the SVG cover");
      return url;
    } catch (error) {
      notify.error("Upload failed", error instanceof Error ? error.message : "Try again");
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function createType() {
    if (!newTypeName.trim()) return;
    setSavingType(true);
    const { ok, data } = await fetchJson<{ error?: string }>("/api/project-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newTypeName.trim(), color: newTypeColor }),
    });
    setSavingType(false);
    if (!ok) {
      notify.error("Create type failed", data.error || "Try again");
      return;
    }
    notify.success("Type created", newTypeName.trim());
    setNewTypeName("");
    setNewTypeColor(DEFAULT_TYPE_COLOR);
    setShowNewType(false);
    await load();
  }

  async function patchType(
    id: string,
    patch: { type?: string; color?: string }
  ) {
    const current = types.find((t) => t.id === id);
    if (!current) return false;
    const nextType = (patch.type ?? current.type).trim();
    const nextColor = patch.color ?? current.color;
    if (!nextType) {
      notify.error("Update failed", "Type name can’t be empty");
      return false;
    }
    if (nextType === current.type && nextColor === current.color) return true;

    setSavingType(true);
    // Optimistic UI
    setTypes((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, type: nextType, color: nextColor } : row
      )
    );
    const { ok, data } = await fetchJson<{ error?: string }>(
      `/api/project-types/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: nextType, color: nextColor }),
      }
    );
    setSavingType(false);
    if (!ok) {
      notify.error("Update failed", data.error || "Try again");
      await load();
      return false;
    }
    const renamed = nextType !== current.type;
    const recolored = nextColor !== current.color;
    if (renamed && recolored) {
      notify.success("Type updated", nextType);
    } else if (renamed) {
      notify.success("Type renamed", nextType);
    } else if (recolored) {
      notify.success("Color updated", colorLabel(nextColor));
    } else {
      notify.success("Type updated");
    }
    return true;
  }

  async function commitNameEdit(id: string) {
    const ok = await patchType(id, { type: editTypeName });
    if (ok) setNameEditId(null);
  }

  function cancelNameEdit() {
    setEditTypeName(nameEditBaseline);
    setNameEditId(null);
  }

  async function pickTypeColor(id: string, color: string) {
    setColorPickerId(null);
    await patchType(id, { color });
  }

  async function deleteType(id: string) {
    const okConfirm = await notify.confirm({
      title: "Delete this project type?",
      description: "Projects using it will keep their data but lose the type link.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!okConfirm) return;
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/project-types/${id}`, {
      method: "DELETE",
    });
    if (!ok) {
      notify.error("Delete failed", data.error || "Try again");
      return;
    }
    notify.success("Type deleted");
    await load();
  }

  if (view === "cover" && project) {
    const cover = resolveCover(project.coverImage, project.slug);
    const fontId = normalizeCoverFont(project.coverFont);
    return (
      <div className="cms-cover-editor cms-cover-editor--canva">
        <CoverFontLoader fontIds={[fontId]} />
        <CoverBrandComposer
          coverUrl={cover}
          logoUrl={project.logo}
          text={project.coverText || ""}
          fontId={project.coverFont}
          layout={project.coverBrand}
          projectLabel={project.name || project.slug}
          dirty={dirty}
          saving={saving}
          uploading={uploading}
          onTextChange={(coverText) => patchProject({ coverText })}
          onFontChange={(coverFont) => patchProject({ coverFont })}
          onLayoutChange={(coverBrand) => patchProject({ coverBrand })}
          onClearLogo={() => patchProject({ logo: null })}
          onUploadAsset={onUploadAsset}
          onCoverPick={onCoverPick}
          onCoverUrl={onCoverUrl}
          onBack={() => {
            void (async () => {
              if (!(await confirmLeave())) return;
              setView("list");
              setDirty(false);
            })();
          }}
          onEditDetail={() => {
            void (async () => {
              if (!(await confirmLeave())) return;
              openEdit(project.id);
            })();
          }}
          onSave={() => void save()}
        />
      </div>
    );
  }

  if (view === "edit" && project) {
    const cover = resolveCover(project.coverImage, project.slug);
    return (
      <div className="hq-cs-cms-shell">
        <div className="hq-cs-cms-toolbar">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (!(await confirmLeave())) return;
                  setView("list");
                  setDirty(false);
                })();
              }}
              className="inline-flex items-center gap-2 text-sm text-[var(--cms-ink-2)] hover:text-[var(--cms-ink)]"
            >
              <ArrowLeft className="size-4" /> Projects
            </button>
            <span className="text-[var(--cms-ink-3)]">/</span>
            <span className="text-sm font-semibold tracking-tight text-[var(--cms-ink)]">
              Detail
            </span>
            <span className="text-[var(--cms-ink-3)]">·</span>
            <span className="text-sm text-[var(--cms-ink-2)]">
              {project.name || project.slug}
            </span>
            <span className="rounded-md border border-[var(--cms-line)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--cms-ink-3)]">
              {locale}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full"
                onClick={() => {
                  void (async () => {
                    if (!(await confirmLeave())) return;
                    openCover(project.id);
                  })();
                }}
              >
                Edit cover
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-red-600"
                onClick={() => removeProject(project.id, project.name)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

        </div>

        <div className="hq-cs-cms-canvas">
          <ProjectCaseStudyEditor
            locale={locale}
            title={translation.title}
            tagline={translation.tagline || ""}
            role={translation.role || ""}
            description={translation.description}
            features={translation.features}
            timeline={translation.timeline}
            techStack={project.techStack}
            links={project.links}
            screenshots={project.screenshots}
            galleryLayout={project.galleryLayout || "bento"}
            coverUrl={cover}
            slug={project.slug}
            year={project.year}
            category={project.projectType?.type || "Project"}
            projectTypes={types}
            projectTypeId={project.projectType?.id || ""}
            isNda={Boolean(project.isNda)}
            uploading={uploading}
            onTitleChange={(title) => patchTranslation({ title })}
            onTaglineChange={(tagline) => patchTranslation({ tagline })}
            onRoleChange={(role) => patchTranslation({ role })}
            onSlugChange={(slug) => patchProject({ slug })}
            onYearChange={(year) => patchProject({ year })}
            onProjectTypeChange={(id) => {
              const next = types.find((t) => t.id === id);
              patchProject({
                projectType: next
                  ? {
                      id: next.id,
                      name: next.type,
                      type: next.type,
                      color: next.color,
                    }
                  : null,
              });
            }}
            onDescriptionChange={(description) =>
              patchTranslation({ description })
            }
            onFeaturesChange={(features) => patchTranslation({ features })}
            onTimelineChange={(timeline) => patchTranslation({ timeline })}
            onTechStackChange={(techStack) => patchProject({ techStack })}
            onLinksChange={(links) => patchProject({ links })}
            onScreenshotsChange={(screenshots) => patchProject({ screenshots })}
            onGalleryLayoutChange={(galleryLayout) =>
              patchProject({ galleryLayout })
            }
            onCoverPick={onCoverPick}
            onCoverUrl={onCoverUrl}
          />
        </div>

        <ProjectEditorPanel
          currentLang={locale}
          onLangChange={changeLocale}
          isPublished={project.isPublished}
          onPublishToggle={() =>
            patchProject({ isPublished: !project.isPublished })
          }
          featured={Boolean(project.featured)}
          onFeaturedToggle={() =>
            patchProject({ featured: !project.featured })
          }
          isNda={Boolean(project.isNda)}
          onNdaToggle={() => patchProject({ isNda: !project.isNda })}
          onTranslate={translateWithAi}
          translating={translating}
        />

        <CmsFloatingSave
          visible={dirty}
          saving={saving}
          onSave={() => void save()}
          onCancel={() => void cancelEdits()}
        />
      </div>
    );
  }

  return (
    <div>
      <CmsHeader
        eyebrow="Projects"
        title="Projects"
        subtitle="Click card → edit detail · hover → Edit cover"
      />

      <CmsTabs
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "projects",
            label: "Projects",
            hint: "Cards & case studies",
            icon: FolderOpen,
            count: loading ? null : projects.length,
          },
          {
            id: "types",
            label: "Types",
            hint: "Categories & colors",
            icon: Tags,
            count: loading ? null : types.length,
          },
        ]}
      />

      {tab === "projects" ? (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="cms-arc-search w-full sm:max-w-sm">
              <Search className="cms-arc-search__icon" aria-hidden />
              <ArcInput
                label="Search projects"
                hideLabel
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="rounded-full" onClick={createProject}>
              <Plus className="size-4" /> Add Project
            </Button>
          </div>

          {loading ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">Loading projects…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">No projects found</p>
          ) : (
            <>
              <CoverFontLoader
                fontIds={filtered.map((p) => p.coverFont || "inter")}
              />
              <div className="cms-feat-grid mt-8">
                {filtered.map((item) => {
                  const cover = resolveCover(item.coverImage, item.slug);
                  const detailTitle =
                    item.translations?.en?.title?.trim() || item.name;
                  const coverText = item.coverText?.trim() || "";
                  const summary = summaryFromDescription(
                    item.translations?.en?.description
                  );
                  const fontId = normalizeCoverFont(item.coverFont);
                  return (
                    <article key={item.id} className="hq-feat-slide cms-feat-slide">
                      <button
                        type="button"
                        className="hq-feat-card cms-feat-card"
                        onClick={() => openEdit(item.id)}
                        aria-label={`Edit detail · ${detailTitle}`}
                      >
                        <div className="hq-feat-media">
                          {cover ? (
                            isVideoUrl(cover) ? (
                              <video
                                src={cover}
                                muted
                                loop
                                playsInline
                                autoPlay
                                preload="metadata"
                                className="hq-feat-img"
                                aria-hidden
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" className="hq-feat-img" />
                            )
                          ) : (
                            <div className="hq-feat-img hq-feat-img--fallback" />
                          )}
                          <span className="hq-feat-veil" aria-hidden="true" />
                          <CoverBrandMark
                            key={item.coverBrandSvg?.slice(0, 96) || item.id}
                            layout={normalizeCoverBrand(item.coverBrand)}
                            text={coverText}
                            logoUrl={item.logo}
                            fontId={fontId}
                            svgMarkup={item.coverBrandSvg}
                          />
                          <span
                            className={cn(
                              "cms-feat-card__status",
                              item.isPublished ? "is-live" : "is-draft"
                            )}
                          >
                            {item.isPublished ? "Live" : "Draft"}
                          </span>
                        </div>

                        <div className="hq-feat-panel">
                          <p className="hq-feat-panel-title">{detailTitle}</p>
                          {summary ? (
                            <p className="hq-feat-desc">{summary}</p>
                          ) : null}
                          <p className="hq-feat-type">
                            {item.projectType?.type || "Project"}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="cms-feat-card__cover-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCover(item.id);
                        }}
                      >
                        Edit cover
                      </button>
                      <button
                        type="button"
                        className="cms-feat-card__delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeProject(item.id, item.name);
                        }}
                        aria-label={`Delete ${detailTitle}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 flex justify-end">
            <Button
              className="rounded-full"
              onClick={() => {
                setShowNewType((v) => !v);
                setColorPickerId(null);
                setNameEditId(null);
              }}
            >
              <Plus className="size-4" /> New Type
            </Button>
          </div>

          {showNewType ? (
            <div className="cms-type-form">
              <h2 className="cms-type-form__title">Create New Type</h2>
              <label className="cms-type-form__field">
                <span>Type Name</span>
                <Input
                  autoFocus
                  className="h-10 rounded-full px-4"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createType()}
                  placeholder="e.g. Website, Mobile App, API"
                />
              </label>
              <div className="cms-type-form__field">
                <span>Color</span>
                <TypeColorPicker
                  value={newTypeColor}
                  onChange={setNewTypeColor}
                />
              </div>
              <div className="cms-type-form__actions">
                <Button
                  className="rounded-full"
                  disabled={!newTypeName.trim() || savingType}
                  onClick={createType}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowNewType(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className="cms-type-table">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="cms-type-table__col-color">Color</th>
                  <th>Type Name</th>
                  <th className="w-20 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="cms-type-table__empty">
                      No project types yet. Click “New Type”.
                    </td>
                  </tr>
                ) : (
                  types.map((pt) => {
                    const colorOpen = colorPickerId === pt.id;
                    const nameEditing = nameEditId === pt.id;
                    return (
                      <tr
                        key={pt.id}
                        className={cn(
                          colorOpen && "is-color-open",
                          nameEditing && "is-name-editing"
                        )}
                      >
                        <td className="cms-type-table__col-color">
                          <InlineTypeColor
                            value={pt.color}
                            open={colorOpen}
                            disabled={savingType}
                            onToggle={() => {
                              setNameEditId(null);
                              setColorPickerId((cur) =>
                                cur === pt.id ? null : pt.id
                              );
                            }}
                            onClose={() => setColorPickerId(null)}
                            onPick={(hex) => void pickTypeColor(pt.id, hex)}
                          />
                        </td>
                        <td>
                          <div className="cms-type-table__name-cell">
                            <InlineTypeName
                              value={
                                nameEditing ? editTypeName : pt.type
                              }
                              editing={nameEditing}
                              disabled={savingType}
                              onStart={() => {
                                setColorPickerId(null);
                                setNameEditId(pt.id);
                                setEditTypeName(pt.type);
                                setNameEditBaseline(pt.type);
                              }}
                              onChange={setEditTypeName}
                              onCommit={() => void commitNameEdit(pt.id)}
                              onCancel={cancelNameEdit}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="cms-type-table__row-actions">
                            <button
                              type="button"
                              className="cms-type-table__icon is-danger"
                              onClick={() => deleteType(pt.id)}
                              aria-label={`Delete ${pt.type}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
