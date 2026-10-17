import type { ReactNode } from "react";
import type { CaseStudyView } from "@/lib/case-study";
import { CaseStudyHero } from "./case-study-hero";
import { CaseStudyIntro } from "./case-study-intro";
import { CaseStudyStats } from "./case-study-stats";
import { CaseStudyStickySections } from "./case-study-sticky-sections";
import { CaseStudyBandCards } from "./case-study-band-card";
import { CaseStudyCollage } from "./case-study-collage";

export function CaseStudyPage({
  study,
  moreSlot,
}: {
  study: CaseStudyView;
  /** @deprecated adjacent-project nav removed */
  prev?: { slug: string; title: string } | null;
  /** @deprecated adjacent-project nav removed */
  next?: { slug: string; title: string } | null;
  moreSlot?: ReactNode;
}) {
  const showcaseCta = study.links[0] ?? study.download;
  const usedMedia = new Set(
    study.sections.map((s) => s.media?.src).filter(Boolean),
  );
  const leftoverBands = study.bands.filter(
    (b) => b.media?.src && !usedMedia.has(b.media.src),
  );

  return (
    <article className="cs-page">
      <CaseStudyHero title={study.title} tags={study.tags} hero={study.hero} />
      <CaseStudyIntro
        thesis={study.thesis}
        links={study.links}
        role={study.role}
        timeline={study.timeline}
        scope={study.scope}
      />
      <CaseStudyStats stats={study.stats} techStack={study.stack} />

      <CaseStudyStickySections sections={study.sections} />

      {leftoverBands.length > 0 ? (
        <CaseStudyBandCards bands={leftoverBands} cta={showcaseCta} />
      ) : null}

      <CaseStudyCollage
        images={study.collage}
        caption={
          study.bands[0]?.title
            ? `${study.bands[0].title} — product visuals`
            : undefined
        }
      />

      {moreSlot}
    </article>
  );
}
