import { cn } from "cn";

/**
 * Card background is full-bleed (breaks out of content max-w).
 * Inner text/layout uses the shared shell max-w.
 * Flat surfaces — no CRT / TV grid texture.
 */
export function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hq-section-card relative isolate mx-3 overflow-hidden rounded-2xl md:mx-4",
        className
      )}
    >
      <div className="hq-card-inner relative z-10">{children}</div>
    </div>
  );
}
