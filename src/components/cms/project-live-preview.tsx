"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import {
  EditableRegion,
  PreviewInput,
  asHighlights,
  asSections,
  type EditableField,
  type HighlightItem,
  type ProjectDraft,
  type SectionItem,
} from "@/components/cms/project-editor-primitives";

type Props = {
  draft: ProjectDraft;
  editing: EditableField;
  onEdit: (field: string) => void;
  onChange: <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => void;
  onDone: () => void;
  onPickImage: (field: "coverImage" | "introSrc" | "titleIcon" | "heroMedia" | "heroPoster") => void;
};

function updateHighlight(
  list: HighlightItem[],
  index: number,
  patch: Partial<HighlightItem>,
): HighlightItem[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function updateSection(
  list: SectionItem[],
  index: number,
  patch: Partial<SectionItem>,
): SectionItem[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

function HeroMediaLayer({
  heroBg,
  heroBgIsVideo,
  poster,
  hasMedia,
  onPick,
}: {
  heroBg: string | null;
  heroBgIsVideo: boolean;
  poster?: string;
  hasMedia: boolean;
  onPick: () => void;
}) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const [hot, setHot] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });

  const onMove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      className={`cms-preview-hero-media${hot ? " is-hot" : ""}`}
      onClick={onPick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onMouseMove={onMove}
      aria-label={hasMedia ? "Change hero media" : "Add hero image or video"}
    >
      {heroBg ? (
        heroBgIsVideo ? (
          <video
            className="cms-preview-hero-asset"
            src={heroBg}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden
          />
        ) : (
          <Image
            src={heroBg}
            alt=""
            fill
            className="object-cover cms-preview-hero-asset"
            sizes="100vw"
            unoptimized={heroBg.startsWith("http")}
          />
        )
      ) : (
        <div className="cms-preview-hero-empty">
          <span>Click to add hero image or video</span>
          <span>Shows behind the overview text — like the live site</span>
        </div>
      )}
      <span className="cms-preview-hero-scrim" aria-hidden />
      <span
        className={`cms-hero-follow${hot ? " is-on" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        aria-hidden
      >
        {hasMedia ? "Change media" : "Add media"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}

export function ProjectLivePreview({
  draft,
  editing,
  onEdit,
  onChange,
  onDone,
  onPickImage,
}: Props) {
  const cover = draft.coverImage || draft.introSrc;
  const media = draft.media;
  const revealColor =
    media?.colorSrc ||
    media?.poster ||
    (media?.type === "image" ? media.src : undefined) ||
    cover ||
    undefined;
  const revealBw = media?.bwSrc || revealColor;
  const heroBg = revealColor || media?.src || cover || null;
  const heroBgIsVideo = Boolean(heroBg && (media?.type === "video" || isVideoSrc(heroBg)));
  const useRevealHero = Boolean(heroBg);
  const highlights = asHighlights(draft.highlights);
  const sections = asSections(draft.sections);

  const introCopy = (
    <div className={`project-intro-inner${useRevealHero ? " is-on-hero" : ""}`}>
      <div className="project-page-crumb">
        <span>Selected Projects</span>
        <span aria-hidden> / </span>
        <EditableRegion field="slug" editing={editing} onEdit={onEdit} label="slug">
          {editing === "slug" ? (
            <PreviewInput
              value={draft.slug}
              onChange={(v) => onChange("slug", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>/{draft.slug || "slug"}</span>
          )}
        </EditableRegion>
      </div>

      <header className="project-intro-heading">
        <h1
          className={`project-page-title project-intro-title${draft.titleIcon ? " has-icon" : ""}`}
        >
          <EditableRegion
            field="titleIcon"
            editing={editing}
            onEdit={() => onPickImage("titleIcon")}
            label="icon"
            className="cms-editable-icon"
          >
            {draft.titleIcon ? (
              <Image
                src={draft.titleIcon}
                alt=""
                width={72}
                height={72}
                unoptimized={draft.titleIcon.startsWith("http")}
                className="project-page-title-icon"
              />
            ) : (
              <span className="cms-icon-placeholder">+</span>
            )}
          </EditableRegion>

          <EditableRegion field="title" editing={editing} onEdit={onEdit} label="title">
            {editing === "title" ? (
              <PreviewInput
                value={draft.title}
                onChange={(v) => onChange("title", v)}
                onDone={onDone}
                className="is-title"
              />
            ) : (
              <span className="project-page-title-text">{draft.title || "Project title"}</span>
            )}
          </EditableRegion>
        </h1>

        <EditableRegion
          field="role"
          editing={editing}
          onEdit={onEdit}
          label="role"
          as="div"
          className="cms-editable-block project-page-role"
        >
          {editing === "role" ? (
            <PreviewInput
              value={draft.role ?? ""}
              onChange={(v) => onChange("role", v)}
              onDone={onDone}
            />
          ) : (
            draft.role || "Role · context"
          )}
        </EditableRegion>
      </header>

      <div className="project-intro-label">
        <span aria-hidden>◆</span>
        <span>The Overview</span>
      </div>

      <h2 className="project-intro-lead">
        <EditableRegion field="thesisLead" editing={editing} onEdit={onEdit} label="lead">
          {editing === "thesisLead" ? (
            <PreviewInput
              value={draft.thesisLead ?? ""}
              onChange={(v) => onChange("thesisLead", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>{draft.thesisLead || "Thesis lead"}</span>
          )}
        </EditableRegion>{" "}
        <EditableRegion
          field="thesisHighlight"
          editing={editing}
          onEdit={onEdit}
          label="accent"
          className="is-accent-wrap"
        >
          {editing === "thesisHighlight" ? (
            <PreviewInput
              value={draft.thesisHighlight ?? ""}
              onChange={(v) => onChange("thesisHighlight", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span className="project-thesis-accent">
              {draft.thesisHighlight || "highlight"}
            </span>
          )}
        </EditableRegion>{" "}
        <EditableRegion field="thesisRest" editing={editing} onEdit={onEdit} label="rest">
          {editing === "thesisRest" ? (
            <PreviewInput
              value={draft.thesisRest ?? ""}
              onChange={(v) => onChange("thesisRest", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>{draft.thesisRest || "rest."}</span>
          )}
        </EditableRegion>
      </h2>

      <EditableRegion
        field="thesisBody"
        editing={editing}
        onEdit={onEdit}
        label="body"
        as="div"
        className="cms-editable-block project-intro-body"
      >
        {editing === "thesisBody" ? (
          <PreviewInput
            multiline
            rows={4}
            value={draft.thesisBody ?? ""}
            onChange={(v) => onChange("thesisBody", v)}
            onDone={onDone}
          />
        ) : (
          draft.thesisBody || "Thesis body — click to edit."
        )}
      </EditableRegion>

      <div className="project-thesis-meta">
        <EditableRegion field="heroMetric" editing={editing} onEdit={onEdit} label="metric">
          {editing === "heroMetric" ? (
            <PreviewInput
              value={draft.heroMetric ?? ""}
              onChange={(v) => onChange("heroMetric", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>{draft.heroMetric || "—"}</span>
          )}
        </EditableRegion>{" "}
        <EditableRegion
          field="heroMetricLabel"
          editing={editing}
          onEdit={onEdit}
          label="label"
        >
          {editing === "heroMetricLabel" ? (
            <PreviewInput
              value={draft.heroMetricLabel ?? ""}
              onChange={(v) => onChange("heroMetricLabel", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>{draft.heroMetricLabel || "METRIC"}</span>
          )}
        </EditableRegion>
        {" · "}
        <EditableRegion field="year" editing={editing} onEdit={onEdit} label="year">
          {editing === "year" ? (
            <PreviewInput
              value={draft.year ?? ""}
              onChange={(v) => onChange("year", v)}
              onDone={onDone}
              className="is-inline"
            />
          ) : (
            <span>{draft.year || "Year"}</span>
          )}
        </EditableRegion>
      </div>
    </div>
  );

  return (
    <div className={`cms-preview-root project-page${useRevealHero ? " is-reveal" : ""}`}>
      <div className="project-page-vgrid" aria-hidden />

      <section className="cms-preview-hero" aria-label="Hero preview">
        <HeroMediaLayer
          heroBg={heroBg}
          heroBgIsVideo={heroBgIsVideo}
          poster={media?.poster || cover || undefined}
          hasMedia={Boolean(heroBg)}
          onPick={() => onPickImage("heroMedia")}
        />

        <div className="cms-preview-hero-copy project-page-shell">{introCopy}</div>

        {heroBgIsVideo ? (
          <button
            type="button"
            className="cms-media-poster-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPickImage("heroPoster");
            }}
          >
            {media?.poster ? "Change poster" : "Add poster"}
          </button>
        ) : null}
      </section>

      {/* Secondary copy band — only when live site uses split hero (no reveal pair) */}
      {!(media?.colorSrc && media?.bwSrc) ? (
        <section className="project-band project-band-hero">
          <div className="project-page-shell">
            <div className="project-hero-copy cms-preview-hero-secondary">
              <EditableRegion
                field="heroTitle"
                editing={editing}
                onEdit={onEdit}
                label="hero title"
                as="div"
                className="cms-editable-block"
              >
                {editing === "heroTitle" ? (
                  <PreviewInput
                    value={draft.heroTitle ?? ""}
                    onChange={(v) => onChange("heroTitle", v)}
                    onDone={onDone}
                    className="is-title"
                  />
                ) : (
                  <h3 className="project-block-title">{draft.heroTitle || "Hero title"}</h3>
                )}
              </EditableRegion>

              <EditableRegion
                field="heroBody"
                editing={editing}
                onEdit={onEdit}
                label="hero body"
                as="div"
                className="cms-editable-block project-block-body"
              >
                {editing === "heroBody" ? (
                  <PreviewInput
                    multiline
                    rows={4}
                    value={draft.heroBody ?? ""}
                    onChange={(v) => onChange("heroBody", v)}
                    onDone={onDone}
                  />
                ) : (
                  draft.heroBody || "Hero body — click to edit."
                )}
              </EditableRegion>
            </div>
          </div>
        </section>
      ) : null}

      <section className="project-services" aria-label="Project details">
        <div className="project-page-shell">
          <div className="project-services-rule" aria-hidden />

          <div className="project-services-head">
            <div className="project-services-label">
              <span aria-hidden>◆</span>
              <span>Details</span>
            </div>
            <h2 className="project-services-headline">
              {draft.heroTitle || "Hero title"}. {draft.heroBody || "Hero body"}
            </h2>
          </div>

          <div className="project-services-rule-partial" aria-hidden>
            <span />
            <i />
          </div>

          <div className="project-services-list">
            {highlights.map((item, index) => {
              const titleKey = `highlight:${index}:title`;
              const bodyKey = `highlight:${index}:body`;
              const metricKey = `highlight:${index}:metric`;
              const labelKey = `highlight:${index}:label`;
              return (
                <article
                  key={`h-${index}`}
                  className={`project-services-item${index > 0 ? " has-rule" : ""}`}
                >
                  <div className="project-services-item-rail" aria-hidden />
                  <div className="project-services-item-main">
                    <div className="project-services-item-grid">
                      <EditableRegion
                        field={titleKey}
                        editing={editing}
                        onEdit={onEdit}
                        label="title"
                        as="div"
                        className="cms-editable-block"
                      >
                        {editing === titleKey ? (
                          <PreviewInput
                            value={item.title}
                            onChange={(v) =>
                              onChange("highlights", updateHighlight(highlights, index, { title: v }))
                            }
                            onDone={onDone}
                            className="is-title"
                          />
                        ) : (
                          <h3>{item.title || "Highlight title"}</h3>
                        )}
                      </EditableRegion>
                      <div>
                        <EditableRegion
                          field={bodyKey}
                          editing={editing}
                          onEdit={onEdit}
                          label="body"
                          as="div"
                          className="cms-editable-block"
                        >
                          {editing === bodyKey ? (
                            <PreviewInput
                              multiline
                              rows={3}
                              value={item.body}
                              onChange={(v) =>
                                onChange(
                                  "highlights",
                                  updateHighlight(highlights, index, { body: v }),
                                )
                              }
                              onDone={onDone}
                            />
                          ) : (
                            <p>{item.body || "Highlight body"}</p>
                          )}
                        </EditableRegion>
                        <ul>
                          <li>
                            <span aria-hidden>◇</span>
                            <EditableRegion
                              field={metricKey}
                              editing={editing}
                              onEdit={onEdit}
                              label="metric"
                              className="is-inline-edit"
                            >
                              {editing === metricKey ? (
                                <PreviewInput
                                  value={item.metric}
                                  onChange={(v) =>
                                    onChange(
                                      "highlights",
                                      updateHighlight(highlights, index, { metric: v }),
                                    )
                                  }
                                  onDone={onDone}
                                  className="is-inline"
                                />
                              ) : (
                                <span>{item.metric || "—"}</span>
                              )}
                            </EditableRegion>
                            {" · "}
                            <EditableRegion
                              field={labelKey}
                              editing={editing}
                              onEdit={onEdit}
                              label="label"
                              className="is-inline-edit"
                            >
                              {editing === labelKey ? (
                                <PreviewInput
                                  value={item.label}
                                  onChange={(v) =>
                                    onChange(
                                      "highlights",
                                      updateHighlight(highlights, index, { label: v }),
                                    )
                                  }
                                  onDone={onDone}
                                  className="is-inline"
                                />
                              ) : (
                                <span>{item.label || "LABEL"}</span>
                              )}
                            </EditableRegion>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {sections.map((item, index) => {
              const titleKey = `section:${index}:title`;
              const bodyKey = `section:${index}:paragraphs`;
              const bulletsKey = `section:${index}:bullets`;
              const offset = highlights.length;
              return (
                <article
                  key={`s-${index}`}
                  className={`project-services-item${offset + index > 0 ? " has-rule" : ""}`}
                >
                  <div className="project-services-item-rail" aria-hidden />
                  <div className="project-services-item-main">
                    <div className="project-services-item-grid">
                      <EditableRegion
                        field={titleKey}
                        editing={editing}
                        onEdit={onEdit}
                        label="title"
                        as="div"
                        className="cms-editable-block"
                      >
                        {editing === titleKey ? (
                          <PreviewInput
                            value={item.title}
                            onChange={(v) =>
                              onChange("sections", updateSection(sections, index, { title: v }))
                            }
                            onDone={onDone}
                            className="is-title"
                          />
                        ) : (
                          <h3>{item.title || "Section title"}</h3>
                        )}
                      </EditableRegion>
                      <div>
                        <EditableRegion
                          field={bodyKey}
                          editing={editing}
                          onEdit={onEdit}
                          label="body"
                          as="div"
                          className="cms-editable-block"
                        >
                          {editing === bodyKey ? (
                            <PreviewInput
                              multiline
                              rows={4}
                              value={(item.paragraphs ?? []).join("\n\n")}
                              onChange={(v) =>
                                onChange(
                                  "sections",
                                  updateSection(sections, index, {
                                    paragraphs: v
                                      .split(/\n\n+/)
                                      .map((p) => p.trim())
                                      .filter(Boolean),
                                  }),
                                )
                              }
                              onDone={onDone}
                            />
                          ) : (
                            <p>{(item.paragraphs ?? []).join(" ") || "Section body"}</p>
                          )}
                        </EditableRegion>
                        {(item.bullets && item.bullets.length > 0) || editing === bulletsKey ? (
                          <EditableRegion
                            field={bulletsKey}
                            editing={editing}
                            onEdit={onEdit}
                            label="bullets"
                            as="div"
                            className="cms-editable-block"
                          >
                            {editing === bulletsKey ? (
                              <PreviewInput
                                multiline
                                rows={3}
                                value={(item.bullets ?? []).join("\n")}
                                placeholder="One bullet per line"
                                onChange={(v) =>
                                  onChange(
                                    "sections",
                                    updateSection(sections, index, {
                                      bullets: v
                                        .split("\n")
                                        .map((b) => b.trim())
                                        .filter(Boolean),
                                    }),
                                  )
                                }
                                onDone={onDone}
                              />
                            ) : (
                              <ul>
                                {(item.bullets ?? []).map((b) => (
                                  <li key={b}>
                                    <span aria-hidden>◇</span>
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </EditableRegion>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {highlights.length === 0 && sections.length === 0 ? (
              <div className="cms-preview-empty-block">
                <p className="cms-preview-empty">No details yet.</p>
                <button
                  type="button"
                  className="cms-btn cms-btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("highlights", [
                      {
                        metric: "01",
                        label: "NEW",
                        title: "New highlight",
                        body: "Describe the outcome.",
                      },
                    ]);
                  }}
                >
                  + Add highlight
                </button>
              </div>
            ) : (
              <div className="cms-preview-add-row">
                <button
                  type="button"
                  className="cms-chip-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("highlights", [
                      ...highlights,
                      {
                        metric: String(highlights.length + 1).padStart(2, "0"),
                        label: "NEW",
                        title: "New highlight",
                        body: "Describe the outcome.",
                      },
                    ]);
                  }}
                >
                  + Highlight
                </button>
                <button
                  type="button"
                  className="cms-chip-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("sections", [
                      ...sections,
                      {
                        label: "Section",
                        title: "New section",
                        paragraphs: ["Write the story here."],
                        bullets: [],
                      },
                    ]);
                  }}
                >
                  + Section
                </button>
              </div>
            )}
          </div>

          <div className="project-services-stack">
            <div className="project-services-label">
              <span aria-hidden>◆</span>
              <span>Stack</span>
            </div>
            <EditableRegion
              field="techStack"
              editing={editing}
              onEdit={onEdit}
              label="stack"
              as="div"
              className="cms-editable-block"
            >
              {editing === "techStack" ? (
                <PreviewInput
                  value={draft.techStack.join(", ")}
                  placeholder="Next.js, Prisma, …"
                  onChange={(v) =>
                    onChange(
                      "techStack",
                      v
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onDone={onDone}
                />
              ) : (
                <ul>
                  {draft.techStack.length > 0 ? (
                    draft.techStack.map((s) => <li key={s}>{s}</li>)
                  ) : (
                    <li className="cms-preview-empty-chip">Add stack</li>
                  )}
                </ul>
              )}
            </EditableRegion>
          </div>
        </div>
      </section>

      <section className="cms-preview-summary">
        <div className="project-page-shell">
          <p className="cms-preview-section-label">Card / SEO summary</p>
          <EditableRegion
            field="summary"
            editing={editing}
            onEdit={onEdit}
            label="summary"
            as="div"
            className="cms-editable-block"
          >
            {editing === "summary" ? (
              <PreviewInput
                multiline
                rows={3}
                value={draft.summary}
                onChange={(v) => onChange("summary", v)}
                onDone={onDone}
              />
            ) : (
              <p>{draft.summary || "Intro summary for homepage cards."}</p>
            )}
          </EditableRegion>
        </div>
      </section>
    </div>
  );
}
