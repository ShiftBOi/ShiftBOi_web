"use client";

import { Reorder, useDragControls } from "framer-motion";
import {
  EditableRegion,
  PreviewInput,
  type DetailBlock,
  type DetailSection,
  type EditableField,
} from "@/components/cms/project-editor-primitives";
import { CmsRichText } from "@/components/cms/cms-rich-text";
import { CaseStudyPointCards } from "@/components/web/case-study/case-study-point-cards";
import { sanitizeRichHtml } from "@/lib/rich-text";
import {
  clearedSectionMedia,
  isSectionMediaCleared,
} from "@/lib/project-draft";

type Props = {
  details: DetailBlock[];
  editing: EditableField;
  onEdit: (field: string) => void;
  onReorder: (next: DetailBlock[]) => void;
  onChangeBlock: (index: number, patch: Partial<DetailBlock>) => void;
  onRemove: (index: number) => void;
  onAddSection: () => void;
  onPickSectionMedia: (index: number, kind: "media" | "poster") => void;
  /**
   * Per-section fallback src (band media by ordinal), matching public
   * `buildSections` band assignment — no intro/cover auto-fill.
   */
  sectionMediaFallbacks?: Array<string | null>;
  onDone: () => void;
};

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

function DragHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <button
      type="button"
      className="cms-detail-drag"
      aria-label="Drag to reorder"
      onPointerDown={(e) => controls.start(e)}
      style={{ touchAction: "none" }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </button>
  );
}

function sectionDisplayHtml(paragraphs: string[]) {
  if (paragraphs.length === 0) return "";
  return paragraphs
    .map((p) => {
      const t = p.trim();
      if (!t) return "";
      if (/^<p[\s>]/i.test(t) || /<(?:br|strong|span|em)\b/i.test(t)) return t;
      return `<p>${t}</p>`;
    })
    .join("");
}

