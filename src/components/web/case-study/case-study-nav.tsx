import Link from "next/link";

export function CaseStudyNav({
  prev,
  next,
}: {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className="cs-nav cs-shell" aria-label="Adjacent projects">
      {prev ? (
        <Link href={`/projects/${prev.slug}`} className="cs-nav-link is-prev">
          <span>← Previous</span>
          <strong>{prev.title}</strong>
        </Link>
      ) : (
        <Link href="/#work" className="cs-nav-link is-prev">
          <span>← All projects</span>
        </Link>
      )}
      {next ? (
        <Link href={`/projects/${next.slug}`} className="cs-nav-link is-next">
          <span>Next project</span>
          <strong>{next.title} →</strong>
        </Link>
      ) : (
        <span className="cs-nav-link is-next is-empty" />
      )}
    </nav>
  );
}
