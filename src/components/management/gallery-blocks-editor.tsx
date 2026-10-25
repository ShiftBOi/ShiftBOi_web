"use client";

import { MediaFileTypeBadge } from "@/components/management/media-file-type-badge";
import { R2Finder } from "@/components/management/r2-finder";
import { isVideoUrl } from "@/lib/media-url";
import {
  GALLERY_LAYOUTS,
  GALLERY_MODULE_SLOTS,
  createGalleryModule,
  emptyGallerySlots,
  normalizeGalleryModules,
  type GalleryItem,
  type GalleryLayout,
  type GalleryModule,
} from "@/lib/projects";
import { cn } from "cn";
import {
  FolderOpen,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

const LAYOUT_LABELS: Record<GalleryLayout, string> = {
  bento: "Bento",
  "columns-2": "2 grid",
  "columns-3": "3 grid",
  single: "Single",
  mosaic: "Mosaic",
  fan: "Fan",
};

function layoutClass(layout: GalleryLayout) {
  if (layout === "columns-2") return "hq-cs-gallery--cols-2";
  if (layout === "columns-3") return "hq-cs-gallery--cols-3";
  if (layout === "single") return "hq-cs-gallery--single";
  if (layout === "mosaic") return "hq-cs-gallery--mosaic";
  return "hq-cs-gallery--bento";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function GalleryBlocksEditor({
  value,
  fallbackLayout = "bento",
  onChange,
}: {
  value: unknown;
  fallbackLayout?: string;
  onChange: (modules: GalleryModule[]) => void;
}) {
  const modules = normalizeGalleryModules(value, fallbackLayout);
  const [finderSlot, setFinderSlot] = useState<{
    modId: string;
    index: number;
  } | null>(null);
  const [dragMod, setDragMod] = useState<number | null>(null);
  const [overMod, setOverMod] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const dragFrom = useRef<number | null>(null);

  function commit(next: GalleryModule[]) {
    onChange(next);
  }

  function patchModule(id: string, patch: Partial<GalleryModule>) {
    commit(
      modules.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }

  function patchItem(
    modId: string,
    index: number,
    patch: Partial<GalleryItem>
  ) {
    commit(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          items: m.items.map((item, i) =>
            i === index ? { ...item, ...patch } : item
          ),
        };
      })
    );
  }

  function setModuleLayout(id: string, layout: GalleryLayout) {
    const slots = GALLERY_MODULE_SLOTS[layout];
    commit(
      modules.map((m) => {
        if (m.id !== id) return m;
        const kept = m.items.slice(0, slots);
        const items =
          kept.length >= slots
            ? kept
            : [...kept, ...emptyGallerySlots(slots - kept.length)];
        return { ...m, layout, items };
      })
    );
  }

  function addModule(layout: GalleryLayout) {
    commit([...modules, createGalleryModule(layout)]);
  }

  function removeModule(id: string) {
    commit(modules.filter((m) => m.id !== id));
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...modules];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    commit(next);
  }

  async function uploadToSlot(
    modId: string,
    index: number,
    file: File | null
  ) {
    if (!file) return;
    setUploading(true);
    try {
      const image = await fileToBase64(file);
      const res = await fetch("/api/cms/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          image,
          folder: "gallery",
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { url?: string };
      };
      if (res.ok && json.data?.url) {
        patchItem(modId, index, { src: json.data.url });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="hq-cs-cms-gallery-modules">
      <div className="hq-cs-cms-gallery-bar">
        <p className="hq-cs-cms-gallery-hint">
          Add layout modules, fill placeholders from R2 or upload.
        </p>
        <div className="hq-cs-cms-module-add">
          {GALLERY_LAYOUTS.map((key) => (
            <button
              key={key}
              type="button"
              className="hq-cs-cms-pill"
              onClick={() => addModule(key)}
              title={`Add ${LAYOUT_LABELS[key]} block`}
            >
              <Plus className="size-3" />
              {LAYOUT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="hq-cs-cms-gallery-empty">
          <LayoutGrid className="size-8 opacity-40" />
          <p>No gallery modules yet</p>
          <button
            type="button"
            className="hq-cs-cms-add"
            onClick={() => addModule("bento")}
          >
            <Plus className="size-3.5" /> Add bento block
          </button>
        </div>
      ) : null}

      {modules.map((mod, mi) => (
        <article
          key={mod.id}
          className={cn(
            "hq-cs-cms-gallery-module",
            overMod === mi && "is-drop"
          )}
          draggable
          onDragStart={() => {
            dragFrom.current = mi;
            setDragMod(mi);
          }}
          onDragEnd={() => {
            dragFrom.current = null;
            setDragMod(null);
            setOverMod(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverMod(mi);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const from = dragFrom.current;
            if (from != null) reorder(from, mi);
            setOverMod(null);
            setDragMod(null);
          }}
        >
          <header className="hq-cs-cms-gallery-module__head">
            <span className="hq-cs-cms-gallery-module__grip" title="Drag to reorder">
              <GripVertical className="size-4" />
            </span>
            <div className="hq-cs-cms-layout-pills">
              {GALLERY_LAYOUTS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "hq-cs-cms-pill",
                    mod.layout === key && "is-active"
                  )}
                  onClick={() => setModuleLayout(mod.id, key)}
                >
                  {LAYOUT_LABELS[key]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="hq-cs-cms-icon-btn"
              title="Remove module"
              onClick={() => removeModule(mod.id)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </header>

          <div className={cn("hq-cs-gallery", layoutClass(mod.layout))}>
            {mod.items.map((item, i) => {
              const filled = Boolean(item.src);
              return (
                <div
                  key={`${mod.id}-${i}`}
                  className={cn(
                    "hq-cs-gallery-fig hq-cs-cms-gallery-fig",
                    !filled && "is-placeholder",
                    mod.layout === "bento" && i === 0 && "is-hero",
                    mod.layout === "mosaic" && i % 5 === 0 && "is-wide",
                    dragMod === mi && "is-dragging"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (
                      file &&
                      (file.type.startsWith("image/") ||
                        file.type.startsWith("video/"))
                    ) {
                      void uploadToSlot(mod.id, i, file);
                    }
                  }}
                >
                  {filled ? (
                    <>
                      {isVideoUrl(item.src) ? (
                        <video
                          src={item.src}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.src} alt="" />
                      )}
                      <MediaFileTypeBadge src={item.src} size="sm" />
                    </>
                  ) : (
                    <div className="hq-cs-cms-slot">
                      <ImagePlus className="size-6 opacity-45" />
                      <span>Drop image / video or pick from R2</span>
                    </div>
                  )}

                  {filled ? (
                    <div className="hq-cs-gallery-fig__cap hq-cs-cms-gallery-cap">
                      <input
                        className="hq-cs-cms-inline hq-cs-gallery-fig__title"
                        value={item.title || ""}
                        placeholder="Overlay title"
                        onChange={(e) =>
                          patchItem(mod.id, i, { title: e.target.value })
                        }
                      />
                      <input
                        className="hq-cs-cms-inline hq-cs-gallery-fig__text"
                        value={item.text || ""}
                        placeholder="Overlay text"
                        onChange={(e) =>
                          patchItem(mod.id, i, { text: e.target.value })
                        }
                      />
                    </div>
                  ) : null}

                  <div className="hq-cs-cms-slot-actions">
                    <button
                      type="button"
                      className="hq-cs-cms-slot-btn"
                      title="Choose from R2"
                      onClick={() => setFinderSlot({ modId: mod.id, index: i })}
                    >
                      <FolderOpen className="size-3.5" />
                      R2
                    </button>
                    <label className="hq-cs-cms-slot-btn">
                      <Upload className="size-3.5" />
                      {uploading ? "…" : "Upload"}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          void uploadToSlot(
                            mod.id,
                            i,
                            e.target.files?.[0] ?? null
                          );
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {filled ? (
                      <button
                        type="button"
                        className="hq-cs-cms-slot-btn is-danger"
                        onClick={() =>
                          patchItem(mod.id, i, {
                            src: "",
                            title: "",
                            text: "",
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ))}

      <R2Finder
        open={Boolean(finderSlot)}
        folder="gallery"
        onClose={() => setFinderSlot(null)}
        onSelect={(url) => {
          if (!finderSlot) return;
          patchItem(finderSlot.modId, finderSlot.index, { src: url });
          setFinderSlot(null);
        }}
      />
    </div>
  );
}
