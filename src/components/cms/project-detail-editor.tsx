"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectLivePreview } from "@/components/cms/project-live-preview";
import {
  ProjectImagePicker,
  asHighlights,
  asMedia,
  asSections,
  type EditableField,
  type ProjectDraft,
} from "@/components/cms/project-editor-primitives";

type MediaField = "coverImage" | "introSrc" | "titleIcon" | "heroMedia" | "heroPoster";

function serialize(draft: ProjectDraft) {
  return JSON.stringify({
    slug: draft.slug,
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    year: draft.year,
    role: draft.role,
    coverImage: draft.coverImage,
    introSrc: draft.introSrc,
    titleIcon: draft.titleIcon,
    thesisLead: draft.thesisLead,
    thesisHighlight: draft.thesisHighlight,
    thesisRest: draft.thesisRest,
    thesisBody: draft.thesisBody,
    heroMetric: draft.heroMetric,
    heroMetricLabel: draft.heroMetricLabel,
    heroTitle: draft.heroTitle,
    heroBody: draft.heroBody,
    media: draft.media,
    techStack: draft.techStack,
    visibility: draft.visibility,
    featured: draft.featured,
    published: draft.published,
    highlights: draft.highlights,
    sections: draft.sections,
  });
}

function normalizeProject(project: ProjectDraft): ProjectDraft {
  return {
    ...project,
    media: asMedia(project.media),
    highlights: asHighlights(project.highlights),
    sections: asSections(project.sections),
  };
}

