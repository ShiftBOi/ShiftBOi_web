"use client";

import type { PortfolioProject } from "@/lib/portfolio-projects";
import {
  detailToServiceItem,
  resolveDetails,
  type DetailBlock,
} from "@/lib/project-draft";

export function ProjectServices({ project }: { project: PortfolioProject }) {
  const details: DetailBlock[] =
    project.details ??
    resolveDetails({
      highlights: project.highlights,
      sections: project.sections,
    });
  const items = details.map(detailToServiceItem);

  return (
    <section className="project-services" aria-label="Project details">
      <div className="project-page-shell">
        <div className="project-services-rule" aria-hidden />

        <div className="project-services-head">
          <div className="project-services-label">
            <span aria-hidden>◆</span>
            <span>Details</span>
          </div>
          <h2 className="project-services-headline">
            {project.heroTitle}. {project.heroBody}
          </h2>
        </div>

        <div className="project-services-rule-partial" aria-hidden>
          <span />
          <i />
        </div>

        <div className="project-services-list">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={`project-services-item${index > 0 ? " has-rule" : ""}`}
            >
              <div className="project-services-item-rail" aria-hidden />
              <div className="project-services-item-main">
                <div className="project-services-item-grid">
                  <h3>{item.title}</h3>
                  <div>
                    {item.paragraphs.map((para, i) => (
                      <p key={`${item.title}-${i}`}>{para}</p>
                    ))}
                    {item.bullets.length > 0 ? (
                      <ul>
                        {item.bullets.map((b) => (
                          <li key={b}>
                            <span aria-hidden>◇</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {project.stack.length > 0 ? (
          <div className="project-services-stack">
            <div className="project-services-label">
              <span aria-hidden>◆</span>
              <span>Stack</span>
            </div>
            <ul>
              {project.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {project.download ? (
          <div className="project-services-cta">
            <a href={project.download.href} className="project-download" rel="noopener">
              {project.download.label}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
