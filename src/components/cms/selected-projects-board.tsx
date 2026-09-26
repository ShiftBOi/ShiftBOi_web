"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  EditableRegion,
  PreviewInput,
  ProjectImagePicker,
  type ProjectMedia,
} from "@/components/cms/project-editor-primitives";
import {
  moveItemById,
  moveItemToIndex,
  persistFeaturedOrder,
} from "@/components/cms/selected-grid-order";
import { SelectedCardActionIcons } from "@/components/cms/selected-card-actions";
import type {
  SelectedGridPeer,
  SelectedPickerItem,
} from "@/components/cms/project-selected-preview";

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

function SelectedDragHandle() {
  return (
    <span className="cms-selected-drag" aria-hidden title="Drag to reorder">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </span>
  );
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
  item,
  onPick,
}: {
  item: SelectedGridPeer;
  onPick: () => void;
}) {
  const media = item.media;
  const mediaSrc = media?.src || null;
  const poster = media?.poster || item.coverImage || item.introSrc || null;
  const image = item.coverImage || item.introSrc || null;
  const video =
    mediaSrc && (media?.type === "video" || isVideoSrc(mediaSrc))
      ? mediaSrc
      : null;
  const show = video || image || mediaSrc;
  const { rootRef, hot, setHot, pos, onMove } = useFollowCursor();

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
      aria-label={show ? "Change media" : "Add image or clip"}
    >
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
          <strong>Add image or clip</strong>
          <em>Click to upload — shows on homepage</em>
        </span>
      )}
      <FollowHint
        hot={hot}
        pos={pos}
        label={show ? "Change media" : "Add image / video"}
      />
    </button>
  );
}

type Slot =
  | { kind: "project"; item: SelectedGridPeer }
  | { kind: "empty"; key: string };

type MediaTarget = {
  id: string;
  field: "heroMedia" | "coverImage" | "introSrc";
};

/**
 * Section-level Selected Projects editor — every cell is editable.
 */
