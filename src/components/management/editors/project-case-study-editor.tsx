"use client";

import { ContentBlocksEditor } from "@/components/management/content-blocks-editor";
import { GalleryBlocksEditor } from "@/components/management/gallery-blocks-editor";
import { R2Finder } from "@/components/management/r2-finder";
import { RichTextField } from "@/components/management/rich-text-field";
import { CaseStudyCollapse } from "@/components/projects/case-study-collapse";
import { CaseStudyStepper } from "@/components/projects/case-study-stepper";
import { isVideoUrl } from "@/lib/media-url";
import {
  formatTimelineDate,
  normalizeFeaturesForEditor,
  normalizeLinksForEditor,
  normalizeTechStack,
  normalizeTimelineForEditor,
  type GalleryItem,
  type GalleryLayout,
  type GalleryModule,
} from "@/lib/projects";
import { FolderOpen, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";

type TechStack = { frontend: string[]; backend: string[] };

export function ProjectCaseStudyEditor({
  locale,
  title,
  tagline,
  role,
  description,
  features,
  timeline,
  techStack,
  links,
  screenshots,
  galleryLayout,
  coverUrl,
  slug,
  year,
  category,
  projectTypes = [],
  projectTypeId = "",
  isNda,
  onTitleChange,
  onTaglineChange,
  onRoleChange,
  onSlugChange,
  onYearChange,
  onProjectTypeChange,
  onDescriptionChange,
  onFeaturesChange,
  onTimelineChange,
  onTechStackChange,
  onLinksChange,
  onScreenshotsChange,
  onGalleryLayoutChange,
  onCoverPick,
  onCoverUrl,
  uploading,
}: {
  locale: string;
  title: string;
  tagline: string;
  role: string;
  description: string;
  features: unknown;
  timeline: unknown;
  techStack: unknown;
  links: unknown;
  screenshots: unknown;
  galleryLayout: string;
  coverUrl: string;
  slug: string;
  year: string;
  category: string;
  projectTypes?: Array<{ id: string; type: string; color: string }>;
  projectTypeId?: string;
  isNda: boolean;
  onTitleChange: (v: string) => void;
  onTaglineChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onProjectTypeChange?: (id: string) => void;
  onDescriptionChange: (v: string) => void;
  onFeaturesChange: (v: { title: string; description: string }[]) => void;
  onTimelineChange: (v: { date: string; info: string }[]) => void;
  onTechStackChange: (v: TechStack) => void;
  onLinksChange: (v: { label: string; url: string }[]) => void;
  onScreenshotsChange: (v: GalleryItem[] | GalleryModule[]) => void;
  onGalleryLayoutChange: (v: GalleryLayout) => void;
  onCoverPick: (file: File | null) => void;
  /** Prefer R2 / device via modal — URL already on R2 */
  onCoverUrl?: (url: string) => void;
  uploading?: boolean;
}) {
  const featureRows = normalizeFeaturesForEditor(features);
  const timelineRows = normalizeTimelineForEditor(timeline);
  const tech = normalizeTechStack(techStack);
  const linkRows = normalizeLinksForEditor(links);
  const [openFeature, setOpenFeature] = useState(0);
  const [chipDraft, setChipDraft] = useState({ frontend: "", backend: "" });
  const [coverFinderOpen, setCoverFinderOpen] = useState(false);

  return (
    <article className="hq-cs hq-cs--cms" data-page="project-detail-cms">
      {/* Hero — cover image only; branding lives in Cover editor */}
      <section className="hq-cs-hero">
        {coverUrl ? (
          isVideoUrl(coverUrl) ? (
            <video
              className="hq-cs-hero-bg"
              src={coverUrl}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hq-cs-hero-bg" src={coverUrl} alt="" />
          )
        ) : (
          <div className="hq-cs-hero-bg hq-cs-hero-bg--empty" aria-hidden />
        )}
        <div className="hq-cs-hero-scrim" aria-hidden />
        <div className="hq-cs-cms-cover-actions">
          <button
            type="button"
            className="hq-cs-cms-cover-btn"
            disabled={uploading}
            onClick={() => setCoverFinderOpen(true)}
          >
            <FolderOpen className="size-3.5" />
            {uploading
              ? "Uploading…"
              : coverUrl
                ? "Change cover"
                : "Add cover"}
          </button>
          <label className="hq-cs-cms-cover-btn hq-cs-cms-cover-btn--ghost">
            <Upload className="size-3.5" />
            Device
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onCoverPick(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="hq-cs-hero-content">
          <div className="hq-cs-title hq-cs-cms-title-wrap">
            <input
              className="hq-cs-cms-title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={`Project title (${locale})`}
            />
            {isNda ? <span className="hq-cs-nda">NDA</span> : null}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="hq-cs-intro">
        <div className="hq-cs-shell">
          <div className="hq-cs-hero-row">
            <div className="hq-cs-hero-lead">
              <p className="hq-cs-cms-field-label">Intro · {locale}</p>
              <RichTextField
                value={tagline}
                onChange={onTaglineChange}
                placeholder="Write the intro tagline…"
                className="hq-cs-cms-rich--notion hq-cs-tagline hq-cs-tagline--rich"
                minHeight={40}
                tone="dark"
              />
            </div>
            <aside className="hq-cs-hero-aside">
              <dl className="hq-cs-hero-meta">
                <div>
                  <dt>Role</dt>
                  <dd>
                    <input
                      className="hq-cs-cms-inline"
                      value={role}
                      onChange={(e) => onRoleChange(e.target.value)}
                      placeholder="Full-stack"
                    />
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>
                    {onProjectTypeChange ? (
                      <select
                        className="hq-cs-cms-inline"
                        value={projectTypeId}
                        onChange={(e) => onProjectTypeChange(e.target.value)}
                      >
                        <option value="">None</option>
                        {projectTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      category || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Year</dt>
                  <dd>
                    <input
                      className="hq-cs-cms-inline"
                      value={year}
                      onChange={(e) => onYearChange(e.target.value)}
                      placeholder="2025"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </dd>
                </div>
                <div>
                  <dt>Slug</dt>
                  <dd>
                    <input
                      className="hq-cs-cms-inline"
                      value={slug}
                      onChange={(e) => onSlugChange(e.target.value)}
                      placeholder="project-slug"
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                  </dd>
                </div>
                <div>
                  <dt>Website</dt>
                  <dd className="hq-cs-hero-meta__links">
                    <ul className="hq-cs-aside-links" style={{ margin: 0 }}>
                      {linkRows.map((row, i) => (
                        <li key={i} className="hq-cs-cms-link-row">
                          <input
                            className="hq-cs-cms-inline"
                            value={row.label}
                            placeholder="Label"
                            onChange={(e) => {
                              const next = [...linkRows];
                              next[i] = { ...row, label: e.target.value };
                              onLinksChange(next);
                            }}
                          />
                          <input
                            className="hq-cs-cms-inline hq-cs-cms-inline--url"
                            value={row.url}
                            placeholder="https://"
                            onChange={(e) => {
                              const next = [...linkRows];
                              next[i] = { ...row, url: e.target.value };
                              onLinksChange(next);
                            }}
                          />
                          <button
                            type="button"
                            className="hq-cs-cms-icon-btn"
                            onClick={() =>
                              onLinksChange(linkRows.filter((_, j) => j !== i))
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="hq-cs-aside-link hq-cs-cms-add"
                      onClick={() =>
                        onLinksChange([
                          ...linkRows,
                          { label: "Website", url: "" },
                        ])
                      }
                    >
                      <Plus className="size-3.5" /> Add link
                    </button>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="hq-cs-block">
        <div className="hq-cs-shell hq-cs-layout">
          <div className="hq-cs-marker">
            <p className="hq-cs-eyebrow">Overview</p>
            <h2 className="hq-cs-heading">About</h2>
          </div>
          <div className="hq-cs-prose hq-cs-cms-prose">
            <ContentBlocksEditor
              description={description}
              onChange={onDescriptionChange}
              tone="dark"
            />
          </div>
        </div>
      </section>

      {/* Features — same CaseStudyCollapse as the live page */}
      <section className="hq-cs-block">
        <div className="hq-cs-shell hq-cs-layout">
          <div className="hq-cs-marker">
            <p className="hq-cs-eyebrow">Features</p>
            <h2 className="hq-cs-heading">Features</h2>
          </div>
          <div className="hq-cs-cms-live cms-blocks cms-blocks--dark">
            <CaseStudyCollapse
              ariaLabel="Features"
              items={featureRows.map((row, i) => ({
                id: `ft-${i}`,
                title: row.title,
                body: row.description,
              }))}
              edit={{
                openIndex: openFeature,
                onOpenChange: setOpenFeature,
                onTitleChange: (i, title) => {
                  const next = [...featureRows];
                  const cur = next[i];
                  if (!cur) return;
                  next[i] = { ...cur, title };
                  onFeaturesChange(next);
                },
                onBodyChange: (i, body) => {
                  const next = [...featureRows];
                  const cur = next[i];
                  if (!cur) return;
                  next[i] = { ...cur, description: body };
                  onFeaturesChange(next);
                },
                onDelete: (i) =>
                  onFeaturesChange(featureRows.filter((_, j) => j !== i)),
                onReorder: (from, to) => {
                  const next = [...featureRows];
                  const [moved] = next.splice(from, 1);
                  if (!moved) return;
                  next.splice(to, 0, moved);
                  onFeaturesChange(next);
                },
              }}
            />
            <div className="cms-blocks__footer">
              <button
                type="button"
                className="cms-blocks__add-line"
                onClick={() => {
                  onFeaturesChange([
                    ...featureRows,
                    { title: "", description: "" },
                  ]);
                  setOpenFeature(featureRows.length);
                }}
              >
                <Plus className="size-3.5" />
                <span>Add feature</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline — same CaseStudyStepper as the live page */}
      <section className="hq-cs-block">
        <div className="hq-cs-shell hq-cs-layout">
          <div className="hq-cs-marker">
            <p className="hq-cs-eyebrow">Timeline</p>
            <h2 className="hq-cs-heading">Timeline</h2>
          </div>
          <div className="hq-cs-cms-live cms-blocks cms-blocks--dark">
            <CaseStudyStepper
              ariaLabel="Timeline"
              items={timelineRows.map((row, i) => ({
                id: `tl-${i}`,
                meta: formatTimelineDate(row.date),
                title: row.info,
                dateValue: row.date,
              }))}
              edit={{
                onDateChange: (i, date) => {
                  const next = [...timelineRows];
                  const cur = next[i];
                  if (!cur) return;
                  next[i] = { ...cur, date };
                  onTimelineChange(next);
                },
                onTitleChange: (i, title) => {
                  const next = [...timelineRows];
                  const cur = next[i];
                  if (!cur) return;
                  next[i] = { ...cur, info: title };
                  onTimelineChange(next);
                },
                onDelete: (i) =>
                  onTimelineChange(timelineRows.filter((_, j) => j !== i)),
              }}
            />
            <div className="cms-blocks__footer">
              <button
                type="button"
                className="cms-blocks__add-line"
                onClick={() =>
                  onTimelineChange([...timelineRows, { date: "", info: "" }])
                }
              >
                <Plus className="size-3.5" />
                <span>Add step</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="hq-cs-block">
        <div className="hq-cs-shell hq-cs-layout">
          <div className="hq-cs-marker">
            <p className="hq-cs-eyebrow">Screenshots</p>
            <h2 className="hq-cs-heading">Screenshots</h2>
          </div>
          <div className="hq-cs-prose">
            <GalleryBlocksEditor
              value={screenshots}
              fallbackLayout={galleryLayout}
              onChange={(mods) => {
                onScreenshotsChange(mods);
                if (mods[0]?.layout) onGalleryLayoutChange(mods[0].layout);
              }}
            />
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="hq-cs-block">
        <div className="hq-cs-shell hq-cs-layout">
          <div className="hq-cs-marker">
            <p className="hq-cs-eyebrow">Tech stack</p>
            <h2 className="hq-cs-heading">Tech stack</h2>
          </div>
          <div className="hq-cs-tech-table-wrap">
            <table className="hq-cs-tech-table">
              <thead>
                <tr>
                  <th scope="col">Layer</th>
                  <th scope="col">Stack</th>
                </tr>
              </thead>
              <tbody>
                {(["frontend", "backend"] as const).map((side) => (
                  <tr key={side}>
                    <th scope="row">{side === "frontend" ? "Frontend" : "Backend"}</th>
                    <td>
                      <div className="hq-cs-chips">
                        {tech[side].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className="hq-cs-chip"
                            title="Remove"
                            onClick={() =>
                              onTechStackChange({
                                ...tech,
                                [side]: tech[side].filter((t) => t !== chip),
                              })
                            }
                          >
                            {chip} ×
                          </button>
                        ))}
                      </div>
                      <div className="hq-cs-cms-chip-add">
                        <input
                          className="hq-cs-cms-inline"
                          placeholder={`Add ${side}`}
                          value={chipDraft[side]}
                          onChange={(e) =>
                            setChipDraft((d) => ({
                              ...d,
                              [side]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            const v = chipDraft[side].trim();
                            if (!v || tech[side].includes(v)) return;
                            onTechStackChange({
                              ...tech,
                              [side]: [...tech[side], v],
                            });
                            setChipDraft((d) => ({ ...d, [side]: "" }));
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <R2Finder
        open={coverFinderOpen}
        folder="coverimage"
        title="Cover image · R2"
        onClose={() => setCoverFinderOpen(false)}
        onSelect={(url) => {
          onCoverUrl?.(url);
          setCoverFinderOpen(false);
        }}
      />
    </article>
  );
}
