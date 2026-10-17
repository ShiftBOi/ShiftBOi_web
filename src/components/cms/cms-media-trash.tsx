"use client";

/** Top-right trash control for CMS media frames (hero, boxes, collage, etc.). */
export function CmsMediaTrashButton({
  onClick,
  label = "Remove image",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="cms-cs-media-trash"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
