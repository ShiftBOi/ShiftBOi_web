"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <article className="cms-pcard">
      <Link href={`/cms/projects/${project.id}`} className="cms-pcard-hit">
        <div className="cms-pcard-media">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width:900px) 100vw, 320px"
              unoptimized={image.startsWith("http")}
            />
          ) : (
            <div className="cms-pcard-fallback" aria-hidden />
          )}
        </div>
        <div className="cms-pcard-body">
          <div className="cms-pcard-badges">
            {project.published ? (
              <span className="cms-badge is-on">Published</span>
            ) : (
              <span className="cms-badge">Draft</span>
            )}
            {project.featured ? <span className="cms-badge is-accent">Featured</span> : null}
            <span className="cms-badge">
              {project.visibility === "PUBLIC" ? "Selected" : "Limited"}
            </span>
          </div>
          <h3 className="cms-pcard-title">{project.title}</h3>
          <p className="cms-pcard-summary">{project.summary}</p>
          <p className="cms-pcard-meta">
            {project.year ?? "—"} · /{project.slug}
          </p>
        </div>
        <span className="cms-pcard-open" aria-hidden>
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
    </article>
  );
}
