import type { CaseStudyStat } from "@/lib/case-study";
import { resolveTechBadges } from "@/lib/tech-stack-catalog";

export function CaseStudyStats({
  stats,
  techStack = [],
}: {
  stats: CaseStudyStat[];
  techStack?: string[];
}) {
  const badges = resolveTechBadges(techStack).slice(0, 12);
  if (stats.length === 0 && badges.length === 0) return null;

  return (
    <section className="cs-stats cs-shell" aria-label="Project stats">
      <div className={`cs-stats-card${badges.length ? " has-tech" : ""}`}>
        {stats.length > 0 ? (
          <div className="cs-stats-items">
            {stats.map((stat) => (
              <div key={`${stat.metric}-${stat.label}`} className="cs-stats-item">
                <p className="cs-stats-metric">{stat.metric}</p>
                <p className="cs-stats-label">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
        {badges.length > 0 ? (
          <div className="cs-stats-tech" aria-label="Tech stack">
            {badges.map((badge) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={badge.id}
                className="cs-stats-tech-badge"
                src={badge.src}
                alt={badge.label}
                title={badge.label}
                height={22}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
