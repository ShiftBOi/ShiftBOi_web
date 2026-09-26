"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  EditableRegion,
  PreviewInput,
  type EditableField,
  type ProjectDraft,
  type ProjectMedia,
} from "@/components/cms/project-editor-primitives";

export type SelectedGridPeer = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string | null;
  introSrc: string | null;
  media: ProjectMedia | null;
  featured: boolean;
  published: boolean;
  visibility: "PUBLIC" | "CONFIDENTIAL";
  sortOrder: number;
};

export type SelectedPickerItem = {
  id: string;
  slug: string;
  title: string;
  featured: boolean;
  published: boolean;
  visibility: "PUBLIC" | "CONFIDENTIAL";
};

type Props = {
  draft: ProjectDraft;
  peers: SelectedGridPeer[];
  pickerItems: SelectedPickerItem[];
  editing: EditableField;
  onEdit: (field: string) => void;
  onChange: <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => void;
  onDone: () => void;
  onPickImage: (field: "coverImage" | "introSrc" | "heroMedia" | "heroPoster") => void;
};

function isVideoSrc(src: string) {
  return /\.(mov|mp4|webm|m4v)(\?|#|$)/i.test(src);
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
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

function CellMedia({
  media,
  coverImage,
  introSrc,
  title,
  editable,
  onPick,
}: {
  media: ProjectMedia | null;
  coverImage: string | null;
  introSrc: string | null;
  title: string;
  editable?: boolean;
  onPick?: () => void;
}) {
  const mediaSrc = media?.src || null;
  const poster = media?.poster || coverImage || introSrc || null;
  const image = coverImage || introSrc || null;
  const video =
    mediaSrc && (media?.type === "video" || isVideoSrc(mediaSrc))
      ? mediaSrc
      : null;
  const show = video || image || mediaSrc;
  const { rootRef, hot, setHot, pos, onMove } = useFollowCursor();

  const body = (
    <>
      {video ? (
        <video
          className="cms-selected-visual-asset"
          src={video}
          poster={poster || undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
      ) : show ? (
        <Image
          src={image || mediaSrc || ""}
          alt=""
          fill
          className="cms-selected-visual-asset object-cover"
          sizes="(max-width: 900px) 100vw, 50vw"
          unoptimized={(image || mediaSrc || "").startsWith("http")}
        />
      ) : (
        <span className="cms-selected-visual-empty">
          <strong>{editable ? "Add image or clip" : "No media"}</strong>
          <em>{editable ? "Click to upload — shows on homepage" : title}</em>
        </span>
      )}
      {editable ? (
        <FollowHint
          hot={hot}
          pos={pos}
          label={show ? "Change media" : "Add image / video"}
        />
      ) : null}
    </>
  );

  if (editable && onPick) {
    return (
      <button
        ref={rootRef}
        type="button"
        className={`cms-selected-visual${show ? " has-media" : ""}${hot ? " is-hot" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onMouseMove={onMove}
        aria-label={show ? "Change Selected Projects media" : "Add Selected Projects media"}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`cms-selected-visual${show ? " has-media" : ""} is-static`}>
      {body}
    </div>
  );
}

type Slot =
  | { kind: "project"; peer: SelectedGridPeer; isCurrent: boolean }
  | { kind: "empty"; key: string };

/**
 * CMS preview of the homepage Selected Projects grid — rows of 2, editable like detail.
 */
export function ProjectSelectedPreview({
  draft,
  peers,
  pickerItems,
  editing,
  onEdit,
  onChange,
  onDone,
  onPickImage,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mergedPeers = useMemo(() => {
    const byId = new Map<string, SelectedGridPeer>();
    for (const p of peers) {
      byId.set(p.id, p);
    }
    // Live draft overrides its peer row when featured (or when already in list)
    if (draft.id && (draft.featured || byId.has(draft.id))) {
      byId.set(draft.id, {
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        summary: draft.summary,
        coverImage: draft.coverImage,
        introSrc: draft.introSrc,
        media: draft.media,
        featured: draft.featured,
        published: draft.published,
        visibility: draft.visibility,
        sortOrder: byId.get(draft.id)?.sortOrder ?? 0,
      });
    }
    const list = [...byId.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
    // If current draft isn't featured yet, pin it into the grid so user can edit the card
    if (draft.id && !draft.featured && !peers.some((p) => p.id === draft.id)) {
      list.unshift({
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        summary: draft.summary,
        coverImage: draft.coverImage,
        introSrc: draft.introSrc,
        media: draft.media,
        featured: false,
        published: draft.published,
        visibility: draft.visibility,
        sortOrder: -1,
      });
    }
    return list;
  }, [peers, draft]);

  const minRows = Math.max(1, Math.ceil(Math.max(mergedPeers.length, 1) / 2));
  const [rows, setRows] = useState(minRows);

  useEffect(() => {
    setRows((r) => Math.max(r, minRows));
  }, [minRows]);

  const slots: Slot[] = useMemo(() => {
    const total = rows * 2;
    const out: Slot[] = [];
    for (let i = 0; i < total; i++) {
      const peer = mergedPeers[i];
      if (peer) {
        out.push({
          kind: "project",
          peer,
          isCurrent: peer.id === draft.id,
        });
      } else {
        out.push({ kind: "empty", key: `empty-${i}` });
      }
    }
    return out;
  }, [rows, mergedPeers, draft.id]);

  const gridIds = useMemo(
    () => new Set(mergedPeers.map((p) => p.id)),
    [mergedPeers],
  );

  const available = useMemo(
    () =>
      pickerItems.filter(
        (p) => !gridIds.has(p.id) || (pickingSlot !== null && false),
      ),
    [pickerItems, gridIds, pickingSlot],
  );

  async function patchProject(
    id: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Could not update project");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function addProjectToSlot(projectId: string, slotIndex: number) {
    setPickingSlot(null);
    // Reindex: place chosen project at slotIndex among current featured order
    const order = mergedPeers
      .filter((p) => p.featured || p.id === draft.id)
      .map((p) => p.id)
      .filter((id) => id !== projectId);
    // Ensure even indexing — insert at slotIndex
    const next = [...order];
    next.splice(slotIndex, 0, projectId);

    const ok = await patchProject(projectId, {
      featured: true,
      published: true,
      visibility: "PUBLIC",
      sortOrder: slotIndex,
    });
    if (!ok) return;

    // Best-effort reindex remaining featured peers
    await Promise.all(
      next.map((id, i) =>
        id === projectId
          ? Promise.resolve()
          : fetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sortOrder: i }),
            }).catch(() => null),
      ),
    );
    router.refresh();
  }

  async function removeFromGrid(id: string) {
    if (id === draft.id) {
      onChange("featured", false);
      return;
    }
    await patchProject(id, { featured: false });
  }

  const rowsOfSlots = chunkPairs(slots);

  return (
    <div className="cms-selected-root">
      <div className="cms-selected-banner">
        <div className="cms-selected-banner-text">
          <p className="cms-selected-banner-kicker">Homepage · Selected Projects</p>
          <p className="cms-selected-banner-copy">
            Same 2-up grid as the site. Click text to edit this card, hover media to
            swap image/clip, or add a row for two more slots.
          </p>
        </div>
        <button
          type="button"
          className="cms-btn cms-btn-ghost cms-selected-add-row"
          onClick={() => setRows((r) => r + 1)}
        >
          + Add row
        </button>
      </div>

      {error ? <p className="cms-selected-error">{error}</p> : null}

      <div className="cms-selected-stage">
        {rowsOfSlots.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="cms-selected-row">
            {rowIndex > 0 ? <div className="cms-selected-row-rule" aria-hidden /> : null}
            <div className="cms-selected-grid">
              {row.map((slot, colIndex) => {
                const slotIndex = rowIndex * 2 + colIndex;
                if (slot.kind === "empty") {
                  const isPicking = pickingSlot === slotIndex;
                  return (
                    <div
                      key={slot.key}
                      className={`cms-selected-cell is-empty${isPicking ? " is-picking" : ""}`}
                    >
                      {isPicking ? (
                        <div className="cms-selected-picker">
                          <div className="cms-selected-picker-head">
                            <strong>Add project to this slot</strong>
                            <button
                              type="button"
                              className="cms-btn cms-btn-ghost"
                              onClick={() => setPickingSlot(null)}
                            >
                              Cancel
                            </button>
                          </div>
                          {available.length === 0 ? (
                            <p className="cms-selected-picker-empty">
                              No other projects left. Create one in Projects, then
                              come back.
                            </p>
                          ) : (
                            <ul className="cms-selected-picker-list">
                              {available.map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    disabled={busyId === p.id}
                                    onClick={() => void addProjectToSlot(p.id, slotIndex)}
                                  >
                                    <span>{p.title}</span>
                                    <em>/{p.slug}</em>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="cms-selected-empty-btn"
                          onClick={() => setPickingSlot(slotIndex)}
                        >
                          <span className="cms-selected-empty-plus" aria-hidden>
                            +
                          </span>
                          <strong>Add project</strong>
                          <em>Fill this grid slot</em>
                        </button>
                      )}
                    </div>
                  );
                }

                const { peer, isCurrent } = slot;

                if (isCurrent) {
                  return (
                    <article
                      key={peer.id}
                      className={`cms-selected-cell is-active${peer.featured ? "" : " is-draft-slot"}`}
                    >
                      {!peer.featured ? (
                        <p className="cms-selected-slot-note">
                          Not featured yet — turn on <strong>Featured on home</strong> in
                          tools (or save after editing).
                        </p>
                      ) : null}

                      <EditableRegion
                        field="title"
                        editing={editing}
                        onEdit={onEdit}
                        label="title"
                        as="div"
                        className="cms-selected-title-wrap"
                      >
                        {editing === "title" ? (
                          <PreviewInput
                            value={draft.title}
                            onChange={(v) => onChange("title", v)}
                            onDone={onDone}
                            className="is-title"
                          />
                        ) : (
                          <h4 className="cms-selected-title">
                            {draft.title || "Project title"}
                          </h4>
                        )}
                      </EditableRegion>

                      <EditableRegion
                        field="summary"
                        editing={editing}
                        onEdit={onEdit}
                        label="summary"
                        as="div"
                        className="cms-selected-body-wrap"
                      >
                        {editing === "summary" ? (
                          <PreviewInput
                            multiline
                            rows={5}
                            value={draft.summary}
                            onChange={(v) => onChange("summary", v)}
                            onDone={onDone}
                          />
                        ) : (
                          <p className="cms-selected-body">
                            {draft.summary ||
                              "Short card description for Selected Projects."}
                          </p>
                        )}
                      </EditableRegion>

                      <div className="cms-selected-visual-slot">
                        <CellMedia
                          media={draft.media}
                          coverImage={draft.coverImage}
                          introSrc={draft.introSrc}
                          title={draft.title}
                          editable
                          onPick={() => onPickImage("heroMedia")}
                        />
                      </div>
                    </article>
                  );
                }

                return (
                  <article key={peer.id} className="cms-selected-cell is-peer">
                    <div className="cms-selected-peer-actions">
                      <Link
                        href={`/cms/projects/${peer.id}`}
                        className="cms-btn cms-btn-ghost"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="cms-btn cms-btn-ghost is-danger"
                        disabled={busyId === peer.id}
                        onClick={() => void removeFromGrid(peer.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <h4 className="cms-selected-title">{peer.title}</h4>
                    <p className="cms-selected-body">{peer.summary}</p>
                    <div className="cms-selected-visual-slot">
                      <CellMedia
                        media={peer.media}
                        coverImage={peer.coverImage}
                        introSrc={peer.introSrc}
                        title={peer.title}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="cms-selected-media-row">
        <button
          type="button"
          className="cms-btn cms-btn-ghost"
          onClick={() => onPickImage("coverImage")}
        >
          Cover image
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-ghost"
          onClick={() => onPickImage("introSrc")}
        >
          Intro / poster
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-ghost"
          onClick={() => onPickImage("heroMedia")}
        >
          Video / clip
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-ghost"
          onClick={() => setRows((r) => r + 1)}
        >
          + Add row (2 slots)
        </button>
      </div>
    </div>
  );
}
