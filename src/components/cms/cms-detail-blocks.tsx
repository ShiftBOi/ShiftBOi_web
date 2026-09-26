"use client";

import { Reorder, useDragControls } from "framer-motion";
import {
  EditableRegion,
  PreviewInput,
  type DetailBlock,
  type EditableField,
} from "@/components/cms/project-editor-primitives";

type Props = {
  details: DetailBlock[];
  editing: EditableField;
  onEdit: (field: string) => void;
  onReorder: (next: DetailBlock[]) => void;
  onChangeBlock: (index: number, patch: Partial<DetailBlock>) => void;
  onRemove: (index: number) => void;
  onAddSection: () => void;
  onAddHighlight: () => void;
  onDone: () => void;
};

function DragHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <button
      type="button"
      className="cms-detail-drag"
      aria-label="Drag to reorder"
      onPointerDown={(e) => controls.start(e)}
      style={{ touchAction: "none" }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </button>
  );
}

function DetailRow({
  block,
  index,
  editing,
  onEdit,
  onChangeBlock,
  onRemove,
  onDone,
}: {
  block: DetailBlock;
  index: number;
  editing: EditableField;
  onEdit: (field: string) => void;
  onChangeBlock: (index: number, patch: Partial<DetailBlock>) => void;
  onRemove: (index: number) => void;
  onDone: () => void;
}) {
  const controls = useDragControls();
  const titleKey = `detail:${index}:title`;
  const bodyKey = `detail:${index}:body`;
  const metricKey = `detail:${index}:metric`;
  const labelKey = `detail:${index}:label`;
  const bulletsKey = `detail:${index}:bullets`;

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={controls}
      className="cms-detail-row"
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        zIndex: 5,
      }}
    >
      <div className="cms-detail-chrome">
        <div className="cms-detail-chrome-left">
          <DragHandle controls={controls} />
          <span className="cms-detail-chrome-label">
            {block.kind === "highlight" ? "Highlight" : "Text section"} {index + 1}
          </span>
        </div>
        <button
          type="button"
          className="cms-band-chrome-delete"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
        >
          Remove
        </button>
      </div>

      <article
        className={`project-services-item${index > 0 ? " has-rule" : ""}`}
      >
        <div className="project-services-item-rail" aria-hidden />
        <div className="project-services-item-main">
          <div className="project-services-item-grid">
            <EditableRegion
              field={titleKey}
              editing={editing}
              onEdit={onEdit}
              label="title"
              as="div"
              className="cms-editable-block"
            >
              {editing === titleKey ? (
                <PreviewInput
                  value={block.title}
                  onChange={(v) => onChangeBlock(index, { title: v })}
                  onDone={onDone}
                  className="is-title"
                />
              ) : (
                <h3>{block.title || "Section title"}</h3>
              )}
            </EditableRegion>

            <div>
              {block.kind === "highlight" ? (
                <>
                  <EditableRegion
                    field={bodyKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="body"
                    as="div"
                    className="cms-editable-block"
                  >
                    {editing === bodyKey ? (
                      <PreviewInput
                        multiline
                        rows={3}
                        value={block.body}
                        onChange={(v) => onChangeBlock(index, { body: v })}
                        onDone={onDone}
                      />
                    ) : (
                      <p>{block.body || "Highlight body"}</p>
                    )}
                  </EditableRegion>
                  <ul>
                    <li>
                      <span aria-hidden>◇</span>
                      <EditableRegion
                        field={metricKey}
                        editing={editing}
                        onEdit={onEdit}
                        label="metric"
                        className="is-inline-edit"
                      >
                        {editing === metricKey ? (
                          <PreviewInput
                            value={block.metric}
                            onChange={(v) => onChangeBlock(index, { metric: v })}
                            onDone={onDone}
                            className="is-inline"
                          />
                        ) : (
                          <span>{block.metric || "—"}</span>
                        )}
                      </EditableRegion>
                      {" · "}
                      <EditableRegion
                        field={labelKey}
                        editing={editing}
                        onEdit={onEdit}
                        label="label"
                        className="is-inline-edit"
                      >
                        {editing === labelKey ? (
                          <PreviewInput
                            value={block.label}
                            onChange={(v) => onChangeBlock(index, { label: v })}
                            onDone={onDone}
                            className="is-inline"
                          />
                        ) : (
                          <span>{block.label || "LABEL"}</span>
                        )}
                      </EditableRegion>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <EditableRegion
                    field={bodyKey}
                    editing={editing}
                    onEdit={onEdit}
                    label="body"
                    as="div"
                    className="cms-editable-block"
                  >
                    {editing === bodyKey ? (
                      <PreviewInput
                        multiline
                        rows={4}
                        value={block.paragraphs.join("\n\n")}
                        onChange={(v) =>
                          onChangeBlock(index, {
                            paragraphs: v
                              .split(/\n\n+/)
                              .map((p) => p.trim())
                              .filter(Boolean),
                          })
                        }
                        onDone={onDone}
                      />
                    ) : (
                      block.paragraphs.length > 0 ? (
                        block.paragraphs.map((para, i) => <p key={`${block.id}-p-${i}`}>{para}</p>)
                      ) : (
                        <p>Section body</p>
                      )
                    )}
                  </EditableRegion>

                  {(block.bullets && block.bullets.length > 0) || editing === bulletsKey ? (
                    <EditableRegion
                      field={bulletsKey}
                      editing={editing}
                      onEdit={onEdit}
                      label="bullets"
                      as="div"
                      className="cms-editable-block"
                    >
                      {editing === bulletsKey ? (
                        <PreviewInput
                          multiline
                          rows={3}
                          value={(block.bullets ?? []).join("\n")}
                          placeholder="One bullet per line"
                          onChange={(v) =>
                            onChangeBlock(index, {
                              bullets: v
                                .split("\n")
                                .map((b) => b.trim())
                                .filter(Boolean),
                            })
                          }
                          onDone={onDone}
                        />
                      ) : (
                        <ul>
                          {(block.bullets ?? []).map((b) => (
                            <li key={b}>
                              <span aria-hidden>◇</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </EditableRegion>
                  ) : (
                    <button
                      type="button"
                      className="cms-chip-btn cms-chip-btn-quiet"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(bulletsKey);
                        onChangeBlock(index, { bullets: ["New point"] });
                      }}
                    >
                      + Bullets
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Reorder.Item>
  );
}

export function CmsDetailBlocks({
  details,
  editing,
  onEdit,
  onReorder,
  onChangeBlock,
  onRemove,
  onAddSection,
  onAddHighlight,
  onDone,
}: Props) {
  return (
    <div className="cms-details-editor">
      {details.length === 0 ? (
        <div className="cms-preview-empty-block">
          <p className="cms-preview-empty">No text sections yet.</p>
          <p className="cms-rail-hint">
            Add a section to get the same divider + title + body pattern as the live page.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={details}
          onReorder={onReorder}
          className="project-services-list cms-details-reorder"
        >
          {details.map((block, index) => (
            <DetailRow
              key={block.id}
              block={block}
              index={index}
              editing={editing}
              onEdit={onEdit}
              onChangeBlock={onChangeBlock}
              onRemove={onRemove}
              onDone={onDone}
            />
          ))}
        </Reorder.Group>
      )}

      <div className="cms-preview-add-row cms-details-add-row">
        <button
          type="button"
          className="cms-add-band-btn cms-add-detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddSection();
          }}
        >
          <span className="cms-add-band-icon" aria-hidden>
            +
          </span>
          <span>
            <strong>Add text section</strong>
            <em>Divider · title · body — same pattern everywhere</em>
          </span>
        </button>
        <button
          type="button"
          className="cms-chip-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddHighlight();
          }}
        >
          + Highlight
        </button>
      </div>
    </div>
  );
}
