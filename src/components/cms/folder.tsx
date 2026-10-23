"use client";

type FolderProps = {
  color?: string;
  size?: number;
  coverImage?: string | null;
  className?: string;
  /** Larger open state on hover (public services) */
  openOnHover?: boolean;
};

/**
 * Interactive 3D folder — adapted from ttianqii-web-original.
 * Styles live in globals.css (`.folder`) so CMS + public site share them.
 */
export function Folder({
  color = "#7c3aed",
  size = 1,
  coverImage,
  className = "",
  openOnHover = true,
}: FolderProps) {
  const papers = [0, 1, 2];

  return (
    <div
      className={`folder${openOnHover ? " folder--peek" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          transform: `scale(${size})`,
          "--folder-color": color,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <div className="folder__body">
        <span className="folder__tab" />

        {papers.map((i) => (
          <div key={i} className={`folder__paper folder__paper--${i}`}>
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="" className="folder__cover" />
            ) : (
              <span className="folder__empty">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 8.5h6.2L12 6h8v12.5H4V8.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </div>
        ))}

        <div className="folder__flap folder__flap--left" />
        <div className="folder__flap folder__flap--right" />
      </div>
    </div>
  );
}

export function folderColorForProject(project: {
  published: boolean;
  featured: boolean;
  visibility?: "PUBLIC" | "CONFIDENTIAL";
}) {
  if (project.visibility === "CONFIDENTIAL") return "#a855f7";
  if (project.featured && project.published) return "#8b5cf6";
  if (project.published) return "#7c3aed";
  return "#94a3b8";
}
