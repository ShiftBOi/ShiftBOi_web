"use client";

import {
  FileType,
  getFileType,
  type FileTypeVariant,
} from "@/components/reui/file-type";
import { cn } from "cn";

type FileTypeSize = "mini" | "xs" | "sm" | "default" | "lg" | "xl";

/** Resolve a URL, filename, or MIME type to a FileType key. */
export function resolveMediaFileType(
  src?: string | null,
  mimeOrName?: string | null
) {
  const hint = (mimeOrName || src || "").trim();
  if (!hint) return "image" as const;
  return getFileType(hint);
}

/**
 * Bottom-right FileType badge for image/video upload previews.
 * Parent must be `position: relative` (or use the wrapper class).
 */
export function MediaFileTypeBadge({
  src,
  mimeOrName,
  size = "sm",
  variant = "solid",
  className,
}: {
  src?: string | null;
  /** MIME type or filename when URL has no useful extension */
  mimeOrName?: string | null;
  size?: FileTypeSize;
  variant?: FileTypeVariant;
  className?: string;
}) {
  const type = resolveMediaFileType(src, mimeOrName);
  return (
    <span
      className={cn("cms-media-type-badge", className)}
      aria-hidden="true"
    >
      <FileType type={type} size={size} variant={variant} />
    </span>
  );
}
