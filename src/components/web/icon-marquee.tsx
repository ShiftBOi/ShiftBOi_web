"use client";

type MarqueeItem = {
  id: string;
  label: string;
  mark: React.ReactNode;
};

function CannonMark() {
  return (
    <svg
      viewBox="0 0 40 28"
      className="h-12 w-[4.25rem] text-[#c4c4c4]"
      aria-hidden
      fill="currentColor"
    >
      <rect x="2" y="12" width="22" height="7" rx="0.5" />
      <rect x="22" y="13.5" width="14" height="4" />
      <rect x="0" y="9" width="7" height="5" />
      <circle cx="10" cy="23" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="23" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DroneMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className="h-12 w-12 text-[#c4c4c4]"
      aria-hidden
    >
      <path d="M0 0h32v32H0z" fill="none" />
      <path
        fill="currentColor"
        d="M30.47 12.19H32v1.52h-1.53Zm-10.66 1.52v-1.52h-7.62v1.52H1.52v1.53h7.62v1.52h1.52v1.52h4.57v3.05h-3.04v1.53h7.62v-1.53h-3.05v-3.05h4.57v-1.52h1.52v-1.52h7.62v-1.53z"
      />
      <path
        fill="currentColor"
        d="M22.85 19.81h1.53v3.05h-1.53Zm-1.52-1.53h1.52v1.53h-1.52Zm9.14-6.09v-1.52H25.9V6.09h4.57V4.57H25.9V3.05h-1.52v1.52h-4.57v1.52h4.57v4.58h-3.05v1.52zM19.81 22.86h1.52v4.57h-1.52Z"
      />
      <path
        fill="currentColor"
        d="M19.81 9.14h1.52v1.53h-1.52Zm-7.62 18.29h7.62v1.52h-7.62Zm3.04-3.05h1.53v1.52h-1.53ZM12.19 7.62h7.62v1.52h-7.62Zm-1.53 15.24h1.53v4.57h-1.53Zm0-13.72h1.53v1.53h-1.53Zm-1.52 9.14h1.52v1.53H9.14Zm-1.52 1.53h1.52v3.05H7.62Z"
      />
      <path
        fill="currentColor"
        d="M10.66 12.19v-1.52H7.62V6.09h4.57V4.57H7.62V3.05H6.09v1.52H1.52v1.52h4.57v4.58H1.52v1.52zM0 12.19h1.52v1.52H0Z"
      />
    </svg>
  );
}

function DinoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      className="h-12 w-12 text-[#c4c4c4]"
      aria-hidden
    >
      <path d="M0 0h12v12H0z" fill="none" />
      <path
        fill="currentColor"
        d="M2 9h2V8h1V7H4V6H1V5h2V4H1V2H0v5h3v1H2Zm2 3h5V9H8v2H7v-1H6v1H4Zm1-2h1V8H5Zm1-2h1V7H6Zm3 1h1V8H9ZM4 4h1V3H4ZM1 2h5V1H1Zm6 4h1V5H7ZM6 5h1V2H6Zm4 3h1V4h-1v2H8v1h2Zm0 0"
      />
    </svg>
  );
}

const ITEMS: MarqueeItem[] = [
  { id: "cannon", label: "Cannon", mark: <CannonMark /> },
  { id: "drone", label: "Drone", mark: <DroneMark /> },
  { id: "dino", label: "Dino", mark: <DinoMark /> },
];

function MarqueeRow({ keyPrefix }: { keyPrefix: string }) {
  const cells = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <ul className="flex h-[120px] shrink-0 items-stretch" aria-hidden={keyPrefix !== "a"}>
      {cells.map((item, index) => (
        <li
          key={`${keyPrefix}-${item.id}-${index}`}
          className="flex w-[240px] shrink-0 flex-col items-center justify-center gap-3 border-r border-[#2a2a2a] px-6"
        >
          {item.mark}
          <span className="text-[15px] font-medium tracking-[-0.01em] text-[#c4c4c4]">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function IconVelocityMarquee() {
  return (
    <section aria-label="Featured icons" className="relative bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-[6px]">
        <div className="h-px w-full bg-[var(--color-violet)]" />
        <div className="h-px w-full bg-[var(--color-violet)]" />
      </div>

      <div className="overflow-hidden pt-[14px]">
        <div className="icon-marquee-track flex w-max">
          <MarqueeRow keyPrefix="a" />
          <MarqueeRow keyPrefix="b" />
        </div>
      </div>
    </section>
  );
}
