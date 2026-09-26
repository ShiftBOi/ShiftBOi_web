import Image from "next/image";

export type SplitBandMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
} | null;

export type SplitBandData = {
  title: string;
  body: string;
  media?: SplitBandMedia;
};

function BandMedia({ media, title }: { media: SplitBandMedia; title: string }) {
  if (media?.type === "video") {
    return (
      <video
        src={media.src}
        poster={media.poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={`${title} demo`}
      />
    );
  }
  if (media?.type === "image") {
    return (
      <Image
        src={media.src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width:900px) 100vw, 55vw"
      />
    );
  }
  return <div className="project-media-fallback" aria-hidden />;
}

/** Canonical media+copy box used on every Selected project page. */
export function ProjectSplitBand({ band }: { band: SplitBandData }) {
  return (
    <section className="project-band project-band-hero">
      <div className="project-page-shell">
        <div className="project-split project-split-hero">
          <div className="project-media">
            <BandMedia media={band.media ?? null} title={band.title} />
          </div>
          <div className="project-hero-copy">
            <h3 className="project-block-title">{band.title}</h3>
            <p className="project-block-body">{band.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectSplitBands({ bands }: { bands: SplitBandData[] }) {
  if (bands.length === 0) return null;
  return (
    <>
      {bands.map((band, index) => (
        <ProjectSplitBand key={`${band.title}-${index}`} band={band} />
      ))}
    </>
  );
}
