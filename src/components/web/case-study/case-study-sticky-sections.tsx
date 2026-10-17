"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CaseStudySection } from "@/lib/case-study";
import { CaseStudySectionBlock } from "./case-study-section";

/**
 * Ensures left titles stay pinned for the height of each section's right column.
 * Native sticky can fail under Lenis; ScrollTrigger pin is the reliable fallback.
 */
export function CaseStudyStickySections({
  sections,
}: {
  sections: CaseStudySection[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (window.matchMedia("(max-width: 899px)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return;

    const triggers: ScrollTrigger[] = [];
    const blocks = root.querySelectorAll<HTMLElement>(".cs-section");

    blocks.forEach((section) => {
      const sticky = section.querySelector<HTMLElement>(".cs-section-head-sticky");
      const main = section.querySelector<HTMLElement>(".cs-section-main");
      if (!sticky || !main) return;
      // Only pin when the right column is meaningfully taller than the title
      if (main.offsetHeight < sticky.offsetHeight + 120) return;

      triggers.push(
        ScrollTrigger.create({
          trigger: section,
          start: "top top+=80",
          end: () => `+=${Math.max(0, main.offsetHeight - sticky.offsetHeight)}`,
          pin: sticky,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        }),
      );
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [sections]);

  return (
    <div ref={rootRef} className="cs-sticky-sections">
      {sections.map((section) => (
        <CaseStudySectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}
