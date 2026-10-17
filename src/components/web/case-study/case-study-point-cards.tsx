"use client";

import { useState } from "react";
import type { PointCard } from "@/lib/project-draft";

export function CaseStudyPointCards({
  points,
  editable,
  onEditPoint,
  onAddPoint,
  onRemovePoint,
}: {
  points: PointCard[];
  editable?: boolean;
  onEditPoint?: (index: number, value: PointCard) => void;
  onAddPoint?: () => void;
  onRemovePoint?: (index: number) => void;
}) {
  const items = points.slice(0, 4);
  const [open, setOpen] = useState(0);

  if (items.length === 0 && !editable) return null;

  return (
    <div className={`cs-points-wrap${editable ? " is-editable" : ""}`}>
      <ul
        className="cs-points"
        onMouseLeave={() => {
          if (!editable) setOpen(0);
        }}
      >
        {items.map((point, index) => {
          const active = editable || open === index;
          return (
            <li
              key={`point-${index}`}
              className={`cs-point-card${active ? " is-open" : ""}`}
              onMouseEnter={() => setOpen(index)}
              onFocus={() => setOpen(index)}
              tabIndex={0}
            >
              <div className="cs-point-top">
                <span className="cs-point-num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {editable && onRemovePoint ? (
                  <button
                    type="button"
                    className="cs-point-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePoint(index);
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
              {editable && onEditPoint ? (
                <textarea
                  className="cs-point-text-input"
                  value={point.text}
                  rows={3}
                  onChange={(e) =>
                    onEditPoint(index, { ...point, text: e.target.value })
                  }
                  onFocus={() => setOpen(index)}
                />
              ) : (
                <p className="cs-point-text">{point.text}</p>
              )}
            </li>
          );
        })}
      </ul>
      {editable && onAddPoint && items.length < 4 ? (
        <button type="button" className="cs-points-add" onClick={onAddPoint}>
          + Gray card
        </button>
      ) : null}
    </div>
  );
}