export function SelectedProjectsBoard({
  featured,
  pickerItems,
}: {
  featured: SelectedGridPeer[];
  pickerItems: SelectedPickerItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(featured);
  const [editing, setEditing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  const featuredKey = featured.map((f) => `${f.id}:${f.sortOrder}`).join("|");

  useEffect(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    setItems(featured);
    setDirty({});
  }, [featuredKey, featured]);

  const rows = Math.max(1, Math.ceil((items.length + 1) / 2));

  const slots: Slot[] = useMemo(() => {
    const total = rows * 2;
    const out: Slot[] = [];
    for (let i = 0; i < total; i++) {
      const item = items[i];
      if (item) out.push({ kind: "project", item });
      else out.push({ kind: "empty", key: `empty-${i}` });
    }
    return out;
  }, [rows, items]);

  const gridIds = useMemo(() => new Set(items.map((p) => p.id)), [items]);
  const available = useMemo(
    () => pickerItems.filter((p) => !gridIds.has(p.id)),
    [pickerItems, gridIds],
  );

  const dirtyCount = Object.values(dirty).filter(Boolean).length;

  function patchLocal(id: string, patch: Partial<SelectedGridPeer>) {
    setItems((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty((d) => ({ ...d, [id]: true }));
  }

  async function patchRemote(
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
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "Could not update project");
        return false;
      }
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function saveAll() {
    const ids = Object.entries(dirty)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (ids.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const id of ids) {
        const item = items.find((p) => p.id === id);
        if (!item) continue;
        const ok = await patchRemote(id, {
          title: item.title,
          summary: item.summary,
          coverImage: item.coverImage,
          introSrc: item.introSrc,
          media: item.media,
          featured: true,
          visibility: "PUBLIC",
        });
        if (!ok) return;
      }
      setDirty({});
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addProjectToSlot(projectId: string, slotIndex: number) {
    setPickingSlot(null);
    const ok = await patchRemote(projectId, {
      featured: true,
      published: true,
      visibility: "PUBLIC",
      sortOrder: slotIndex,
    });
    if (!ok) return;

    const order = [
      ...items.map((p) => p.id).filter((id) => id !== projectId),
    ];
    order.splice(slotIndex, 0, projectId);

    await Promise.all(
      order.map((id, i) =>
        fetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i, featured: true }),
        }).catch(() => null),
      ),
    );
    router.refresh();
  }

  async function removeFromGrid(id: string) {
    const ok = await patchRemote(id, { featured: false });
    if (!ok) return;
    setItems((list) => list.filter((p) => p.id !== id));
    setDirty((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    router.refresh();
  }

  async function commitOrder(next: SelectedGridPeer[]) {
    const withOrder = next.map((p, i) => ({ ...p, sortOrder: i }));
    setItems(withOrder);
    setError(null);
    try {
      await persistFeaturedOrder(withOrder.map((p) => p.id));
      router.refresh();
    } catch {
      setError("Could not save order");
      setItems(featured);
    }
  }

  function onDropOnProject(targetId: string) {
    const fromId = draggingIdRef.current;
    if (!fromId || fromId === targetId) return;
    const next = moveItemById(items, fromId, targetId);
    void commitOrder(next);
  }

  function onDropOnSlot(slotIndex: number) {
    const fromId = draggingIdRef.current;
    if (!fromId) return;
    const next = moveItemToIndex(items, fromId, slotIndex);
    void commitOrder(next);
  }

  function applyMedia(url: string, meta?: { kind?: "image" | "video" }) {
    if (!mediaTarget) return;
    const { id, field } = mediaTarget;
    const item = items.find((p) => p.id === id);
    if (!item) return;

    if (field === "coverImage") {
      patchLocal(id, { coverImage: url || null });
    } else if (field === "introSrc") {
      patchLocal(id, { introSrc: url || null });
    } else {
      if (!url) {
        patchLocal(id, { media: null });
      } else {
        const kind =
          meta?.kind ||
          (isVideoSrc(url) ? "video" : "image");
        const next: ProjectMedia = {
          type: kind,
          src: url,
          poster: item.media?.poster || item.coverImage || item.introSrc || undefined,
          colorSrc: kind === "video" ? url : item.media?.colorSrc,
        };
        patchLocal(id, {
          media: next,
          coverImage: kind === "image" ? url : item.coverImage,
        });
      }
    }
    setMediaTarget(null);
  }

  const pickerItem = mediaTarget
    ? items.find((p) => p.id === mediaTarget.id)
    : null;
  const pickerValue =
    mediaTarget && pickerItem
      ? mediaTarget.field === "coverImage"
        ? pickerItem.coverImage || ""
        : mediaTarget.field === "introSrc"
          ? pickerItem.introSrc || ""
          : pickerItem.media?.src || pickerItem.media?.colorSrc || ""
      : "";

  const rowsOfSlots = chunkPairs(slots);

  return (
    <div className="cms-selected-board">
      <div className="cms-selected-banner">
        <div className="cms-selected-banner-text">
          <p className="cms-selected-banner-kicker">Homepage · Selected Projects</p>
          <p className="cms-selected-banner-copy">
            Edit every card in the 2-up grid — title, summary, and media. Drag the
            ··· handle to reorder, or use an empty slot to add a project.
          </p>
        </div>
      </div>

      {error ? <p className="cms-selected-error">{error}</p> : null}

      <div
        className="cms-selected-stage"
        onClick={() => {
          if (editing) setEditing(null);
        }}
      >
        {rowsOfSlots.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="cms-selected-row">
            {rowIndex > 0 ? (
              <div className="cms-selected-row-rule" aria-hidden />
            ) : null}
            <div className="cms-selected-grid">
              {row.map((slot, colIndex) => {
                const slotIndex = rowIndex * 2 + colIndex;
                if (slot.kind === "empty") {
                  const isPicking = pickingSlot === slotIndex;
                  const dropKey = `empty-${slotIndex}`;
                  const isOver = overKey === dropKey && Boolean(draggingId);
                  return (
                    <div
                      key={slot.key}
                      className={`cms-selected-cell is-empty${isPicking ? " is-picking" : ""}${isOver ? " is-drop-target" : ""}`}
                      onDragOver={(e) => {
                        if (!draggingIdRef.current) return;
                        e.preventDefault();
                        setOverKey(dropKey);
                      }}
                      onDragLeave={() => {
                        setOverKey((k) => (k === dropKey ? null : k));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        onDropOnSlot(slotIndex);
                        draggingIdRef.current = null;
                        setDraggingId(null);
                        setOverKey(null);
                      }}
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
                              No other projects left. Create one in All projects,
                              then come back.
                            </p>
                          ) : (
                            <ul className="cms-selected-picker-list">
                              {available.map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    disabled={busyId === p.id}
                                    onClick={() =>
                                      void addProjectToSlot(p.id, slotIndex)
                                    }
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
                          <strong>
                            {draggingId ? "Drop here" : "Add project"}
                          </strong>
                          <em>
                            {draggingId
                              ? "Move card to this slot"
                              : "Fill this grid slot"}
                          </em>
                        </button>
                      )}
                    </div>
                  );
                }

                const { item } = slot;
                const titleField = `${item.id}:title`;
                const summaryField = `${item.id}:summary`;
                const isDirty = Boolean(dirty[item.id]);
                const isDragging = draggingId === item.id;
                const isOver =
                  overKey === item.id &&
                  Boolean(draggingId) &&
                  draggingId !== item.id;

                return (
                  <article
                    key={item.id}
                    className={`cms-selected-cell is-active${isDirty ? " is-dirty-cell" : ""}${isDragging ? " is-dragging" : ""}${isOver ? " is-drop-target" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                    onDragOver={(e) => {
                      if (
                        !draggingIdRef.current ||
                        draggingIdRef.current === item.id
                      )
                        return;
                      e.preventDefault();
                      setOverKey(item.id);
                    }}
                    onDragLeave={() => {
                      setOverKey((k) => (k === item.id ? null : k));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      onDropOnProject(item.id);
                      draggingIdRef.current = null;
                      setDraggingId(null);
                      setOverKey(null);
                    }}
                  >
                    <div className="cms-selected-peer-actions">
                      <span
                        className="cms-selected-drag-btn"
                        role="button"
                        tabIndex={0}
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", item.id);
                          e.dataTransfer.effectAllowed = "move";
                          draggingIdRef.current = item.id;
                          setDraggingId(item.id);
                        }}
                        onDragEnd={() => {
                          draggingIdRef.current = null;
                          setDraggingId(null);
                          setOverKey(null);
                        }}
                      >
                        <SelectedDragHandle />
                      </span>
                      <SelectedCardActionIcons
                        editHref={`/cms/projects/${item.id}?view=selected`}
                        removeDisabled={busyId === item.id}
                        onRemove={() => void removeFromGrid(item.id)}
                      />
                    </div>

                    <EditableRegion
                      field={titleField}
                      editing={editing}
                      onEdit={setEditing}
                      label="title"
                      as="div"
                      className="cms-selected-title-wrap"
                    >
                      {editing === titleField ? (
                        <PreviewInput
                          value={item.title}
                          onChange={(v) => patchLocal(item.id, { title: v })}
                          onDone={() => setEditing(null)}
                          className="is-title"
                        />
                      ) : (
                        <h4 className="cms-selected-title">
                          {item.title || "Project title"}
                        </h4>
                      )}
                    </EditableRegion>

                    <EditableRegion
                      field={summaryField}
                      editing={editing}
                      onEdit={setEditing}
                      label="summary"
                      as="div"
                      className="cms-selected-body-wrap"
                    >
                      {editing === summaryField ? (
                        <PreviewInput
                          multiline
                          rows={5}
                          value={item.summary}
                          onChange={(v) => patchLocal(item.id, { summary: v })}
                          onDone={() => setEditing(null)}
                        />
                      ) : (
                        <p className="cms-selected-body">
                          {item.summary ||
                            "Short card description for Selected Projects."}
                        </p>
                      )}
                    </EditableRegion>

                    <div className="cms-selected-visual-slot">
                      <CellMedia
                        item={item}
                        onPick={() =>
                          setMediaTarget({ id: item.id, field: "heroMedia" })
                        }
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
        <Link href="/#work" className="cms-btn cms-btn-ghost" target="_blank">
          View live
        </Link>
      </div>

      {dirtyCount > 0 ? (
        <div className="cms-save-bar">
          <div className="cms-save-bar-inner">
            <p>
              <span className="cms-save-dot" aria-hidden />
              {dirtyCount} card{dirtyCount === 1 ? "" : "s"} with unsaved changes
            </p>
            {error ? <p className="cms-error">{error}</p> : null}
            <div className="cms-save-bar-actions">
              <button
                type="button"
                className="cms-btn cms-btn-ghost"
                disabled={saving}
                onClick={() => {
                  setItems(featured);
                  setDirty({});
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                disabled={saving}
                onClick={() => void saveAll()}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mediaTarget ? (
        <ProjectImagePicker
          title={
            mediaTarget.field === "coverImage"
              ? "Cover image"
              : mediaTarget.field === "introSrc"
                ? "Intro / poster"
                : "Card image or video"
          }
          folder={
            mediaTarget.field === "coverImage"
              ? "coverimage"
              : mediaTarget.field === "introSrc"
                ? "intro"
                : "hero"
          }
          accept={mediaTarget.field === "heroMedia" ? "media" : "image"}
          value={pickerValue}
          onChange={applyMedia}
          onClose={() => setMediaTarget(null)}
        />
      ) : null}
    </div>
  );
}
