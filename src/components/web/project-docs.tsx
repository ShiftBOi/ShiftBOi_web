"use client";

import { useMemo, useState } from "react";
import type { PortfolioProject } from "@/lib/portfolio-projects";

type DocPage = {
  category: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

function buildPages(project: PortfolioProject): DocPage[] {
  const highlightParagraphs = project.highlights.map(
    (h) => `${h.title} ${h.body}`,
  );

  const pages: DocPage[] = [];

  if (project.highlights.length > 0) {
    pages.push({
      category: "Highlights",
      title: "What stood out",
      paragraphs: highlightParagraphs,
    });
  }

  for (const section of project.sections) {
    pages.push({
      category: section.label,
      title: section.title,
      paragraphs: section.paragraphs,
      bullets: section.bullets,
    });
  }

  return pages;
}

function pageMatchesTag(page: DocPage, tag: string, stack: string[]) {
  const hay = `${page.title} ${page.paragraphs.join(" ")} ${page.bullets?.join(" ") ?? ""} ${stack.join(" ")}`.toLowerCase();
  return hay.includes(tag.toLowerCase());
}

export function ProjectDocs({ project }: { project: PortfolioProject }) {
  const pages = useMemo(() => buildPages(project), [project]);
  const categories = useMemo(() => pages.map((p) => p.category), [pages]);
  const tags = useMemo(() => project.stack, [project.stack]);

  const [category, setCategory] = useState(categories[0] ?? "");
  const [tag, setTag] = useState<string | null>(null);

  const page = useMemo(() => {
    const current = pages.find((p) => p.category === category) ?? pages[0];
    if (!current) return null;
    if (tag && !pageMatchesTag(current, tag, project.stack)) return null;
    return current;
  }, [pages, category, tag, project.stack]);

  return (
    <section className="project-docs" aria-label="Documentation">
      <div className="project-page-shell project-docs-layout">
        <aside className="project-docs-aside">
          <div className="project-docs-aside-block">
            <p className="project-docs-aside-label">Category</p>
            <ul className="project-docs-cats">
              {categories.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className={`project-docs-cat${category === c ? " is-active" : ""}`}
                    onClick={() => {
                      setCategory(c);
                      setTag(null);
                    }}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {tags.length > 0 ? (
            <div className="project-docs-aside-block">
              <p className="project-docs-aside-label">Tag</p>
              <div className="project-docs-tags">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`project-docs-tag${tag === t ? " is-active" : ""}`}
                    onClick={() => setTag((prev) => (prev === t ? null : t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <article className="project-docs-article">
          {!page ? (
            <p className="project-docs-empty">No content matches this filter.</p>
          ) : (
            <>
              <h2 className="project-docs-article-title">{page.title}</h2>
              <div className="project-docs-article-body">
                {page.paragraphs.map((p) => (
                  <p key={p.slice(0, 64)}>{p}</p>
                ))}
                {page.bullets?.length ? (
                  <ul className="project-docs-bullets">
                    {page.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
