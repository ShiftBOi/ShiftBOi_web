"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import {
  EditableRegion,
  PreviewInput,
  type EditableField,
  type ProjectBand,
  type ProjectDraft,
} from "@/components/cms/project-editor-primitives";
import { usesRevealHero } from "@/lib/project-draft";
import { CmsDetailBlocks } from "@/components/cms/cms-detail-blocks";

type Props = {
  draft: ProjectDraft;
  editing: EditableField;
  onEdit: (field: string) => void;
  onChange: <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => void;
  onDone: () => void;
  onPickImage: (
    field:
      | "coverImage"
      | "introSrc"
      | "titleIcon"
      | "heroMedia"
      | "heroPoster"
      | `bandMedia:${number}`
      | `bandPoster:${number}`,
  ) => void;
  onAddBand: () => void;
  onRemoveBand: (index: number) => void;
  onReorderDetails: (next: ProjectDraft["details"]) => void;
  onChangeDetail: (index: number, patch: Partial<ProjectDraft["details"][number]>) => void;
  onRemoveDetail: (index: number) => void;
  onAddDetailSection: () => void;
  onAddDetailHighlight: () => void;
};

function updateBand(
  list: ProjectBand[],
  index: number,
  patch: Partial<ProjectBand>,
): ProjectBand[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

function FollowHint({
  hot,
  pos,
  label,
}: {
  hot: boolean;
  pos: { x: number; y: number };
  label: string;
}) {
  return (
    <span
      className={`cms-hero-follow${hot ? " is-on" : ""}`}
      style={{ left: pos.x, top: pos.y }}
      aria-hidden
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function useFollowCursor() {
  const rootRef = useRef<HTMLButtonElement>(null);
  const [hot, setHot] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const onMove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  return { rootRef, hot, setHot, pos, onMove };
}

function RevealMediaLayer({
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
  const { rootRef, hot, setHot, pos, onMove } = useFollowCursor();

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
          <span>Shows behind the overview text</span>
        </div>
      )}
      <span className="cms-preview-hero-scrim" aria-hidden />
      <FollowHint hot={hot} pos={pos} label={hasMedia ? "Change media" : "Add media"} />
    </button>
  );
}

function SplitMediaLayer({
  src,
  isVideo,
  poster,
  onPick,
}: {
  src: string | null;
  isVideo: boolean;
  poster?: string;
  onPick: () => void;
}) {
  const { rootRef, hot, setHot, pos, onMove } = useFollowCursor();
  const hasMedia = Boolean(src);

  return (
    <button
      ref={rootRef}
      type="button"
      className={`cms-preview-split-media${hot ? " is-hot" : ""}${hasMedia ? "" : " is-empty"}`}
      onClick={onPick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onMouseMove={onMove}
      aria-label={hasMedia ? "Change box media" : "Add image or video to box"}
    >
      {src ? (
        isVideo ? (
          <video
            src={src}
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
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:900px) 100vw, 55vw"
            unoptimized={src.startsWith("http")}
          />
        )
      ) : (
        <div className="project-media-fallback" aria-hidden />
      )}
      <FollowHint
        hot={hot}
        pos={pos}
        label={hasMedia ? "Change media" : "Add image / video"}
      />
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
  onAddBand,
  onRemoveBand,
  onReorderDetails,
  onChangeDetail,
  onRemoveDetail,
  onAddDetailSection,
  onAddDetailHighlight,
}: Props) {
  const media = draft.media;
  const useReveal = usesRevealHero(media);
  const revealColor =
    media?.colorSrc ||
    media?.poster ||
    (media?.type === "image" ? media.src : undefined) ||
    null;
  const revealIsVideo = Boolean(
    revealColor && (media?.type === "video" || isVideoSrc(revealColor)),
  );
  const bands = draft.bands;
  const details = draft.details;

  const introCopy = (
    <div className={`project-intro-inner${useReveal ? " is-on-hero" : ""}`}>
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
    <div className={`cms-preview-root project-page${useReveal ? " is-reveal" : ""}`}>
      <div className="project-page-vgrid" aria-hidden />

      {useReveal ? (
        <section className="cms-preview-hero" aria-label="Hero preview">
          <RevealMediaLayer
            heroBg={revealColor}
            heroBgIsVideo={revealIsVideo}
            poster={media?.poster || undefined}
            hasMedia={Boolean(revealColor)}
            onPick={() => onPickImage("heroMedia")}
          />
          <div className="cms-preview-hero-copy project-page-shell">{introCopy}</div>
          {revealIsVideo ? (
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
      ) : (
        <section className="project-intro cms-preview-intro">
          <div className="project-page-shell">{introCopy}</div>
        </section>
      )}

      {bands.map((band, index) => {
        const boxSrc = band.media?.src || null;
        const boxIsVideo = Boolean(
          boxSrc && (band.media?.type === "video" || isVideoSrc(boxSrc)),
        );
        const titleKey = `band:${index}:title`;
        const bodyKey = `band:${index}:body`;
        return (
          <section
            key={band.id}
            className="project-band project-band-hero cms-preview-split-band"
          >
            <div className="cms-band-chrome">
              <span className="cms-band-chrome-label">Media box {index + 1}</span>
              <button
                type="button"
                className="cms-band-chrome-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveBand(index);
                }}
              >
                Remove box
              </button>
            </div>
            <div className="project-page-shell">
              <div className="project-split project-split-hero">
                <div className="project-media">
                  <SplitMediaLayer
                    src={boxSrc}
                    isVideo={boxIsVideo}
                    poster={band.media?.poster}
                    onPick={() => onPickImage(`bandMedia:${index}`)}
                  />
                </div>
                <div className="project-hero-copy cms-preview-hero-secondary">
                  <EditableRegion
                    field={titleKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="box title"
                    as="div"
                    className="cms-editable-block"
                  >
                    {editing === titleKey ? (
                      <PreviewInput
                        value={band.title}
                        onChange={(v) =>
                          onChange("bands", updateBand(bands, index, { title: v }))
                        }
                        onDone={onDone}
                        className="is-title"
                      />
                    ) : (
                      <h3 className="project-block-title">
                        {band.title || "Box title"}
                      </h3>
                    )}
                  </EditableRegion>

                  <EditableRegion
                    field={bodyKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="box body"
                    as="div"
                    className="cms-editable-block project-block-body"
                  >
                    {editing === bodyKey ? (
                      <PreviewInput
                        multiline
                        rows={4}
                        value={band.body}
                        onChange={(v) =>
                          onChange("bands", updateBand(bands, index, { body: v }))
                        }
                        onDone={onDone}
                      />
                    ) : (
                      band.body || "Box body — click to edit."
                    )}
                  </EditableRegion>
                </div>
              </div>
              {boxIsVideo ? (
                <button
                  type="button"
                  className="cms-media-poster-btn cms-media-poster-btn-inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickImage(`bandPoster:${index}`);
                  }}
                >
                  {band.media?.poster ? "Change poster" : "Add poster"}
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      <div className="cms-preview-add-band">
        <button
          type="button"
          className="cms-add-band-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddBand();
          }}
        >
          <span className="cms-add-band-icon" aria-hidden>
            +
          </span>
          <span>
            <strong>Add media box</strong>
            <em>Same split layout on every project page</em>
          </span>
        </button>
      </div>

      <section className="project-services" aria-label="Project details">
        <div className="project-page-shell">
          <div className="project-services-rule" aria-hidden />

          <div className="project-services-head">
            <div className="project-services-label">
              <span aria-hidden>◆</span>
              <span>Details</span>
            </div>
            <h2 className="project-services-headline">
              <EditableRegion
                field="heroTitle"
                editing={editing}
                onEdit={onEdit}
                label="details title"
                className="is-inline-edit"
              >
                {editing === "heroTitle" ? (
                  <PreviewInput
                    value={draft.heroTitle ?? ""}
                    onChange={(v) => onChange("heroTitle", v)}
                    onDone={onDone}
                    className="is-inline"
                  />
                ) : (
                  <span>{draft.heroTitle || "Hero title"}</span>
                )}
              </EditableRegion>
              {". "}
              <EditableRegion
                field="heroBody"
                editing={editing}
                onEdit={onEdit}
                label="details body"
                className="is-inline-edit"
              >
                {editing === "heroBody" ? (
                  <PreviewInput
                    value={draft.heroBody ?? ""}
                    onChange={(v) => onChange("heroBody", v)}
                    onDone={onDone}
                    className="is-inline"
                  />
                ) : (
                  <span>{draft.heroBody || "Hero body"}</span>
                )}
              </EditableRegion>
            </h2>
          </div>

          <div className="project-services-rule-partial" aria-hidden>
            <span />
            <i />
          </div>

          <CmsDetailBlocks
            details={details}
            editing={editing}
            onEdit={onEdit}
            onReorder={onReorderDetails}
            onChangeBlock={onChangeDetail}
            onRemove={onRemoveDetail}
            onAddSection={onAddDetailSection}
            onAddHighlight={onAddDetailHighlight}
            onDone={onDone}
          />

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
