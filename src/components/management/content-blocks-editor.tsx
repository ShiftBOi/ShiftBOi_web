"use client";

import { MediaFileTypeBadge } from "@/components/management/media-file-type-badge";
import { isVideoUrl } from "@/lib/media-url";
import { R2Finder } from "@/components/management/r2-finder";
import { RichTextField } from "@/components/management/rich-text-field";
import { fetchJson } from "@/lib/fetch-json";
import {
  parseContentBlocksForEditor,
  type ContentBlock,
} from "@/lib/projects";
import { cn } from "cn";
import {
  FolderOpen,
  GripVertical,
  ImageIcon,
  Link2,
  Plus,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isHtmlEmpty(html: string) {
  return (
    !html ||
    html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() === ""
  );
}

type EditableBlock = Extract<
  ContentBlock,
  { type: "text" | "image" | "link" }
>;

/**
 * Notion-style blocks: hover gutter (+ / drag / delete), seamless text flow.
 */
export function ContentBlocksEditor({
  description,
  onChange,
  tone = "dark",
}: {
  description: string;
  onChange: (json: string) => void;
  tone?: "light" | "dark";
}) {
  const blocks = useMemo(() => {
    return parseContentBlocksForEditor(description).filter(
      (b): b is EditableBlock =>
        b.type === "text" || b.type === "image" || b.type === "link"
    );
  }, [description]);

  const [addMenu, setAddMenu] = useState<number | "bottom" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [finderBlockId, setFinderBlockId] = useState<string | null>(null);

  function commit(next: ContentBlock[]) {
    onChange(
      JSON.stringify(
        next.length ? next : [{ id: newId(), type: "text", value: "" }]
      )
    );
  }

  function makeBlock(type: "text" | "image" | "link"): EditableBlock {
    if (type === "text") return { id: newId(), type: "text", value: "" };
    if (type === "image") return { id: newId(), type: "image", src: "", alt: "" };
    return { id: newId(), type: "link", url: "", label: "" };
  }

  function insertAfter(index: number, type: "text" | "image" | "link") {
    const next = [...blocks];
    next.splice(index + 1, 0, makeBlock(type));
    commit(next);
    setAddMenu(null);
    setPickerOpen(false);
  }

  function startWith(type: "text" | "image" | "link") {
    setUnlocked(true);
    commit([makeBlock(type)]);
    setPickerOpen(false);
  }

  function remove(id: string) {
    const next = blocks.filter((b) => b.id !== id);
    commit(next.length ? next : [{ id: newId(), type: "text", value: "" }]);
  }

  function patch(id: string, data: Partial<ContentBlock>) {
    commit(
      blocks.map((b) =>
        b.id === id ? ({ ...b, ...data } as ContentBlock) : b
      )
    );
  }

  function onDrop(to: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragOver(null);
    if (from == null || from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    commit(next);
  }

  async function uploadImage(blockId: string, file: File | null) {
    if (!file) return;
    setUploadingId(blockId);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { ok, data } = await fetchJson<{ url?: string }>(
        "/api/cms/upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, folder: "about" }),
        }
      );
      if (ok && data.url) patch(blockId, { src: data.url });
    } finally {
      setUploadingId(null);
    }
  }

  useEffect(() => {
    if (addMenu === null) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-addmenu]")) {
        setAddMenu(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [addMenu]);

  const empty =
    !unlocked &&
    blocks.length === 1 &&
    blocks[0]?.type === "text" &&
    isHtmlEmpty(blocks[0].value || "");

  if (empty) {
    return (
      <div className={cn("cms-blocks", tone === "dark" && "cms-blocks--dark")}>
        {pickerOpen ? (
          <div className="cms-blocks__empty-row">
            <EmptyBtn onClick={() => startWith("text")}>
              <Type className="size-3.5 opacity-50" />
              <span>Text</span>
            </EmptyBtn>
            <EmptyBtn onClick={() => startWith("image")}>
              <ImageIcon className="size-3.5 opacity-50" />
              <span>Image</span>
            </EmptyBtn>
            <EmptyBtn onClick={() => startWith("link")}>
              <Link2 className="size-3.5 opacity-50" />
              <span>Link</span>
            </EmptyBtn>
            <button
              type="button"
              className="cms-blocks__icon"
              onClick={() => setPickerOpen(false)}
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <EmptyBtn onClick={() => setPickerOpen(true)} full>
            <Plus className="size-3.5 opacity-50" />
            <span>Add content</span>
          </EmptyBtn>
        )}
      </div>
    );
  }

  return (
    <div className={cn("cms-blocks", tone === "dark" && "cms-blocks--dark")}>
      {blocks.map((block, i) => (
        <div
          key={block.id}
          className={cn(
            "cms-blocks__row group/row",
            dragOver === i && "is-drag-over"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(i);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(i);
          }}
        >
          <div className="cms-blocks__gutter">
            <div className="relative" data-addmenu>
              <button
                type="button"
                className="cms-blocks__icon"
                title="Add below"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAddMenu(addMenu === i ? null : i)}
              >
                <Plus className="size-3.5" />
              </button>
              {addMenu === i ? (
                <div className="cms-blocks__menu" data-addmenu>
                  <button type="button" onClick={() => insertAfter(i, "text")}>
                    <span className="cms-blocks__menu-badge">T</span>
                    Text
                  </button>
                  <button type="button" onClick={() => insertAfter(i, "image")}>
                    <span className="cms-blocks__menu-badge">
                      <ImageIcon className="size-2.5" />
                    </span>
                    Image
                  </button>
                  <button type="button" onClick={() => insertAfter(i, "link")}>
                    <span className="cms-blocks__menu-badge">
                      <Link2 className="size-2.5" />
                    </span>
                    Link
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="cms-blocks__icon cursor-grab active:cursor-grabbing"
              title="Drag"
              draggable
              onDragStart={() => {
                dragFrom.current = i;
              }}
            >
              <GripVertical className="size-3.5" />
            </button>
            <button
              type="button"
              className="cms-blocks__icon cms-blocks__icon--danger"
              onClick={() => remove(block.id)}
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          <div className="cms-blocks__body">
            {block.type === "text" ? (
              <RichTextField
                value={block.value}
                onChange={(html) => patch(block.id, { value: html })}
                placeholder="Write something…"
                tone={tone}
                minHeight={28}
                className="hq-cs-cms-rich--notion"
              />
            ) : block.type === "link" ? (
              <div className="cms-blocks__link grid gap-2 sm:grid-cols-2">
                <input
                  className="cms-input"
                  value={block.label}
                  placeholder="Link label"
                  onChange={(e) => patch(block.id, { label: e.target.value })}
                />
                <input
                  className="cms-input"
                  value={block.url}
                  placeholder="https://"
                  onChange={(e) => patch(block.id, { url: e.target.value })}
                />
              </div>
            ) : (
              <div className="cms-blocks__image">
                {block.src ? (
                  <div className="cms-blocks__image-preview">
                    {isVideoUrl(block.src) ? (
                      <video
                        src={block.src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={block.src} alt={block.alt || ""} />
                    )}
                    <MediaFileTypeBadge src={block.src} size="sm" />
                  </div>
                ) : (
                  <div className="cms-blocks__drop cms-blocks__drop--actions">
                    <button
                      type="button"
                      className="cms-blocks__pick"
                      onClick={() => setFinderBlockId(block.id)}
                    >
                      <FolderOpen className="size-4 opacity-50" />
                      <span>
                        {uploadingId === block.id
                          ? "Uploading…"
                          : "R2 or upload"}
                      </span>
                    </button>
                    <label className="cms-blocks__pick cms-blocks__pick--ghost">
                      <Upload className="size-3.5 opacity-50" />
                      Device
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) =>
                          uploadImage(block.id, e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>
                )}
                {block.src ? (
                  <div className="cms-blocks__image-actions">
                    <input
                      className="cms-input"
                      value={block.alt || ""}
                      placeholder="Alt text"
                      onChange={(e) =>
                        patch(block.id, { alt: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="cms-btn cms-btn--ghost h-8 px-2.5 text-xs"
                      onClick={() => setFinderBlockId(block.id)}
                    >
                      <FolderOpen className="size-3.5" />
                      R2
                    </button>
                    <label className="cms-btn cms-btn--ghost h-8 px-2.5 text-xs">
                      Device
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) =>
                          uploadImage(block.id, e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="cms-blocks__icon"
                      onClick={() => patch(block.id, { src: "" })}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="cms-blocks__footer group/foot" data-addmenu>
        {addMenu === "bottom" ? (
          <div className="cms-blocks__empty-row">
            <EmptyBtn onClick={() => insertAfter(blocks.length - 1, "text")}>
              <Type className="size-3.5 opacity-50" />
              <span>Text</span>
            </EmptyBtn>
            <EmptyBtn onClick={() => insertAfter(blocks.length - 1, "image")}>
              <ImageIcon className="size-3.5 opacity-50" />
              <span>Image</span>
            </EmptyBtn>
            <EmptyBtn onClick={() => insertAfter(blocks.length - 1, "link")}>
              <Link2 className="size-3.5 opacity-50" />
              <span>Link</span>
            </EmptyBtn>
          </div>
        ) : (
          <button
            type="button"
            className="cms-blocks__add-line"
            onClick={() => setAddMenu("bottom")}
          >
            <Plus className="size-3.5" />
            <span>Add content</span>
          </button>
        )}
      </div>

      <R2Finder
        open={Boolean(finderBlockId)}
        folder="about"
        title="Content image · R2"
        onClose={() => setFinderBlockId(null)}
        onSelect={(url) => {
          if (!finderBlockId) return;
          patch(finderBlockId, { src: url });
          setFinderBlockId(null);
        }}
      />
    </div>
  );
}

function EmptyBtn({
  children,
  onClick,
  full,
}: {
  children: ReactNode;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("cms-blocks__empty", full && "is-full")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
