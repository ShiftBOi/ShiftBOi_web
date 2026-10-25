"use client";

import { cn } from "cn";

export type FolderIconVariant = "flat" | "layered" | "open";
export type FolderIconTone = "solid" | "outline";

const DEFAULT_COLOR = "#F5C518";

/**
 * Drive-style folder SVG. Color is fully customizable via `color`.
 * Variants match the flat / layered / open folder set.
 */
export function FolderIcon({
  color = DEFAULT_COLOR,
  variant = "layered",
  tone = "solid",
  size = 68,
  className,
  title = "Folder",
}: {
  color?: string;
  variant?: FolderIconVariant;
  tone?: FolderIconTone;
  size?: number | string;
  className?: string;
  title?: string;
}) {
  const outline = tone === "outline";
  const fill = outline ? "none" : color;
  const stroke = outline ? color : "none";
  const strokeWidth = outline ? 2.25 : 0;
  // Slightly darker face for depth on solid layered/open
  const face = outline
    ? "none"
    : `color-mix(in oklab, ${color} 82%, black)`;
  const paper = outline ? "none" : "#ffffff";
  const paperStroke = outline ? color : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("cms-folder-icon", className)}
      role="img"
      aria-label={title}
      style={{ color }}
    >
      {variant === "flat" ? (
        <>
          {/* Back + tab */}
          <path
            d="M8 18.5c0-2.5 2-4.5 4.5-4.5H24c1.1 0 2.1.5 2.8 1.3l2.4 2.7c.7.8 1.7 1.3 2.8 1.3H51.5c2.5 0 4.5 2 4.5 4.5V47.5c0 2.5-2 4.5-4.5 4.5h-39C8 52 6 50 6 47.5V18.5Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Front flap — stepped pocket */}
          <path
            d="M6 30.5h28.2c1.2 0 2.3.6 3 1.5l2.1 2.8c.7.9 1.8 1.5 3 1.5H58v12.7c0 2.5-2 4.5-4.5 4.5h-39C8 52 6 50 6 47.5V30.5Z"
            fill={face}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "layered" ? (
        <>
          {/* Back panel + tab */}
          <path
            d="M7 17c0-2.2 1.8-4 4-4h12.2c1 0 1.9.4 2.6 1.1l2.2 2.3c.7.7 1.6 1.1 2.6 1.1H53c2.2 0 4 1.8 4 4V46c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4V17Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Gap / interior hint */}
          {!outline ? (
            <path
              d="M10 28h44v3.5H10V28Z"
              fill="color-mix(in oklab, white 55%, transparent)"
            />
          ) : null}
          {/* Front panel — lower, layered */}
          <path
            d="M7 29.5c0-1.4 1.1-2.5 2.5-2.5H54.5c1.4 0 2.5 1.1 2.5 2.5V46c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4V29.5Z"
            fill={face}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "open" ? (
        <>
          {/* Back + tab */}
          <path
            d="M7 16c0-2.2 1.8-4 4-4h12.4c1 0 1.9.4 2.6 1.1l2.1 2.2c.7.7 1.6 1.1 2.6 1.1H53c2.2 0 4 1.8 4 4v26c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4V16Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Paper inside */}
          <path
            d="M16 24h32v18H16V24Z"
            fill={paper}
            stroke={paperStroke}
            strokeWidth={outline ? 1.75 : 0}
            strokeLinejoin="round"
            opacity={outline ? 1 : 0.95}
          />
          {/* Open front flap — perspective tilt */}
          <path
            d="M5 34c0-1.2.9-2.2 2.1-2.4l48-6.2c1.6-.2 3 1 3 2.6V46c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4V34Z"
            fill={face}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </svg>
  );
}

/** Preset folder colors for the Drive UI */
export const FOLDER_COLORS = [
  { id: "amber", label: "Amber", value: "#F5C518" },
  { id: "sky", label: "Sky", value: "#38BDF8" },
  { id: "violet", label: "Violet", value: "#A78BFA" },
  { id: "rose", label: "Rose", value: "#FB7185" },
  { id: "emerald", label: "Emerald", value: "#34D399" },
  { id: "slate", label: "Slate", value: "#94A3B8" },
] as const;

export type FolderColorId = (typeof FOLDER_COLORS)[number]["id"];

export function folderColorValue(id: string | undefined) {
  return (
    FOLDER_COLORS.find((c) => c.id === id)?.value ?? DEFAULT_COLOR
  );
}
