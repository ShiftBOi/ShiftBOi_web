"use client";

import { useEffect, useRef, useState } from "react";
import type { EditableField } from "@/lib/project-draft";

export type {
  DetailBlock,
  DetailHighlight,
  DetailSection,
  EditableField,
  HighlightItem,
  ProjectBand,
  ProjectDraft,
  ProjectMedia,
  SectionItem,
} from "@/lib/project-draft";
export {
  asHighlights,
  asMedia,
  asSections,
  emptyBand,
  emptyDetailHighlight,
  emptyDetailSection,
  resolveBands,
  resolveDetails,
  splitDetails,
} from "@/lib/project-draft";

type RegionProps = {
  field: Exclude<EditableField, null>;
  editing: EditableField;
  onEdit: (field: Exclude<EditableField, null>) => void;
  className?: string;
  label?: string;
  /** Use `div` for block media / stand-alone blocks; default `span` for inline text in headings/paragraphs. */
  as?: "span" | "div";
  children: React.ReactNode;
};

export function EditableRegion({
  field,
  editing,
  onEdit,
  className = "",
  label,
  as = "span",
  children,
}: RegionProps) {
  const isEditing = editing === field;
  const Tag = as;
  return (
    <Tag
      className={`cms-editable${isEditing ? " is-editing" : ""}${className ? ` ${className}` : ""}`}
      data-field={field}
      onClick={(e) => {
        if (isEditing) return;
        e.stopPropagation();
        onEdit(field);
      }}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEdit(field);
        }
      }}
      role={isEditing ? undefined : "button"}
      tabIndex={isEditing ? undefined : 0}
    >
      {label && !isEditing ? <span className="cms-editable-hint">{label}</span> : null}
      {children}
    </Tag>
  );
}

type InputProps = {
  value: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
  onDone: () => void;
};

