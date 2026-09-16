"use client";

/** HydraDB L-bracket corners — paths from hydradb.com index.html SVG templates */
export function HydraCornerTL() {
  return (
    <svg width="26" height="26" viewBox="-1 -1 26 26" fill="none" className="hydra-corner-svg" aria-hidden>
      <path d="M24 0H0V24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function HydraCornerBL() {
  return (
    <svg width="26" height="26" viewBox="-1 -1 26 26" fill="none" className="hydra-corner-svg" aria-hidden>
      <path d="M24 24H0V0" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function HydraCornerTR() {
  return (
    <svg width="26" height="26" viewBox="-1 -1 26 26" fill="none" className="hydra-corner-svg" aria-hidden>
      <path d="M0 0H24V24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function HydraCornerBR() {
  return (
    <svg width="26" height="26" viewBox="-1 -1 26 26" fill="none" className="hydra-corner-svg" aria-hidden>
      <path d="M0 24H24V0" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function HydraAccentSquare() {
  return <span className="hydra-accent-square" aria-hidden />;
}

/** Single 10px bar with accent top+bottom — HydraDB double-line divider (framer-1dov5xc) */
export function HydraTripleRule() {
  return (
    <div className="hydra-triple-rule" aria-hidden>
      <div className="hydra-triple-rule-bar" />
    </div>
  );
}

/** Three purple rules — thin / thick / thin (HydraDB footer separator) */
export function HydraFooterRule() {
  return (
    <div className="hydra-footer-rule" aria-hidden>
      <span className="hydra-footer-rule-thin" />
      <span className="hydra-footer-rule-thick" />
      <span className="hydra-footer-rule-thin" />
    </div>
  );
}

/** ShiftBOi 2×2 mark — matches navbar brand glyph */
export function ShiftBoiMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`shiftboi-mark ${className}`.trim()}>
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * Horizontal separator at the same 10px weight/position as HydraTripleRule,
 * but the “line” is a row of ShiftBOi icons instead of plain borders.
 */
export function HydraIconRule({ count = 64 }: { count?: number }) {
  return (
    <div className="hydra-icon-rule" aria-hidden>
      <div className="hydra-icon-rule-track">
        {Array.from({ length: count }, (_, i) => (
          <ShiftBoiMark key={i} className="hydra-icon-rule-mark" />
        ))}
      </div>
    </div>
  );
}

/** 18×18 accent squares — pinned to white-band corners (hydradb.com framer-11y4e6a) */
export function HydraBandCornerSquares() {
  return (
    <>
      <span className="hydra-band-corner hydra-band-corner-tl" aria-hidden />
      <span className="hydra-band-corner hydra-band-corner-tr" aria-hidden />
      <span className="hydra-band-corner hydra-band-corner-bl" aria-hidden />
      <span className="hydra-band-corner hydra-band-corner-br" aria-hidden />
    </>
  );
}

export function HydraPointerIcon() {
  return (
    <span className="hydra-pointer-icon" aria-hidden>
      →
    </span>
  );
}

export function HydraStatCorners({ side = "bottom" }: { side?: "left" | "right" | "bottom" }) {
  if (side === "left") {
    return (
      <>
        <div className="hydra-corner hydra-corner-tl">
          <HydraCornerTL />
        </div>
        <div className="hydra-corner hydra-corner-bl">
          <HydraCornerBL />
        </div>
      </>
    );
  }

  if (side === "right") {
    return (
      <>
        <div className="hydra-corner hydra-corner-tr">
          <HydraCornerTR />
        </div>
        <div className="hydra-corner hydra-corner-br">
          <HydraCornerBR />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hydra-corner hydra-corner-bl">
        <HydraCornerBL />
      </div>
      <div className="hydra-corner hydra-corner-br">
        <HydraCornerBR />
      </div>
    </>
  );
}

export function HydraFrameCorners() {
  return (
    <>
      <div className="hydra-corner hydra-corner-tl">
        <HydraCornerTL />
      </div>
      <div className="hydra-corner hydra-corner-tr">
        <HydraCornerTR />
      </div>
      <div className="hydra-corner hydra-corner-bl">
        <HydraCornerBL />
      </div>
      <div className="hydra-corner hydra-corner-br">
        <HydraCornerBR />
      </div>
    </>
  );
}
