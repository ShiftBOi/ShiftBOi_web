import Image from "next/image";
import type { CaseStudyBand, CaseStudyLink } from "@/lib/case-study";
import { CaseStudyVideo } from "./case-study-video";

export function CaseStudyBandCards({
  bands,
  cta,
}: {
  bands: CaseStudyBand[];
  cta?: CaseStudyLink | null;
}) {
  if (bands.length === 0) return null;
  return (
    <section className="cs-bands cs-shell" aria-label="Project showcases">
      {bands.map((band) => (
        <article key={band.id} className="cs-band-card">
          {band.media?.src ? (
            <div className="cs-band-media">
              {band.media.type === "video" ? (
                <CaseStudyVideo
                  src={band.media.src}
                  poster={band.media.poster}
                  aria-label={band.title}
                />
              ) : (
                <Image
                  src={band.media.src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:900px) 100vw, 70vw"
                  loading="lazy"
                />
              )}
            </div>
          ) : null}
          <div className="cs-band-copy">
            {band.title ? <h3 className="cs-band-title">{band.title}</h3> : null}
            {band.body ? <p className="cs-band-body">{band.body}</p> : null}
            {cta ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-ghost-btn"
              >
                {cta.label} ↗︎
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
