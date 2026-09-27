"use client";

import Image from "next/image";
import Link from "next/link";

export type CmsProjectCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  year: string | null;
  coverImage: string | null;
  introSrc: string | null;
  visibility: "PUBLIC" | "CONFIDENTIAL";
  featured: boolean;
  published: boolean;
};

export function CmsProjectCard({ project }: { project: CmsProjectCardData }) {
  const image = project.coverImage || project.introSrc;

  return (
    <li className="cms-plist-item">
      <Link href={`/cms/projects/${project.id}`} className="cms-plist-row">
        <span className="cms-plist-thumb" aria-hidden>
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="cms-plist-thumb-img"
              sizes="(max-width: 900px) 160px, 220px"
              quality={92}
              unoptimized={image.startsWith("http")}
            />
          ) : null}
        </span>

        <span className="cms-plist-copy">
          <span className="cms-plist-title-row">
            <span className="cms-plist-title">{project.title}</span>
            <span className="cms-plist-flags">
              <span className={`cms-dash-flag is-${project.published ? "live" : "draft"}`}>
                {project.published ? "Live" : "Draft"}
              </span>
              {project.featured ? <span className="cms-dash-flag">Featured</span> : null}
              {project.visibility === "CONFIDENTIAL" ? (
                <span className="cms-dash-flag is-soft">Secret</span>
              ) : (
                <span className="cms-dash-flag is-soft">Selected</span>
              )}
            </span>
          </span>
          <span className="cms-plist-summary">{project.summary}</span>
          <span className="cms-plist-meta">
            {project.year ?? "—"} · /{project.slug}
          </span>
        </span>

        <span className="cms-plist-chevron" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </li>
  );
}
