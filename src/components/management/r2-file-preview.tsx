"use client";

import {
  FileType,
  getFileType,
  getFileTypeCategory,
} from "@/components/reui/file-type";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type PreviewFile = {
  key: string;
  url: string;
  filename: string;
  size: number;
  lastModified?: string;
};

type PreviewKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "office"
  | "text"
  | "other";

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function previewKind(filename: string): PreviewKind {
  const ext = extOf(filename);
  if (/^(jpe?g|png|gif|webp|avif|svg|bmp|ico)$/.test(ext)) return "image";
  if (/^(mp4|webm|mov|m4v|ogg)$/.test(ext)) return "video";
  if (/^(mp3|wav|aac|m4a|flac|oga)$/.test(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (
    /^(docx?|xlsx?|pptx?|odt|ods|odp|rtf|csv)$/.test(ext) ||
    getFileTypeCategory(String(getFileType(filename))) === "spreadsheet" ||
    getFileTypeCategory(String(getFileType(filename))) === "presentation"
  ) {
    return "office";
  }
  if (
    /^(txt|md|markdown|json|jsonc|ya?ml|xml|html?|css|scss|less|js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|sh|bash|zsh|env|log|toml|ini|conf|sql|graphql|vue|svelte)$/.test(
      ext
    ) ||
    getFileTypeCategory(String(getFileType(filename))) === "code"
  ) {
    return "text";
  }
  return "other";
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : n < 10 ? 1 : 0)} ${units[i]}`;
}

function officeEmbedUrl(url: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

function TextPreview({ url, filename }: { url: string; filename: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setText(null);
    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.text();
        if (cancelled) return;
        // Cap huge files in the viewer
        setText(
          body.length > 400_000
            ? `${body.slice(0, 400_000)}\n\n… truncated …`
            : body
        );
      } catch {
        if (!cancelled) setError("Couldn’t load text preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return <p className="cms-drive-preview__status">Loading {filename}…</p>;
  }
  if (error || text == null) {
    return <p className="cms-drive-preview__status">{error || "Empty file"}</p>;
  }
  return <pre className="cms-drive-preview__code">{text}</pre>;
}

export function R2FilePreview({
  file,
  onClose,
}: {
  file: PreviewFile;
  onClose: () => void;
}) {
  const kind = previewKind(file.filename);
  const type = getFileType(file.filename);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="cms-drive-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-drive-preview-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cms-drive-preview__shell"
        data-kind={kind}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="cms-drive-preview__bar">
          <div className="cms-drive-preview__identity">
            <FileType type={type} size="sm" variant="solid" aria-hidden />
            <div className="min-w-0">
              <h2
                id="cms-drive-preview-title"
                className="cms-drive-preview__title"
                title={file.filename}
              >
                {file.filename}
              </h2>
              <p className="cms-drive-preview__meta">
                {formatBytes(file.size)}
                {file.lastModified ? (
                  <>
                    <span aria-hidden> · </span>
                    {new Date(file.lastModified).toLocaleString()}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="cms-drive-preview__actions">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(file.url, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="size-3.5" />
              Open
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                const a = document.createElement("a");
                a.href = file.url;
                a.download = file.filename;
                a.rel = "noopener";
                a.click();
              }}
            >
              <Download className="size-3.5" />
              Download
            </Button>
            <button
              type="button"
              className="cms-drive-preview__close"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="cms-drive-preview__stage">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.filename}
              className="cms-drive-preview__media"
            />
          ) : null}

          {kind === "video" ? (
            <video
              src={file.url}
              className="cms-drive-preview__media"
              controls
              autoPlay
              playsInline
            />
          ) : null}

          {kind === "audio" ? (
            <div className="cms-drive-preview__audio">
              <FileType type={type} size="xl" variant="solid" />
              <audio src={file.url} controls autoPlay className="w-full" />
            </div>
          ) : null}

          {kind === "pdf" ? (
            <iframe
              title={file.filename}
              src={file.url}
              className="cms-drive-preview__frame"
            />
          ) : null}

          {kind === "office" ? (
            <iframe
              title={file.filename}
              src={officeEmbedUrl(file.url)}
              className="cms-drive-preview__frame"
              allowFullScreen
            />
          ) : null}

          {kind === "text" ? (
            <TextPreview url={file.url} filename={file.filename} />
          ) : null}

          {kind === "other" ? (
            <div className="cms-drive-preview__fallback">
              <FileType type={type} size="xl" variant="solid" />
              <p>No inline preview for this file type.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    window.open(file.url, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = file.url;
                    a.download = file.filename;
                    a.rel = "noopener";
                    a.click();
                  }}
                >
                  <Download className="size-3.5" />
                  Download
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