function DetailRow({
  block,
  index,
  editing,
  onEdit,
  onChangeBlock,
  onRemove,
  onPickSectionMedia,
  fallbackMediaSrc,
  onDone,
}: {
  block: DetailBlock;
  index: number;
  editing: EditableField;
  onEdit: (field: string) => void;
  onChangeBlock: (index: number, patch: Partial<DetailBlock>) => void;
  onRemove: (index: number) => void;
  onPickSectionMedia: (index: number, kind: "media" | "poster") => void;
  fallbackMediaSrc?: string | null;
  onDone: () => void;
}) {
  const controls = useDragControls();
  const titleKey = `detail:${index}:title`;
  const labelKey = `detail:${index}:label`;
  const bodyKey = `detail:${index}:body`;
  const metricKey = `detail:${index}:metric`;

  if (block.kind === "highlight") {
    // Highlights are edited via CmsStatsBar (compact public-style strip).
    return null;
  }

  const section = block as DetailSection;
  const displayHtml = sectionDisplayHtml(section.paragraphs);
  const mediaCleared = isSectionMediaCleared(section.media);
  const mediaIsExplicit = Boolean(
    section.media?.src && !isSectionMediaCleared(section.media),
  );
  const mediaSrc = mediaCleared
    ? null
    : section.media?.src || fallbackMediaSrc || null;
  const mediaIsVideo = Boolean(
    mediaSrc &&
      ((mediaIsExplicit && section.media?.type === "video") ||
        isVideoSrc(mediaSrc)),
  );

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={controls}
      className="cms-cs-section-row"
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        zIndex: 5,
      }}
    >
      <div className="cms-detail-chrome">
        <div className="cms-detail-chrome-left">
          <DragHandle controls={controls} />
          <span className="cms-detail-chrome-label">Text section</span>
        </div>
        <button
          type="button"
          className="cms-band-chrome-delete"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
        >
          Remove
        </button>
      </div>

      <section className="cs-section cms-cs-section">
        <div className="cs-section-grid">
          <header className="cs-section-head">
            <div className="cs-section-head-sticky">
              <EditableRegion
                field={labelKey}
                editing={editing}
                onEdit={onEdit}
                label="label"
                as="div"
                className="cms-editable-block"
              >
                {editing === labelKey ? (
                  <PreviewInput
                    value={section.label}
                    onChange={(v) => onChangeBlock(index, { label: v })}
                    onDone={onDone}
                    className="is-inline"
                  />
                ) : (
                  <p className="cs-section-label">{section.label || "Section"}</p>
                )}
              </EditableRegion>
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
                    value={section.title}
                    onChange={(v) => onChangeBlock(index, { title: v })}
                    onDone={onDone}
                    className="is-title"
                  />
                ) : (
                  <h2 className="cs-section-title">{section.title || "Section title"}</h2>
                )}
              </EditableRegion>
            </div>
          </header>

          <div className="cs-section-main">
            <EditableRegion
              field={bodyKey}
              editing={editing}
              onEdit={onEdit}
              label="body"
              as="div"
              className="cms-editable-block cs-section-body"
            >
              {editing === bodyKey ? (
                <CmsRichText
                  value={displayHtml}
                  placeholder="Select text for bold / size / color"
                  onChange={(html) => {
                    const clean = sanitizeRichHtml(html);
                    onChangeBlock(index, { paragraphs: clean ? [clean] : [] });
                  }}
                  onDone={onDone}
                />
              ) : displayHtml ? (
                <div
                  className="cs-rich-body"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(displayHtml) }}
                />
              ) : (
                <p>Section body — click to edit</p>
              )}
            </EditableRegion>

            <CaseStudyPointCards
              points={section.bullets ?? []}
              editable
              onEditPoint={(i, value) => {
                const next = [...(section.bullets ?? [])];
                next[i] = value;
                onChangeBlock(index, { bullets: next });
              }}
              onAddPoint={() => {
                onChangeBlock(index, {
                  bullets: [
                    ...(section.bullets ?? []),
                    { text: "New card point", icon: null },
                  ].slice(0, 4),
                });
              }}
              onRemovePoint={(i) => {
                onChangeBlock(index, {
                  bullets: (section.bullets ?? []).filter((_, bi) => bi !== i),
                });
              }}
            />

            <div className="cms-cs-section-media">
              <div className="cms-cs-section-media-frame">
                <button
                  type="button"
                  className={`cms-preview-split-media${mediaSrc ? "" : " is-empty"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickSectionMedia(index, "media");
                  }}
                  aria-label={
                    mediaSrc ? "Change section media" : "Add section image or video"
                  }
                >
                  {mediaSrc ? (
                    mediaIsVideo ? (
                      <video
                        src={mediaSrc}
                        poster={section.media?.poster || undefined}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaSrc}
                        alt=""
                        className="cms-cs-section-media-img"
                      />
                    )
                  ) : (
                    <div className="project-media-fallback" aria-hidden />
                  )}
                  <span className="cms-cs-media-hint" aria-hidden>
                    {mediaSrc
                      ? mediaIsExplicit
                        ? "Change media"
                        : "Using project image — click to set"
                      : "+ Image / video"}
                  </span>
                </button>
                {mediaSrc ? (
                  <button
                    type="button"
                    className="cms-cs-media-trash"
                    aria-label="Remove section image"
                    title="Remove image"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeBlock(index, { media: clearedSectionMedia() });
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
              <div className="cms-cs-section-media-actions">
                {mediaIsVideo && mediaIsExplicit ? (
                  <button
                    type="button"
                    className="cms-media-poster-btn cms-media-poster-btn-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPickSectionMedia(index, "poster");
                    }}
                  >
                    {section.media?.poster ? "Change poster" : "Add poster"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reorder.Item>
  );
}

export function CmsDetailBlocks({
  details,
  editing,
  onEdit,
  onReorder,
  onChangeBlock,
  onRemove,
  onAddSection,
  onPickSectionMedia,
  sectionMediaFallbacks = [],
  onDone,
}: Props) {
  const sectionEntries = details
    .map((block, index) => ({ block, index }))
    .filter((row) => row.block.kind === "section");
  const sectionBlocks = sectionEntries.map((row) => row.block);

  return (
    <div className="cms-details-editor cms-cs-details">
      {sectionEntries.length === 0 ? (
        <div className="cms-preview-empty-block">
          <p className="cms-preview-empty">No sections yet.</p>
          <p className="cms-rail-hint">
            Add a text section for sticky title + body + gray cards + media.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={sectionBlocks}
          onReorder={(nextSections) => {
            const highlights = details.filter((d) => d.kind === "highlight");
            onReorder([...highlights, ...nextSections]);
          }}
          className="cms-cs-sections-reorder"
        >
          {sectionEntries.map(({ block, index }, sectionOrdinal) => (
            <DetailRow
              key={block.id}
              block={block}
              index={index}
              editing={editing}
              onEdit={onEdit}
              onChangeBlock={onChangeBlock}
              onRemove={onRemove}
              onPickSectionMedia={onPickSectionMedia}
              fallbackMediaSrc={sectionMediaFallbacks[sectionOrdinal] ?? null}
              onDone={onDone}
            />
          ))}
        </Reorder.Group>
      )}

      <div className="cms-preview-add-row cms-details-add-row">
        <button
          type="button"
          className="cms-add-band-btn cms-add-detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddSection();
          }}
        >
          <span className="cms-add-band-icon" aria-hidden>
            +
          </span>
          <span>
            <strong>Add text section</strong>
            <em>Sticky title · body · gray cards · media</em>
          </span>
        </button>
      </div>
    </div>
  );
}
