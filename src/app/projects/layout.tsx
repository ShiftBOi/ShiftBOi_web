import { SiteHeader } from "@/components/web/hero";
import { SiteFooter } from "@/components/web/site-footer";
import { SiteShell } from "@/components/web/site-shell";
import { SmoothScroll } from "@/components/web/smooth-scroll";

/**
 * Shared chrome for all project detail pages so client navigations
 * (e.g. “More projects”) keep Lenis / shell mounted instead of remounting.
 */
export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <SiteShell>
        <SiteHeader />
        {children}
        <SiteFooter />
      </SiteShell>
    </SmoothScroll>
  );
}
