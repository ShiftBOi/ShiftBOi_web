"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectLivePreview } from "@/components/cms/project-live-preview";
import {
  ProjectImagePicker,
  asMedia,
  emptyBand,
  emptyDetailHighlight,
  emptyDetailSection,
  resolveBands,
  resolveDetails,
  splitDetails,
  type DetailBlock,
  type EditableField,
  type ProjectDraft,
} from "@/components/cms/project-editor-primitives";
import { usesRevealHero } from "@/lib/project-draft";

type MediaField =
  | "coverImage"
  | "introSrc"
  | "titleIcon"
  | "heroMedia"
  | "heroPoster"
  | `bandMedia:${number}`
  | `bandPoster:${number}`;

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
    bands: draft.bands,
    techStack: draft.techStack,
    visibility: draft.visibility,
    featured: draft.featured,
    published: draft.published,
    details: draft.details,
  });
}

function normalizeProject(project: ProjectDraft): ProjectDraft {
  const media = asMedia(project.media);
  const details = resolveDetails({
    details: project.details,
    highlights: project.highlights,
    sections: project.sections,
  });
  const split = splitDetails(details);
  return {
    ...project,
    media,
    bands: resolveBands({
      bands: project.bands,
      media,
      heroTitle: project.heroTitle,
      heroBody: project.heroBody,
    }),
    details,
    highlights: split.highlights,
    sections: split.sections,
  };
}