export function PreviewInput({
  value,
  multiline,
  rows = 3,
  placeholder,
  className = "",
  onChange,
  onDone,
}: InputProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return multiline ? (
    <textarea
      ref={ref as React.RefObject<HTMLTextAreaElement>}
      className={`cms-preview-input is-multi ${className}`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Escape") onDone();
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onDone();
      }}
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      className={`cms-preview-input ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") onDone();
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export type ImagePickerMeta = {
  kind: "image" | "video";
  objectPosition?: string;
};

type ImagePickerProps = {
  title: string;
  value: string;
  /** Initial framing, e.g. "40% 55%" */
  objectPosition?: string;
  folder?: string;
  /** image = icons/covers; media = hero image or video */
  accept?: "image" | "media";
  onChange: (url: string, meta?: ImagePickerMeta) => void;
  onClose: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseObjectPosition(raw?: string): { x: number; y: number } {
  if (!raw) return { x: 50, y: 50 };
  const parts = raw.trim().split(/\s+/);
  const x = Number.parseFloat(parts[0] ?? "50");
  const y = Number.parseFloat(parts[1] ?? "50");
  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : 50,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : 50,
  };
}

function formatObjectPosition(x: number, y: number) {
  return `${Math.round(x)}% ${Math.round(y)}%`;
}

function ReframeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ProjectImagePicker({
  title,
  value,
  objectPosition: objectPositionProp,
  folder = "cms",
  accept = "image",
  onChange,
  onClose,
}: ImagePickerProps) {
  const [url, setUrl] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [reframing, setReframing] = useState(false);
  const [pos, setPos] = useState(() => parseObjectPosition(objectPositionProp));
  const draggingRef = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const frameSizeRef = useRef({ w: 1, h: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowVideo = accept === "media";
  const previewSrc = (url.trim() || value).trim();
  const previewIsVideo = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(previewSrc);
  const positionCss = formatObjectPosition(pos.x, pos.y);

  useEffect(() => {
    setUrl(value);
    setReframing(false);
  }, [value]);

  useEffect(() => {
    setPos(parseObjectPosition(objectPositionProp));
  }, [objectPositionProp, value]);

  function kindFromFile(file: File): "image" | "video" {
    return file.type.startsWith("video/") ? "video" : "image";
  }

  function kindFromUrl(raw: string): "image" | "video" {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(raw) ? "video" : "image";
  }

  function commit(nextUrl: string, kind: "image" | "video", close = true) {
    onChange(nextUrl, { kind, objectPosition: formatObjectPosition(pos.x, pos.y) });
    if (close) onClose();
  }

  function openFilePicker() {
    if (uploading) return;
    fileInputRef.current?.click();
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    setReframing(false);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Upload failed");
      const next = body.url as string;
      setUrl(next);
      setPos({ x: 50, y: 50 });
      commit(next, kindFromFile(file), true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeMedia() {
    setUrl("");
    setPos({ x: 50, y: 50 });
    setReframing(false);
    onChange("", { kind: "image" });
    onClose();
  }

  function onFramePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!previewSrc || !reframing) return;
    const el = frameRef.current ?? e.currentTarget;
    const rect = el.getBoundingClientRect();
    frameSizeRef.current = {
      w: Math.max(rect.width, 1),
      h: Math.max(rect.height, 1),
    };
    draggingRef.current = true;
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onFramePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !reframing) return;
    const { w, h } = frameSizeRef.current;
    const dx = e.movementX;
    const dy = e.movementY;
    if (dx === 0 && dy === 0) return;
    setPos((prev) => ({
      x: clamp(prev.x - (dx / w) * 100, 0, 100),
      y: clamp(prev.y - (dy / h) * 100, 0, 100),
    }));
  }

  function onFramePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    const el = frameRef.current ?? e.currentTarget;
    if (el?.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="cms-modal-backdrop" onClick={onClose}>
      <div
        className="cms-modal cms-image-picker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="cms-modal-head">
          <h2>{title}</h2>
          <button type="button" className="cms-sidebar-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={allowVideo ? "image/*,video/*" : "image/*"}
          hidden
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />

        {previewSrc ? (
          <div className="cms-image-frame-wrap">
            <div
              ref={frameRef}
              className={`cms-image-frame${reframing ? " is-reframing" : " is-replace"}`}
              onPointerDown={onFramePointerDown}
              onPointerMove={onFramePointerMove}
              onPointerUp={onFramePointerUp}
              onPointerCancel={onFramePointerUp}
              onClick={() => {
                if (!reframing) openFilePicker();
              }}
              title={reframing ? "Drag to adjust framing" : "Click to replace file"}
            >
              {previewIsVideo ? (
                <video
                  className="cms-image-frame-asset"
                  src={previewSrc}
                  style={{ objectPosition: positionCss }}
                  muted
                  playsInline
                  autoPlay
                  loop
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="cms-image-frame-asset"
                  src={previewSrc}
                  alt=""
                  style={{ objectPosition: positionCss }}
                  draggable={false}
                />
              )}

              <div
                className="cms-image-frame-tools"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={`cms-image-tool-btn${reframing ? " is-active" : ""}`}
                  aria-pressed={reframing}
                  aria-label={reframing ? "Exit reframe" : "Reframe"}
                  title={reframing ? "Done reframing" : "Reframe"}
                  onClick={() => setReframing((v) => !v)}
                >
                  <ReframeIcon />
                </button>
                <button
                  type="button"
                  className="cms-image-tool-btn is-danger"
                  aria-label={allowVideo ? "Remove media" : "Remove image"}
                  title={allowVideo ? "Remove media" : "Remove image"}
                  onClick={removeMedia}
                >
                  <TrashIcon />
                </button>
              </div>

              {!reframing ? (
                <span className="cms-image-frame-hint">Click to replace</span>
              ) : (
                <span className="cms-image-frame-hint">Drag to reframe</span>
              )}
            </div>
            {reframing ? <p className="cms-image-frame-meta">Position {positionCss}</p> : null}
          </div>
        ) : (
          <label
            className={`cms-dropzone${drag ? " is-active" : ""}${uploading ? " is-busy" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const file = e.dataTransfer.files[0];
              if (file) void upload(file);
            }}
            onClick={(e) => {
              e.preventDefault();
              openFilePicker();
            }}
          >
            <span className="cms-dropzone-title">
              {uploading
                ? "Uploading…"
                : drag
                  ? allowVideo
                    ? "Drop image or video"
                    : "Drop image"
                  : "Drag & drop or click to upload"}
            </span>
            <span className="cms-dropzone-hint">
              {allowVideo
                ? "PNG, JPG, WEBP, MP4, WEBM · images 12MB · video 80MB"
                : "PNG, JPG, WEBP · max 12MB"}
            </span>
          </label>
        )}

        <div className="cms-image-picker-url">
          <input
            className="cms-inline-input"
            value={url}
            placeholder={allowVideo ? "Or paste image / video URL…" : "Or paste image URL…"}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            disabled={!url.trim() || url.trim() === previewSrc}
            onClick={() => {
              const next = url.trim();
              setUrl(next);
              setReframing(false);
              setPos({ x: 50, y: 50 });
            }}
          >
            Preview
          </button>
        </div>

        <div className="cms-image-picker-actions">
          <button type="button" className="cms-btn cms-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="cms-btn cms-btn-primary"
            disabled={!previewSrc || uploading}
            onClick={() => {
              commit(previewSrc, kindFromUrl(previewSrc), true);
            }}
          >
            Save
          </button>
        </div>

        {error ? <p className="cms-error">{error}</p> : null}
      </div>
    </div>
  );
}