export function ProjectDetailEditor({ project }: { project: ProjectDraft }) {
  const router = useRouter();
  const initial = normalizeProject(project);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(() => serialize(initial));
  const [editing, setEditing] = useState<EditableField>(null);
  const [imageField, setImageField] = useState<MediaField | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = serialize(draft) !== baseline;

  useEffect(() => {
    const next = normalizeProject(project);
    setDraft(next);
    setBaseline(serialize(next));
  }, [project]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving, draft]);

  function patch<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/projects/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug,
          title: draft.title,
          summary: draft.summary,
          description: draft.description || draft.summary,
          year: draft.year,
          role: draft.role,
          coverImage: draft.coverImage || null,
          introSrc: draft.introSrc || draft.coverImage || null,
          titleIcon: draft.titleIcon || null,
          thesisLead: draft.thesisLead,
          thesisHighlight: draft.thesisHighlight,
          thesisRest: draft.thesisRest,
          thesisBody: draft.thesisBody,
          heroMetric: draft.heroMetric,
          heroMetricLabel: draft.heroMetricLabel,
          heroTitle: draft.heroTitle,
          heroBody: draft.heroBody,
          media: draft.media,
          techStack: draft.techStack,
          visibility: draft.visibility,
          featured: draft.featured,
          published: draft.published,
          highlights: draft.highlights,
          sections: draft.sections,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Save failed");
      setBaseline(serialize(draft));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(normalizeProject(project));
    setBaseline(serialize(normalizeProject(project)));
    setEditing(null);
    setError(null);
  }

  async function remove() {
    if (!confirm(`Delete “${draft.title}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/cms/projects/${draft.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    router.push("/cms/projects");
    router.refresh();
  }

  function applyMedia(url: string, meta?: { kind: "image" | "video" }) {
    if (!imageField) return;

    if (imageField === "heroMedia") {
      if (!url) {
        patch("media", null);
        return;
      }
      const kind = meta?.kind ?? "image";
      patch("media", {
        type: kind,
        src: url,
        poster: draft.media?.poster,
        // Keep live-site reveal layout (media behind text)
        colorSrc: url,
        bwSrc: draft.media?.bwSrc || url,
      });
      if (kind === "image") {
        patch("coverImage", url);
        if (!draft.introSrc) patch("introSrc", url);
      }
      return;
    }

    if (imageField === "heroPoster") {
      if (!draft.media?.src) return;
      patch("media", {
        ...draft.media,
        poster: url || undefined,
      });
      return;
    }

    patch(imageField, url || null);
    if (imageField === "coverImage" && !draft.introSrc) {
      patch("introSrc", url || null);
    }
  }

  const pickerValue =
    imageField === "heroMedia"
      ? draft.media?.src ?? ""
      : imageField === "heroPoster"
        ? draft.media?.poster ?? ""
        : imageField
          ? draft[imageField] ?? ""
          : "";

  return (
    <div className={`cms-project-editor${dirty ? " is-dirty" : ""}`}>
      <div className="cms-project-subheader">
        <div className="cms-project-subheader-left">
          <Link href="/cms/projects" className="cms-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Projects
          </Link>
          <div>
            <p className="cms-project-subheader-slug">/{draft.slug}</p>
            <h2 className="cms-project-subheader-title">{draft.title}</h2>
          </div>
        </div>
        <div className="cms-project-subheader-actions">
          {draft.published ? (
            <Link
              href={`/projects/${draft.slug}`}
              className="cms-btn cms-btn-ghost"
              target="_blank"
              rel="noopener"
            >
              View live
            </Link>
          ) : (
            <span className="cms-btn cms-btn-ghost is-disabled" aria-disabled>
              Draft
            </span>
          )}
          <button type="button" className="cms-btn cms-btn-ghost is-danger" onClick={() => void remove()}>
            Delete
          </button>
        </div>
      </div>

      <div className="cms-project-editor-stage">
        <div
          className="cms-project-preview-wrap"
          onClick={() => {
            if (editing) setEditing(null);
          }}
        >
          <ProjectLivePreview
            draft={draft}
            editing={editing}
            onEdit={setEditing}
            onChange={patch}
            onDone={() => setEditing(null)}
            onPickImage={(field) => {
              setEditing(field);
              setImageField(field);
            }}
          />
        </div>

        <aside className="cms-editor-rail" aria-label="Project controls">
          <p className="cms-rail-label">Status</p>

          <button
            type="button"
            className={`cms-rail-btn${draft.published ? " is-on" : ""}`}
            onClick={() => patch("published", !draft.published)}
          >
            <span>{draft.published ? "Published" : "Draft"}</span>
            <i />
          </button>

          <button
            type="button"
            className={`cms-rail-btn${draft.featured ? " is-accent" : ""}`}
            onClick={() => patch("featured", !draft.featured)}
          >
            <span>Featured</span>
            <i />
          </button>

          <p className="cms-rail-label">Visibility</p>
          <div className="cms-rail-segment">
            <button
              type="button"
              className={draft.visibility === "PUBLIC" ? "is-active" : ""}
              onClick={() => patch("visibility", "PUBLIC")}
            >
              Selected
            </button>
            <button
              type="button"
              className={draft.visibility === "CONFIDENTIAL" ? "is-active" : ""}
              onClick={() => patch("visibility", "CONFIDENTIAL")}
            >
              Limited
            </button>
          </div>

          <p className="cms-rail-label">Hero media</p>
          <button
            type="button"
            className="cms-rail-btn"
            onClick={() => {
              setEditing("heroMedia");
              setImageField("heroMedia");
            }}
          >
            <span>{draft.media?.src ? (draft.media.type === "video" ? "Video set" : "Image set") : "Add image / video"}</span>
            <i />
          </button>

          <p className="cms-rail-hint">
            Click the hero frame to upload an image or video. Save when ready.
          </p>
        </aside>
      </div>

      {dirty ? (
        <div className="cms-save-bar">
          <div className="cms-save-bar-inner">
            <p>
              <span className="cms-save-dot" aria-hidden />
              Unsaved changes
            </p>
            {error ? <p className="cms-error">{error}</p> : null}
            <div className="cms-save-bar-actions">
              <button type="button" className="cms-btn cms-btn-ghost" disabled={saving} onClick={cancel}>
                Cancel
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {imageField ? (
        <ProjectImagePicker
          title={
            imageField === "titleIcon"
              ? "Title icon"
              : imageField === "introSrc"
                ? "Intro image"
                : imageField === "heroPoster"
                  ? "Video poster"
                  : imageField === "heroMedia"
                    ? "Hero image or video"
                    : "Cover image"
          }
          folder={
            imageField === "titleIcon"
              ? "icons"
              : imageField === "introSrc"
                ? "intro"
                : imageField === "heroPoster"
                  ? "poster"
                  : imageField === "heroMedia"
                    ? "hero"
                    : "coverimage"
          }
          accept={imageField === "heroMedia" ? "media" : "image"}
          value={pickerValue}
          onChange={applyMedia}
          onClose={() => {
            setImageField(null);
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
