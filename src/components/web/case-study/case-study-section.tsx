import Image from "next/image";
import type { ReactNode } from "react";
import type { CaseStudyMedia, CaseStudySection } from "@/lib/case-study";
import { sanitizeRichHtml } from "@/lib/rich-text";
import { CaseStudyPointCards } from "./case-study-point-cards";
import { CaseStudyVideo } from "./case-study-video";

function SectionMedia({ media, title }: { media: CaseStudyMedia; title: string }) {
  return (
    <div className="cs-section-media">
      {media.type === "video" ? (
        <CaseStudyVideo
          src={media.src}
          poster={media.poster}
          aria-label={title}
        />
      ) : (
        <Image
          src={media.src}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width:900px) 100vw, 60vw"
          loading="lazy"
        />
      )}
    </div>
  );
}

export function CaseStudySectionBlock({
  section,
  children,
}: {
  section: CaseStudySection;
  children?: ReactNode;
}) {
  return (
    <section className="cs-section cs-shell">
      <div className="cs-section-grid">
        <header className="cs-section-head">
          <div className="cs-section-head-sticky">
            <p className="cs-section-label">{section.label}</p>
            <h2 className="cs-section-title">{section.title}</h2>
          </div>
        </header>

        <div className="cs-section-main">
          <div className="cs-section-body">
            {section.paragraphs.map((p, i) => {
              const html = sanitizeRichHtml(p);
              const looksHtml = /<[a-z][\s\S]*>/i.test(html);
              if (looksHtml) {
                return (
                  <div
                    key={`${section.id}-${i}`}
                    className="cs-rich-body"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              }
              return <p key={`${section.id}-${i}`}>{p}</p>;
            })}
          </div>

          {section.bullets.length > 0 ? (
            <CaseStudyPointCards points={section.bullets} />
          ) : null}

          {section.media?.src ? (
            <>
              <SectionMedia media={section.media} title={section.title} />
              <p className="cs-section-media-caption">
                {section.title}
              </p>
            </>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}
