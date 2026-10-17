import Image from "next/image";
import Link from "next/link";
import type { CaseStudyMedia } from "@/lib/case-study";

export function CaseStudyHero({
  title,
  tags,
  hero,
}: {
  title: string;
  tags: string[];
  hero: CaseStudyMedia | null;
}) {
  return (
    <section className="cs-hero" aria-label={`${title} hero`}>
      <div className="cs-hero-media">
        {hero?.type === "video" ? (
          <video
            className="cs-hero-asset"
            src={hero.src}
            poster={hero.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label={`${title} visual`}
          />
        ) : hero?.src ? (
          <Image
            src={hero.src}
            alt={`${title} visual`}
            fill
            priority
            className="cs-hero-asset"
            style={
              hero.objectPosition
                ? { objectPosition: hero.objectPosition }
                : undefined
            }
            sizes="100vw"
          />
        ) : (
          <div className="cs-hero-fallback" aria-hidden />
        )}
        <div className="cs-hero-fade" aria-hidden />
      </div>

      <div className="cs-hero-overlay">
        <Link href="/#work" className="cs-hero-back">
          ← All work
        </Link>
        <div className="cs-hero-copy">
          <h1 className="cs-hero-title">{title}</h1>
          {tags.length > 0 ? (
            <p className="cs-hero-tags">{tags.join(" · ")}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
