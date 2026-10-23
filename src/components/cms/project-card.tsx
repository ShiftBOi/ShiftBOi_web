"use client";

import Link from "next/link";
import { Folder, folderColorForProject } from "@/components/cms/folder";

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
  const color = folderColorForProject(project);

  return (
    <li className="cms-folder-card">
      <Link
        href={`/cms/projects/${project.id}`}
        className="cms-folder-card__link"
        aria-label={`Edit ${project.title}`}
      >
        <div className="cms-folder-card__stage">
          <Folder color={color} coverImage={image} size={1.05} />
        </div>

        <div className="cms-folder-card__body">
          <div className="cms-folder-card__title-row">
            <span className="cms-folder-card__title">{project.title}</span>
            <span className="cms-folder-card__flags">
              <span
                className={`cms-dash-flag is-${project.published ? "live" : "draft"}`}
              >
                {project.published ? "Live" : "Draft"}
              </span>
              {project.featured ? (
                <span className="cms-dash-flag">Featured</span>
              ) : null}
              {project.visibility === "CONFIDENTIAL" ? (
                <span className="cms-dash-flag is-soft">Secret</span>
              ) : null}
            </span>
          </div>
          {project.summary ? (
            <p className="cms-folder-card__summary">{project.summary}</p>
          ) : null}
          <p className="cms-folder-card__meta">
            {project.year ?? "—"} · /{project.slug}
          </p>
        </div>
      </Link>
    </li>
  );
}
