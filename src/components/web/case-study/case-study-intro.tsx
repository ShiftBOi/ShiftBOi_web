import type { CaseStudyLink } from "@/lib/case-study";

export function CaseStudyIntro({
  thesis,
  links,
  role,
  timeline,
  scope,
}: {
  thesis: string;
  links: CaseStudyLink[];
  role: string;
  timeline: string;
  scope: string;
}) {
  const meta = [
    role ? { label: "Role", value: role } : null,
    timeline ? { label: "Timeline", value: timeline } : null,
    scope ? { label: "Scope", value: scope } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (!thesis && links.length === 0 && meta.length === 0) return null;

  return (
    <section className="cs-intro cs-shell" aria-label="Project introduction">
      <div className="cs-intro-main">
        {thesis ? <h2 className="cs-intro-thesis">{thesis}</h2> : null}
        {links.length > 0 ? (
          <ul className="cs-intro-links">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-intro-link"
                >
                  <span>{link.label}</span>
                  <span aria-hidden>↗︎</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {meta.length > 0 ? (
        <dl className="cs-intro-meta">
          {meta.map((item) => (
            <div key={item.label} className="cs-intro-meta-item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
