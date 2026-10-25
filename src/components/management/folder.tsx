"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  className?: string;
  onClick?: () => void;
  coverImage?: string;
}

export function Folder({
  color = "#3B6BFF",
  size = 1,
  items = [],
  className = "",
  onClick,
  coverImage,
}: FolderProps) {
  const maxItems = 3;
  const papers = [...items.slice(0, maxItems)];
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );

  function handleClick() {
    if (onClick) onClick();
    else {
      setOpen((prev) => !prev);
      if (open) {
        setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
      }
    }
  }

  function handlePaperMouseMove(
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.15;
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  }

  function getOpenTransform(index: number) {
    if (index === 0) return "translate(-120%, -70%) rotate(-15deg)";
    if (index === 1) return "translate(10%, -70%) rotate(15deg)";
    if (index === 2) return "translate(-50%, -100%) rotate(5deg)";
    return "";
  }

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div
        className={`group relative cursor-pointer transition-all duration-200 ease-in ${
          !open ? "hover:-translate-y-2" : ""
        }`}
        style={{ transform: open ? "translateY(-8px)" : undefined }}
        onClick={handleClick}
      >
        <div
          className="relative h-[80px] w-[100px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] shadow-lg backdrop-blur-2xl"
          style={{
            background: `linear-gradient(135deg, ${color}70, ${color}90)`,
            border: `1px solid ${color}40`,
            boxShadow: `0 8px 24px ${color}25`,
          }}
        >
          <span
            className="absolute bottom-[98%] left-0 z-0 h-[10px] w-[30px] rounded-tl-[5px] rounded-tr-[5px] backdrop-blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${color}80, ${color}95)`,
              border: `1px solid ${color}40`,
              borderBottom: 0,
            }}
          />

          {papers.map((item, i) => {
            let sizeClasses = "w-[70%] h-[80%]";
            if (i === 1) sizeClasses = open ? "w-[80%] h-[80%]" : "w-[80%] h-[70%]";
            if (i === 2) sizeClasses = open ? "w-[90%] h-[80%]" : "w-[90%] h-[60%]";

            return (
              <div
                key={i}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={() =>
                  setPaperOffsets((prev) => {
                    const next = [...prev];
                    next[i] = { x: 0, y: 0 };
                    return next;
                  })
                }
                className={`absolute bottom-[10%] left-1/2 z-20 overflow-hidden rounded-[10px] border border-white/30 bg-white/90 shadow-lg backdrop-blur-xl transition-all duration-300 ease-in-out ${
                  !open
                    ? "-translate-x-1/2 translate-y-[10%] group-hover:translate-y-0"
                    : "hover:scale-110"
                } ${sizeClasses}`}
                style={
                  open
                    ? {
                        transform: `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`,
                      }
                    : undefined
                }
              >
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  item ?? (
                    <div className="grid h-full place-items-center">
                      <FolderOpen className="size-5 text-primary/40" />
                    </div>
                  )
                )}
              </div>
            );
          })}

          <div
            className={`absolute z-30 h-full w-full origin-bottom backdrop-blur-xl transition-all duration-300 ease-in-out ${
              !open ? "group-hover:[transform:skew(15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              background: `linear-gradient(135deg, ${color}85, ${color}95)`,
              borderRadius: "5px 10px 10px 10px",
              border: `1px solid ${color}40`,
              ...(open ? { transform: "skew(15deg) scaleY(0.6)" } : {}),
            }}
          />
          <div
            className={`absolute z-30 h-full w-full origin-bottom backdrop-blur-xl transition-all duration-300 ease-in-out ${
              !open ? "group-hover:[transform:skew(-15deg)_scaleY(0.6)]" : ""
            }`}
            style={{
              background: `linear-gradient(135deg, ${color}85, ${color}95)`,
              borderRadius: "5px 10px 10px 10px",
              border: `1px solid ${color}40`,
              ...(open ? { transform: "skew(-15deg) scaleY(0.6)" } : {}),
            }}
          />
        </div>
      </div>
    </div>
  );
}
