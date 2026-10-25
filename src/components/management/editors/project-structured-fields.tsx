"use client";

import { MediaFileTypeBadge } from "@/components/management/media-file-type-badge";
import { RichTextField } from "@/components/management/rich-text-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GALLERY_LAYOUTS,
  normalizeFeaturesForEditor,
  normalizeGalleryItems,
  normalizeGalleryLayout,
  normalizeLinksForEditor,
  normalizeTechStack,
  normalizeTimelineForEditor,
  parseContentBlocksForEditor,
  type ContentBlock,
  type GalleryItem,
  type GalleryLayout,
} from "@/lib/projects";
import { fetchJson } from "@/lib/fetch-json";
import { isVideoUrl } from "@/lib/media-url";
import { Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const LAYOUT_LABELS: Record<GalleryLayout, string> = {
  bento: "Bento",
  "columns-2": "2 columns",
  "columns-3": "3 columns",
  single: "Single stack",
  mosaic: "Mosaic",
  fan: "Fan deck",
};

export function ProjectStructuredFields({
  locale,
  title,
  tagline,
  role,
  scope,
  description,
  features,
  timeline,
  techStack,
  links,
  screenshots,
  galleryLayout,
  onTitleChange,
  onTaglineChange,
  onRoleChange,
  onScopeChange,
  onDescriptionChange,
  onFeaturesChange,
  onTimelineChange,
  onTechStackChange,
  onLinksChange,
  onScreenshotsChange,
  onGalleryLayoutChange,
}: {
  locale: string;
  title: string;
  tagline: string;
  role: string;
  scope: string;
  description: string;
  features: unknown;
  timeline: unknown;
  techStack: unknown;
  links: unknown;
  screenshots: unknown;
  galleryLayout: string;
  onTitleChange: (v: string) => void;
  onTaglineChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onScopeChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onFeaturesChange: (v: { title: string; description: string }[]) => void;
  onTimelineChange: (v: { date: string; info: string }[]) => void;
  onTechStackChange: (v: { frontend: string[]; backend: string[] }) => void;
  onLinksChange: (v: { label: string; url: string }[]) => void;
  onScreenshotsChange: (v: GalleryItem[]) => void;
  onGalleryLayoutChange: (v: GalleryLayout) => void;
}) {
  const blocks = useMemo(() => {
    return parseContentBlocksForEditor(description).filter(
      (b): b is Extract<ContentBlock, { type: "text" | "image" }> =>
        b.type === "text" || b.type === "image"
    );
  }, [description]);

  const featureRows = normalizeFeaturesForEditor(features);
  const timelineRows = normalizeTimelineForEditor(timeline);
  const tech = normalizeTechStack(techStack);
  const linkRows = normalizeLinksForEditor(links);
  const gallery = normalizeGalleryItems(screenshots);
  const layout = normalizeGalleryLayout(galleryLayout);
  const [chipDraft, setChipDraft] = useState<{ frontend: string; backend: string }>({
    frontend: "",
    backend: "",
  });
  const [uploadingShot, setUploadingShot] = useState(false);

  function commitBlocks(next: ContentBlock[]) {
    onDescriptionChange(JSON.stringify(next));
  }

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    commitBlocks(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b))
    );
  }

  function addTextBlock() {
    commitBlocks([...blocks, { id: newId(), type: "text", value: "" }]);
  }

  function addImageBlock(src: string) {
    commitBlocks([...blocks, { id: newId(), type: "image", src, alt: "" }]);
  }

  function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id);
    commitBlocks(next.length ? next : [{ id: newId(), type: "text", value: "" }]);
  }

  function patchGalleryItem(i: number, patch: Partial<GalleryItem>) {
    const next = gallery.map((item, j) => (j === i ? { ...item, ...patch } : item));
    onScreenshotsChange(next);
  }

  async function uploadAboutImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const { ok, data } = await fetchJson<{ url?: string; error?: string }>(
      "/api/cms/upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder: "about" }),
      }
    );
    if (ok && data.url) addImageBlock(data.url);
  }

  async function uploadScreenshot(file: File | null) {
    if (!file) return;
    setUploadingShot(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { ok, data } = await fetchJson<{ url?: string; error?: string }>(
        "/api/cms/upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, folder: "gallery" }),
        }
      );
      if (ok && data.url) {
        onScreenshotsChange([...gallery, { src: data.url, title: "", text: "" }]);
      }
    } finally {
      setUploadingShot(false);
    }
  }

  return (
    <div className="space-y-8 rounded-[28px] bg-white/70 p-5 sm:p-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Title ({locale})</span>
        <Input
          className="cms-input h-11 rounded-2xl border-[var(--cms-line)] bg-[var(--cms-input)] px-4 text-lg font-semibold"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </label>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Intro tagline ({locale})</h3>
        <p className="text-xs text-muted-foreground">
          Short intro on the case study — rich text (bold, italic, links).
        </p>
        <RichTextField
          value={tagline}
          onChange={onTaglineChange}
          placeholder="One or two sentences about the project…"
          minHeight={100}
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Role</span>
          <Input
            className="h-10 rounded-full px-4"
            placeholder="e.g. Full-stack"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">About (content blocks)</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={addTextBlock}>
              <Plus className="size-3.5" /> Text
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium">
              <Upload className="size-3.5" /> Image / video
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => uploadAboutImage(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
        <div className="space-y-4">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-2xl bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {block.type}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-red-600"
                  onClick={() => removeBlock(block.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {block.type === "text" ? (
                <RichTextField
                  value={block.value}
                  onChange={(html) => updateBlock(block.id, { value: html })}
                  placeholder="Write about this project…"
                  minHeight={120}
                />
              ) : (
                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-xl">
                    {isVideoUrl(block.src) ? (
                      <video
                        src={block.src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="max-h-48 w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={block.src}
                        alt={block.alt || ""}
                        className="max-h-48 w-full object-cover"
                      />
                    )}
                    <MediaFileTypeBadge src={block.src} size="sm" />
                  </div>
                  <Input
                    className="h-9 rounded-full px-3 text-xs"
                    value={block.alt || ""}
                    placeholder="Alt text"
                    onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Key features</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              onFeaturesChange([...featureRows, { title: "", description: "" }])
            }
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {featureRows.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Input
                  className="h-9 rounded-full px-3"
                  placeholder="Feature title"
                  value={row.title}
                  onChange={(e) => {
                    const next = [...featureRows];
                    next[i] = { ...row, title: e.target.value };
                    onFeaturesChange(next);
                  }}
                />
                <Input
                  className="h-9 rounded-full px-3"
                  placeholder="Short description"
                  value={row.description}
                  onChange={(e) => {
                    const next = [...featureRows];
                    next[i] = { ...row, description: e.target.value };
                    onFeaturesChange(next);
                  }}
                />
              </div>
              <button
                type="button"
                className="justify-self-end text-muted-foreground hover:text-red-600"
                onClick={() => onFeaturesChange(featureRows.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Timeline</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => onTimelineChange([...timelineRows, { date: "", info: "" }])}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {timelineRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-start gap-2 rounded-2xl bg-muted/40 p-3">
              <Input
                type="date"
                className="h-9 w-40 rounded-full px-3"
                value={row.date.slice(0, 10)}
                onChange={(e) => {
                  const next = [...timelineRows];
                  next[i] = { ...row, date: e.target.value };
                  onTimelineChange(next);
                }}
              />
              <Input
                className="h-9 min-w-[12rem] flex-1 rounded-full px-3"
                placeholder="What happened"
                value={row.info}
                onChange={(e) => {
                  const next = [...timelineRows];
                  next[i] = { ...row, info: e.target.value };
                  onTimelineChange(next);
                }}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-red-600"
                onClick={() => onTimelineChange(timelineRows.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium">Tech stack</h3>
        {(["frontend", "backend"] as const).map((side) => (
          <div key={side}>
            <p className="mb-2 text-xs font-medium capitalize text-muted-foreground">{side}</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {tech[side].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-red-50 hover:text-red-600"
                  onClick={() =>
                    onTechStackChange({
                      ...tech,
                      [side]: tech[side].filter((t) => t !== chip),
                    })
                  }
                  title="Remove"
                >
                  {chip} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                className="h-9 rounded-full px-3"
                placeholder={`Add ${side} tech`}
                value={chipDraft[side]}
                onChange={(e) => setChipDraft((d) => ({ ...d, [side]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const v = chipDraft[side].trim();
                  if (!v || tech[side].includes(v)) return;
                  onTechStackChange({ ...tech, [side]: [...tech[side], v] });
                  setChipDraft((d) => ({ ...d, [side]: "" }));
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  const v = chipDraft[side].trim();
                  if (!v || tech[side].includes(v)) return;
                  onTechStackChange({ ...tech, [side]: [...tech[side], v] });
                  setChipDraft((d) => ({ ...d, [side]: "" }));
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Links</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => onLinksChange([...linkRows, { label: "", url: "" }])}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {linkRows.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <Input
              className="h-9 w-36 rounded-full px-3"
              placeholder="Label"
              value={row.label}
              onChange={(e) => {
                const next = [...linkRows];
                next[i] = { ...row, label: e.target.value };
                onLinksChange(next);
              }}
            />
            <Input
              className="h-9 min-w-[12rem] flex-1 rounded-full px-3"
              placeholder="https://"
              value={row.url}
              onChange={(e) => {
                const next = [...linkRows];
                next[i] = { ...row, url: e.target.value };
                onLinksChange(next);
              }}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-red-600"
              onClick={() => onLinksChange(linkRows.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Gallery</h3>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium">
            <Upload className="size-3.5" />
            {uploadingShot ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => uploadScreenshot(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Layout</span>
          <select
            className="cms-input h-10 w-full max-w-xs rounded-full border-[var(--cms-line)] bg-[var(--cms-input)] px-4 text-sm"
            value={layout}
            onChange={(e) =>
              onGalleryLayoutChange(normalizeGalleryLayout(e.target.value))
            }
          >
            {GALLERY_LAYOUTS.map((key) => (
              <option key={key} value={key}>
                {LAYOUT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-4">
          {gallery.map((item, i) => (
            <div
              key={`${item.src}-${i}`}
              className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[160px_1fr_auto]"
            >
              <div className="relative overflow-hidden rounded-xl">
                {isVideoUrl(item.src) ? (
                  <video
                    src={item.src}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="aspect-video w-full object-cover sm:aspect-square"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt=""
                    className="aspect-video w-full object-cover sm:aspect-square"
                  />
                )}
                <MediaFileTypeBadge
                  src={item.src}
                  size="sm"
                  className="cms-media-type-badge--tight"
                />
              </div>
              <div className="space-y-2">
                <Input
                  className="h-9 rounded-full px-3"
                  placeholder="Overlay title (optional)"
                  value={item.title || ""}
                  onChange={(e) => patchGalleryItem(i, { title: e.target.value })}
                />
                <Input
                  className="h-9 rounded-full px-3"
                  placeholder="Overlay text (optional)"
                  value={item.text || ""}
                  onChange={(e) => patchGalleryItem(i, { text: e.target.value })}
                />
                <Input
                  className="h-9 rounded-full px-3 text-xs"
                  placeholder="Alt text"
                  value={item.alt || ""}
                  onChange={(e) => patchGalleryItem(i, { alt: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="justify-self-end text-muted-foreground hover:text-red-600"
                onClick={() =>
                  onScreenshotsChange(gallery.filter((_, j) => j !== i))
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
