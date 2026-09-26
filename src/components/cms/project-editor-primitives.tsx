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

type ImagePickerProps = {
  title: string;
  value: string;
  folder?: string;
  /** image = icons/covers; media = hero image or video */
  accept?: "image" | "media";
  onChange: (url: string, meta?: { kind: "image" | "video" }) => void;
  onClose: () => void;
};

export function ProjectImagePicker({
  title,
  value,
  folder = "cms",
  accept = "image",
  onChange,
  onClose,
}: ImagePickerProps) {
  const [url, setUrl] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const allowVideo = accept === "media";

  function kindFromFile(file: File): "image" | "video" {
    return file.type.startsWith("video/") ? "video" : "image";
  }

  function kindFromUrl(raw: string): "image" | "video" {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(raw) ? "video" : "image";
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Upload failed");
      onChange(body.url as string, { kind: kindFromFile(file) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cms-modal-backdrop" onClick={onClose}>
      <div className="cms-modal cms-image-picker" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="cms-modal-head">
          <h2>{title}</h2>
          <button type="button" className="cms-sidebar-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

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
        >
          <input
            type="file"
            accept={allowVideo ? "image/*,video/*" : "image/*"}
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
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

        <div className="cms-image-picker-url">
          <input
            className="cms-inline-input"
            value={url}
            placeholder={allowVideo ? "Or paste image / video URL…" : "Or paste image URL…"}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="cms-btn cms-btn-primary"
            disabled={!url.trim()}
            onClick={() => {
              const next = url.trim();
              onChange(next, { kind: kindFromUrl(next) });
              onClose();
            }}
          >
            Use URL
          </button>
        </div>

        {value ? (
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() => {
              onChange("");
              onClose();
            }}
          >
            {allowVideo ? "Remove media" : "Remove image"}
          </button>
        ) : null}

        {error ? <p className="cms-error">{error}</p> : null}
      </div>
    </div>
  );
}