function parseBandIndex(field: MediaField): number | null {
  const match = /^(?:bandMedia|bandPoster):(\d+)$/.exec(field);
  return match ? Number(match[1]) : null;
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
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  const dirty = serialize(draft) !== baseline;
  const revealOn = usesRevealHero(draft.media);

  useEffect(() => {
    const next = normalizeProject(project);
    setDraft(next);
    setBaseline(serialize(next));
  }, [project]);

  useEffect(() => {
    if (!toolsOpen) return;
    function onPointer(e: MouseEvent) {
      if (!toolsRef.current?.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setToolsOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [toolsOpen]);

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
      const firstBand = draft.bands[0];
      const split = splitDetails(draft.details);
      const projectId = draft.id || project.id;
      const res = await fetch(`/api/cms/projects/${encodeURIComponent(projectId)}`, {
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
          heroTitle: draft.heroTitle || firstBand?.title || null,
          heroBody: draft.heroBody || firstBand?.body || null,
          media: draft.media,
          bands: draft.bands,
          techStack: draft.techStack,
          visibility: draft.visibility,
          featured: draft.featured,
          published: draft.published,
          details: draft.details,
          highlights: split.highlights,
          sections: split.sections,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Save failed");
      // Keep draft id in sync if API resolved via slug fallback
      if (body.project?.id && body.project.id !== draft.id) {
        setDraft((d) => ({ ...d, id: body.project.id }));
      }
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

  function setHeroLayout(mode: "reveal" | "split") {
    if (mode === "reveal") {
      const src = draft.media?.src || draft.media?.colorSrc || draft.coverImage || "";
      if (!src) {
        setImageField("heroMedia");
        setEditing("heroMedia");
        return;
      }
      patch("media", {
        type: draft.media?.type === "image" ? "image" : "video",
        src: draft.media?.src || src,
        poster: draft.media?.poster,
        colorSrc: draft.media?.colorSrc || src,
        bwSrc: draft.media?.bwSrc || src,
      });
      return;
    }

    // Split / boxes mode — clear reveal pair only
    if (draft.media) {
      const nextMedia: typeof draft.media = {
        type: draft.media.type,
        src: draft.media.src,
        poster: draft.media.poster,
      };
      patch("media", nextMedia.src ? nextMedia : null);
    }
    if (draft.bands.length === 0) {
      patch("bands", [
        {
          ...emptyBand(),
          title: draft.heroTitle || "New media box",
          body: draft.heroBody || "Describe this block.",
          media: draft.media?.src
            ? {
                type: draft.media.type,
                src: draft.media.src,
                poster: draft.media.poster,
              }
            : null,
        },
      ]);
    }
  }

  function applyMedia(url: string, meta?: { kind: "image" | "video" }) {
    if (!imageField) return;
    const kind = meta?.kind ?? "image";

    if (imageField === "heroMedia") {
      if (!url) {
        patch("media", null);
        return;
      }
      // Reveal hero: always set color + bw pair
      patch("media", {
        type: kind,
        src: url,
        poster: draft.media?.poster,
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
      if (!draft.media?.src && !draft.media?.colorSrc) return;
      patch("media", {
        type: draft.media?.type ?? "video",
        src: draft.media?.src || draft.media?.colorSrc || url,
        poster: url || undefined,
        colorSrc: draft.media?.colorSrc,
        bwSrc: draft.media?.bwSrc,
      });
      return;
    }

    const bandIndex = parseBandIndex(imageField);
    if (bandIndex !== null) {
      const bands = [...draft.bands];
      const current = bands[bandIndex];
      if (!current) return;

      if (imageField.startsWith("bandPoster:")) {
        if (!current.media?.src) return;
        bands[bandIndex] = {
          ...current,
          media: { ...current.media, poster: url || undefined },
        };
        patch("bands", bands);
        return;
      }

      bands[bandIndex] = {
        ...current,
        media: url
          ? {
              type: kind,
              src: url,
              poster: current.media?.poster,
            }
          : null,
      };
      patch("bands", bands);
      return;
    }

    if (
      imageField === "coverImage" ||
      imageField === "introSrc" ||
      imageField === "titleIcon"
    ) {
      patch(imageField, url || null);
      if (imageField === "coverImage" && !draft.introSrc) {
        patch("introSrc", url || null);
      }
    }
  }

  function addBand() {
    patch("bands", [...draft.bands, emptyBand()]);
  }

  function removeBand(index: number) {
    const next = draft.bands.filter((_, i) => i !== index);
    patch("bands", next);
  }

  function setDetails(next: DetailBlock[]) {
    const split = splitDetails(next);
    setDraft((d) => ({
      ...d,
      details: next,
      highlights: split.highlights,
      sections: split.sections,
    }));
  }

  function changeDetail(index: number, detailPatch: Partial<DetailBlock>) {
    setDetails(
      draft.details.map((item, i) =>
        i === index ? ({ ...item, ...detailPatch } as DetailBlock) : item,
      ),
    );
  }

  function removeDetail(index: number) {
    setDetails(draft.details.filter((_, i) => i !== index));
  }

  function addDetailSection() {
    setDetails([...draft.details, emptyDetailSection()]);
  }

  function addDetailHighlight() {
    setDetails([...draft.details, emptyDetailHighlight()]);
  }

  const pickerValue = (() => {
    if (!imageField) return "";
    if (imageField === "heroMedia") return draft.media?.src ?? draft.media?.colorSrc ?? "";
    if (imageField === "heroPoster") return draft.media?.poster ?? "";
    const bandIndex = parseBandIndex(imageField);
    if (bandIndex !== null) {
      const band = draft.bands[bandIndex];
      if (imageField.startsWith("bandPoster:")) return band?.media?.poster ?? "";
      return band?.media?.src ?? "";
    }
    if (
      imageField === "coverImage" ||
      imageField === "introSrc" ||
      imageField === "titleIcon"
    ) {
      return draft[imageField] ?? "";
    }
    return "";
  })();

  const pickerAccept =
    imageField === "heroMedia" ||
    imageField?.startsWith("bandMedia:") ||
    imageField === "heroPoster" ||
    imageField?.startsWith("bandPoster:")
      ? imageField.includes("Poster")
        ? "image"
        : "media"
      : "image";

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
            onAddBand={addBand}
            onRemoveBand={removeBand}
            onReorderDetails={setDetails}
            onChangeDetail={changeDetail}
            onRemoveDetail={removeDetail}
            onAddDetailSection={addDetailSection}
            onAddDetailHighlight={addDetailHighlight}
          />
        </div>

        <div className="cms-editor-tools" ref={toolsRef}>
          <button
            type="button"
            className={`cms-tools-fab${toolsOpen ? " is-open" : ""}`}
            aria-expanded={toolsOpen}
            aria-controls="cms-tools-panel"
            aria-label={toolsOpen ? "Close tools" : "Open tools"}
            onClick={() => setToolsOpen((v) => !v)}
          >
            {toolsOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="17" r="2.5" fill="currentColor" />
              </svg>
            )}
          </button>

          {toolsOpen ? (
            <aside
              id="cms-tools-panel"
              className="cms-editor-rail cms-tools-panel"
              aria-label="Project controls"
            >
          <div className="cms-rail-card">
            <p className="cms-rail-label">Page layout</p>
            <div className="cms-rail-segment cms-rail-segment-stack">
              <button
                type="button"
                className={revealOn ? "is-active" : ""}
                onClick={() => setHeroLayout("reveal")}
              >
                <strong>Behind text</strong>
                <span>Full-bleed hero like Vibesaur</span>
              </button>
              <button
                type="button"
                className={!revealOn ? "is-active" : ""}
                onClick={() => setHeroLayout("split")}
              >
                <strong>Text + boxes</strong>
                <span>Intro copy, then media boxes</span>
              </button>
            </div>
          </div>

          <div className="cms-rail-card">
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
          </div>

          <div className="cms-rail-card">
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
            <p className="cms-rail-hint">
              Selected = full project page. Limited = teaser only.
            </p>
          </div>

          {revealOn ? (
            <div className="cms-rail-card">
              <p className="cms-rail-label">Hero media</p>
              <button
                type="button"
                className="cms-rail-btn"
                onClick={() => {
                  setEditing("heroMedia");
                  setImageField("heroMedia");
                }}
              >
                <span>
                  {draft.media?.src || draft.media?.colorSrc
                    ? draft.media?.type === "video"
                      ? "Video set"
                      : "Image set"
                    : "Add image / video"}
                </span>
                <i />
              </button>
              <p className="cms-rail-hint">Plays behind the overview text.</p>
            </div>
          ) : null}

          <div className="cms-rail-card">
            <div className="cms-rail-card-head">
              <p className="cms-rail-label">Media boxes</p>
              <span className="cms-rail-count">{draft.bands.length}</span>
            </div>
            <p className="cms-rail-hint cms-rail-hint-tight">
              Same split pattern everywhere — media left, copy right.
            </p>

            {draft.bands.length === 0 ? (
              <p className="cms-rail-empty">No boxes yet. Purple stripes show until you add media.</p>
            ) : (
              <ul className="cms-rail-band-list">
                {draft.bands.map((band, index) => (
                  <li key={band.id}>
                    <button
                      type="button"
                      className="cms-rail-band-item"
                      onClick={() => {
                        setEditing(`band:${index}:title`);
                        document
                          .querySelector(`[data-field="band:${index}:title"]`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      <span className="cms-rail-band-thumb" aria-hidden>
                        {band.media?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={band.media.poster || band.media.src} alt="" />
                        ) : (
                          <i />
                        )}
                      </span>
                      <span className="cms-rail-band-meta">
                        <strong>{band.title || `Box ${index + 1}`}</strong>
                        <em>{band.media?.src ? "Media set" : "No media · placeholder"}</em>
                      </span>
                    </button>
                    <div className="cms-rail-band-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(`bandMedia:${index}`);
                          setImageField(`bandMedia:${index}`);
                        }}
                      >
                        Media
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => removeBand(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className="cms-rail-add" onClick={addBand}>
              + Add media box
            </button>
          </div>

          <div className="cms-rail-card">
            <div className="cms-rail-card-head">
              <p className="cms-rail-label">Text sections</p>
              <span className="cms-rail-count">{draft.details.length}</span>
            </div>
            <p className="cms-rail-hint cms-rail-hint-tight">
              Drag the ··· handle in the preview to reorder. Divider pattern matches the live page.
            </p>

            {draft.details.length === 0 ? (
              <p className="cms-rail-empty">No sections yet. Add one to start writing.</p>
            ) : (
              <ul className="cms-rail-band-list">
                {draft.details.map((block, index) => (
                  <li key={block.id}>
                    <button
                      type="button"
                      className="cms-rail-band-item"
                      onClick={() => {
                        setEditing(`detail:${index}:title`);
                        document
                          .querySelector(`[data-field="detail:${index}:title"]`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      <span className="cms-rail-band-meta">
                        <strong>{block.title || `Section ${index + 1}`}</strong>
                        <em>
                          {block.kind === "highlight" ? "Highlight" : "Text"} · drag in preview
                        </em>
                      </span>
                    </button>
                    <div className="cms-rail-band-actions">
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => removeDetail(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className="cms-rail-add" onClick={addDetailSection}>
              + Add text section
            </button>
          </div>
            </aside>
          ) : null}
        </div>
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
                : imageField === "heroPoster" || imageField.startsWith("bandPoster:")
                  ? "Video poster"
                  : imageField === "heroMedia"
                    ? "Hero image or video"
                    : imageField.startsWith("bandMedia:")
                      ? "Box image or video"
                      : "Cover image"
          }
          folder={
            imageField === "titleIcon"
              ? "icons"
              : imageField === "introSrc"
                ? "intro"
                : imageField.includes("Poster")
                  ? "poster"
                  : imageField === "heroMedia"
                    ? "hero"
                    : imageField.startsWith("bandMedia:")
                      ? "band"
                      : "coverimage"
          }
          accept={pickerAccept}
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
