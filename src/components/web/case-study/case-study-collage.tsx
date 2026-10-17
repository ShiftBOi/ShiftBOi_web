import Image from "next/image";
import type { CaseStudyMedia } from "@/lib/case-study";
import { CaseStudyVideo } from "./case-study-video";

export function CaseStudyCollage({
  images,
  caption,
}: {
  images: CaseStudyMedia[];
  caption?: string;
}) {
  if (images.length === 0) return null;

  const frames = images.slice(0, 3);
  const single = frames.length === 1;

  return (
    <section className="cs-collage cs-shell" aria-label="Product visuals">
      <div className={`cs-collage-stage${single ? " is-single" : ""}`}>
        {frames.map((frame, index) => (
          <div
            key={`${frame.src}-${index}`}
            className={`cs-collage-frame cs-collage-frame-${index + 1}`}
          >
            {frame.type === "video" ? (
              <CaseStudyVideo src={frame.src} poster={frame.poster} />
            ) : (
              <Image
                src={frame.src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:900px) 90vw, 60vw"
                loading="lazy"
              />
            )}
          </div>
        ))}
        <div className="cs-collage-fade" aria-hidden />
      </div>
      {caption ? <p className="cs-collage-caption">{caption}</p> : null}
    </section>
  );
}
