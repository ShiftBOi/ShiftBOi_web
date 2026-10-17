"use client";

import Image from "next/image";
import type { CollageItem, ProjectDraft } from "@/lib/project-draft";
import {
  emptyCollageSlot,
  SECTION_MEDIA_CLEARED,
} from "@/lib/project-draft";

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

/** Build up to 3 preview slots from draft assets when collage is auto (null). */
export function resolveCollageSlots(draft: ProjectDraft): CollageItem[] {
  if (Array.isArray(draft.collage)) {
    if (draft.collage.length === 0) return [];
    return padToThree(
      draft.collage.filter(
        (item) => item.src?.trim() && item.src !== SECTION_MEDIA_CLEARED,
      ),
    );
  }

  const out: CollageItem[] = [];
  const seen = new Set<string>();
  const push = (src?: string | null, poster?: string, type?: "image" | "video") => {
    const clean = src?.trim();
    if (!clean || clean === SECTION_MEDIA_CLEARED || seen.has(clean)) return;
    seen.add(clean);
    out.push({
      id: `auto-${out.length}`,
      type: type ?? (isVideoSrc(clean) ? "video" : "image"),
      src: clean,
      ...(poster ? { poster } : {}),
    });
  };

  for (const band of draft.bands) {
    push(band.media?.src, band.media?.poster, band.media?.type);
  }
  push(draft.media?.src || draft.media?.colorSrc, draft.media?.poster, draft.media?.type);
  push(draft.introSrc);
  push(draft.coverImage);
  for (const block of draft.details) {
    if (block.kind === "section") {
      push(block.media?.src, block.media?.poster, block.media?.type);
    }
  }
  return padToThree(out.slice(0, 3));
}

function padToThree(items: CollageItem[]): CollageItem[] {
  const next = items.slice(0, 3);
  while (next.length < 3) next.push(emptyCollageSlot(next.length));
  return next;
}

type Props = {
  draft: ProjectDraft;
  onChange: (collage: CollageItem[] | null) => void;
  onPickSlot: (index: number) => void;
};

export function CmsCollageEditor({ draft, onChange, onPickSlot }: Props) {
  const hidden = Array.isArray(draft.collage) && draft.collage.length === 0;

  if (hidden) {
    return (
      <section className="cms-cs-collage-block" aria-label="Snap collage">
        <div className="cms-preview-add-row">
          <button
            type="button"
            className="cms-add-band-btn cms-add-detail-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <span className="cms-add-band-icon" aria-hidden>
              +
            </span>
            <span>
              <strong>Restore automatic collage</strong>
              <em>Pull frames from project media again</em>
            </span>
          </button>
          <button
            type="button"
            className="cms-add-band-btn cms-add-detail-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChange(padToThree([]));
            }}
          >
            <span className="cms-add-band-icon" aria-hidden>
              +
            </span>
            <span>
              <strong>Add custom collage</strong>
              <em>Three overlapping image/video cards at page end</em>
            </span>
          </button>
        </div>
      </section>
    );
  }

  const slots = resolveCollageSlots(draft);
  const isAuto = draft.collage === null || draft.collage === undefined;

  return (
    <section className="cms-cs-collage-block" aria-label="Snap collage">
      <div className="cms-detail-chrome">
        <div className="cms-detail-chrome-left">
          <span className="cms-detail-chrome-label">
            Snap collage{isAuto ? " · auto" : ""}
          </span>
        </div>
        <div className="cms-detail-chrome-left">
          {!isAuto ? (
            <button
              type="button"
              className="cms-chip-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              Use automatic
            </button>
          ) : null}
          <button
            type="button"
            className="cms-band-chrome-delete"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
          >
            Remove
          </button>
        </div>
      </div>
      <p className="cms-rail-hint cms-rail-hint-tight">
        Three cards at the end of the page. Hover expands a card on the live site.
      </p>
      <div className="cms-cs-collage-slots">
        {slots.map((slot, index) => {
          const hasSrc = Boolean(slot.src);
          const video = hasSrc && (slot.type === "video" || isVideoSrc(slot.src));
          return (
            <div key={slot.id || `slot-${index}`} className="cms-cs-collage-slot">
              <button
                type="button"
                className={`cms-preview-split-media cms-cs-collage-pick${hasSrc ? "" : " is-empty"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPickSlot(index);
                }}
                aria-label={hasSrc ? `Change collage card ${index + 1}` : `Add collage card ${index + 1}`}
              >
                {hasSrc ? (
                  video ? (
                    <video
                      src={slot.src}
                      poster={slot.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden
                    />
                  ) : (
                    <Image
                      src={slot.src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="200px"
                      unoptimized={slot.src.startsWith("http")}
                    />
                  )
                ) : (
                  <div className="project-media-fallback" aria-hidden />
                )}
                <span className="cms-cs-media-hint" aria-hidden>
                  {hasSrc ? "Change" : `+ Card 0${index + 1}`}
                </span>
              </button>
              {hasSrc ? (
                <button
                  type="button"
                  className="cms-chip-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = slots.map((s, i) =>
                      i === index ? { ...s, src: "", poster: undefined } : s,
                    );
                    onChange(next);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
