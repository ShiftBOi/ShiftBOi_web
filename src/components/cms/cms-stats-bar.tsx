"use client";

import {
  EditableRegion,
  PreviewInput,
  type DetailBlock,
  type DetailHighlight,
  type EditableField,
} from "@/components/cms/project-editor-primitives";
import {
  findTechBadge,
  resolveTechBadges,
  techCatalogGrouped,
} from "@/lib/tech-stack-catalog";

type Props = {
  details: DetailBlock[];
  techStack: string[];
  editing: EditableField;
  onEdit: (field: string) => void;
  onChangeBlock: (index: number, patch: Partial<DetailBlock>) => void;
  onRemove: (index: number) => void;
  onAddHighlight: () => void;
  onChangeTechStack: (next: string[]) => void;
  onDone: () => void;
};

export function CmsStatsBar({
  details,
  techStack,
  editing,
  onEdit,
  onChangeBlock,
  onRemove,
  onAddHighlight,
  onChangeTechStack,
  onDone,
}: Props) {
  const highlights = details
    .map((block, index) => ({ block, index }))
    .filter((row): row is { block: DetailHighlight; index: number } =>
      row.block.kind === "highlight",
    );

  const badges = resolveTechBadges(techStack).slice(0, 12);
  const groups = techCatalogGrouped();
  const selectedIds = new Set(
    techStack.map((t) => findTechBadge(t)?.id).filter(Boolean),
  );

  function addTech(id: string) {
    const badge = findTechBadge(id);
    if (!badge) return;
    if (selectedIds.has(badge.id)) return;
    onChangeTechStack([...techStack, badge.label].slice(0, 12));
  }

  function removeTech(id: string) {
    onChangeTechStack(
      techStack.filter((t) => findTechBadge(t)?.id !== id),
    );
  }

  return (
    <section className="cms-cs-stats-bar" aria-label="Stats bar">
      <div className="cms-detail-chrome">
        <div className="cms-detail-chrome-left">
          <span className="cms-detail-chrome-label">Stats bar</span>
        </div>
        {highlights.length < 4 ? (
          <button
            type="button"
            className="cms-chip-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddHighlight();
            }}
          >
            + Stat
          </button>
        ) : null}
      </div>

      <div className="cs-stats-card cms-cs-stats-preview">
        <div className="cs-stats-items">
          {highlights.length === 0 ? (
            <p className="cms-preview-empty">No stats yet — add a metric.</p>
          ) : (
            highlights.map(({ block, index }) => {
              const metricKey = `detail:${index}:metric`;
              const labelKey = `detail:${index}:label`;
              return (
                <div key={block.id} className="cs-stats-item cms-cs-stats-item">
                  <button
                    type="button"
                    className="cms-cs-stats-remove"
                    aria-label="Remove stat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                  >
                    ×
                  </button>
                  <EditableRegion
                    field={metricKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="metric"
                  >
                    {editing === metricKey ? (
                      <PreviewInput
                        value={block.metric}
                        onChange={(v) => onChangeBlock(index, { metric: v })}
                        onDone={onDone}
                        className="is-title"
                      />
                    ) : (
                      <p className="cs-stats-metric">{block.metric || "—"}</p>
                    )}
                  </EditableRegion>
                  <EditableRegion
                    field={labelKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="label"
                  >
                    {editing === labelKey ? (
                      <PreviewInput
                        value={block.label}
                        onChange={(v) => onChangeBlock(index, { label: v })}
                        onDone={onDone}
                      />
                    ) : (
                      <p className="cs-stats-label">{block.label || "LABEL"}</p>
                    )}
                  </EditableRegion>
                </div>
              );
            })
          )}
        </div>

        <div className="cs-stats-tech cms-cs-stats-tech">
          {badges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              className="cms-cs-tech-chip"
              title={`Remove ${badge.label}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTech(badge.id);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badge.src} alt={badge.label} height={18} />
              <span aria-hidden>×</span>
            </button>
          ))}
          {badges.length < 12 ? (
            <label className="cms-cs-tech-add">
              <span>+ Tech</span>
              <select
                value=""
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) addTech(id);
                  e.target.value = "";
                }}
              >
                <option value="">Add tech icon…</option>
                {groups.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.items.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        disabled={selectedIds.has(item.id)}
                      >
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
      <p className="cms-rail-hint cms-rail-hint-tight">
        Click a metric or label to edit. Pick tech icons from the dropdown — they
        show on the right of this bar.
      </p>
    </section>
  );
}
