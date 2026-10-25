"use client";

import { MediaFileTypeBadge } from "@/components/management/media-file-type-badge";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import {
  ChevronRight,
  Folder,
  FolderPlus,
  HardDrive,
  Home,
  ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type R2Folder = { key: string; name: string };
type R2Object = {
  key: string;
  url: string;
  filename: string;
  folder: string;
  size: number;
  lastModified: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function R2Finder({
  open,
  onClose,
  onSelect,
  folder = "gallery",
  title = "Choose from R2",
  accept = "image/*,video/*,.svg,image/svg+xml",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
  /** Modal title — matches storage CMS tone */
  title?: string;
  accept?: string;
}) {
  const [prefix, setPrefix] = useState(folder ? `${folder}/` : "");
  const [folders, setFolders] = useState<R2Folder[]>([]);
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mkdirName, setMkdirName] = useState("");
  const [showMkdir, setShowMkdir] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const crumbs = prefix
    ? prefix
        .replace(/\/$/, "")
        .split("/")
        .filter(Boolean)
        .map((part, i, arr) => ({
          name: part,
          prefix: `${arr.slice(0, i + 1).join("/")}/`,
        }))
    : [];

  const load = useCallback(async (nextPrefix: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        mode: "browse",
        prefix: nextPrefix,
      });
      const { ok, data } = await fetchJson<{
        success?: boolean;
        data?: { folders?: R2Folder[]; objects?: R2Object[] };
        error?: string;
      }>(`/api/cms/storage?${qs}`);
      if (!ok || !data.data) {
        setError("Could not browse R2");
        setFolders([]);
        setObjects([]);
        return;
      }
      setFolders(data.data.folders || []);
      setObjects(
        (data.data.objects || []).filter((o) =>
          /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|mov|m4v)$/i.test(o.filename)
        )
      );
      setPrefix(nextPrefix);
    } catch {
      setError("Could not browse R2");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = folder ? `${folder.replace(/\/$/, "")}/` : "";
    void load(start);
  }, [open, folder, load]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function uploadFiles(files: FileList | File[] | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploadFolder = prefix.replace(/\/$/, "") || folder || "gallery";
      let lastUrl = "";
      for (const file of Array.from(files)) {
        const image = await fileToBase64(file);
        const { ok, data } = await fetchJson<{
          success?: boolean;
          data?: { url?: string };
        }>("/api/cms/storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload",
            image,
            folder: uploadFolder,
          }),
        });
        const url = data.data?.url;
        if (ok && url) lastUrl = url;
      }
      await load(prefix);
      if (lastUrl) onSelect(lastUrl);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function createFolder() {
    const name = mkdirName.trim().replace(/\/+/g, "");
    if (!name) return;
    const path = `${prefix}${name}`;
    const { ok } = await fetchJson("/api/cms/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mkdir", path }),
    });
    if (ok) {
      setMkdirName("");
      setShowMkdir(false);
      await load(prefix);
    } else {
      setError("Could not create folder");
    }
  }

  if (!open) return null;

  return (
    <div className="cms-finder-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="cms-finder-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="cms-finder">
        <header className="cms-finder__head">
          <div className="cms-finder__title">
            <HardDrive className="size-4" />
            <span>{title}</span>
          </div>
          <div className="cms-finder__actions">
            <button
              type="button"
              className="cms-finder__icon"
              title="Refresh"
              onClick={() => load(prefix)}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              className="cms-finder__icon"
              title="New folder"
              onClick={() => setShowMkdir((v) => !v)}
            >
              <FolderPlus className="size-3.5" />
            </button>
            <button
              type="button"
              className="cms-finder__btn"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              From device
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={(e) => {
                void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="cms-finder__icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <nav className="cms-finder__crumbs" aria-label="Path">
          <button
            type="button"
            className="cms-finder__crumb"
            onClick={() => load("")}
          >
            <Home className="size-3.5" />
            Root
          </button>
          {crumbs.map((c) => (
            <span key={c.prefix} className="cms-finder__crumb-row">
              <ChevronRight className="size-3 opacity-40" />
              <button
                type="button"
                className="cms-finder__crumb"
                onClick={() => load(c.prefix)}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>

        {showMkdir ? (
          <div className="cms-finder__mkdir">
            <input
              value={mkdirName}
              onChange={(e) => setMkdirName(e.target.value)}
              placeholder="Folder name"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createFolder();
              }}
            />
            <button type="button" onClick={() => void createFolder()}>
              Create
            </button>
          </div>
        ) : null}

        {error ? <p className="cms-finder__error">{error}</p> : null}

        <div
          className="cms-finder__body"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            void uploadFiles(e.dataTransfer.files);
          }}
        >
          {loading && !folders.length && !objects.length ? (
            <div className="cms-finder__empty">
              <Loader2 className="size-6 animate-spin opacity-50" />
            </div>
          ) : (
            <div className="cms-finder__grid">
              {folders.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="cms-finder__folder"
                  onClick={() => load(f.key)}
                >
                  <Folder className="cms-finder__folder-icon size-7" />
                  <span className="cms-finder__name">{f.name}</span>
                </button>
              ))}
              {objects.map((obj) => {
                const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(obj.filename);
                return (
                  <button
                    key={obj.key}
                    type="button"
                    className="cms-finder__file"
                    onClick={() => {
                      onSelect(obj.url);
                      onClose();
                    }}
                    title={obj.filename}
                  >
                    <span className="cms-finder__thumb">
                      {isVideo ? (
                        <video
                          src={obj.url}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={obj.url} alt="" loading="lazy" />
                      )}
                      <MediaFileTypeBadge
                        src={obj.filename}
                        size="sm"
                        className="cms-media-type-badge--tight"
                      />
                    </span>
                    <span className="cms-finder__meta">
                      <span className="cms-finder__name">{obj.filename}</span>
                      <span className="cms-finder__size">
                        {formatBytes(obj.size)}
                      </span>
                    </span>
                  </button>
                );
              })}
              {!folders.length && !objects.length ? (
                <div className="cms-finder__empty cms-finder__empty--span">
                  <ImageIcon className="size-8 opacity-40" />
                  <p>Empty folder — drop images or upload</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
