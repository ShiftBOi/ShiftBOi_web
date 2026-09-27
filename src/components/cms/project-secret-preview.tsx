"use client";

import {
  EditableRegion,
  PreviewInput,
  type EditableField,
  type ProjectDraft,
} from "@/components/cms/project-editor-primitives";
import { HydraTripleRule } from "@/components/web/hydra-primitives";

type Props = {
  draft: ProjectDraft;
  editing: EditableField;
  onEdit: (field: string) => void;
  onChange: <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => void;
  onDone: () => void;
};

/**
 * CMS visualize for Secret (CONFIDENTIAL) projects —
 * mirrors the homepage full-width solo row (not the Selected 2-up grid).
 */
export function ProjectSecretPreview({
  draft,
  editing,
  onEdit,
  onChange,
  onDone,
}: Props) {
  const bullets =
    draft.techStack.length > 0
      ? draft.techStack.slice(0, 3)
      : [
          "Solo homepage row — not mixed into Selected Projects",
          "No public detail page while marked Secret",
          "Switch to Selected when you want the 2-up grid + detail route",
        ];

  return (
    <div className="cms-secret-preview project-page">
      <div className="hydra-double-rule-gap cms-secret-preview-rule">
        <HydraTripleRule />
      </div>

      <section className="hydra-recall-band cms-secret-recall">
        <div className="hydra-container">
          <div className="grid border-x border-[#353535] lg:grid-cols-2">
            <div className="border-b border-[#353535] p-8 md:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <EditableRegion
                field="title"
                editing={editing}
                onEdit={onEdit}
                label="title"
                as="div"
              >
                {editing === "title" ? (
                  <PreviewInput
                    value={draft.title}
                    onChange={(v) => onChange("title", v)}
                    onDone={onDone}
                    className="is-title"
                  />
                ) : (
                  <h2 className="hydra-h2-dark text-left text-white">
                    {draft.title || "Secret project"}
                  </h2>
                )}
              </EditableRegion>

              <EditableRegion
                field="summary"
                editing={editing}
                onEdit={onEdit}
                label="summary"
                as="div"
                className="mt-6"
              >
                {editing === "summary" ? (
                  <PreviewInput
                    multiline
                    rows={4}
                    value={draft.summary}
                    onChange={(v) => onChange("summary", v)}
                    onDone={onDone}
                  />
                ) : (
                  <p className="max-w-md text-[15px] leading-[1.45] tracking-[-0.01em] text-[rgb(153,153,153)]">
                    {draft.summary || "Short teaser for the secret row."}
                  </p>
                )}
              </EditableRegion>

              <ul className="mt-8 space-y-5">
                {bullets.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-[var(--color-hydra-accent)] pl-4 text-[14px] leading-[1.4] tracking-[-0.01em] text-[rgb(153,153,153)]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[12px] text-white/40">
                Bullets use the first 3 tech stack tags when set.
              </p>
            </div>

            <div className="relative min-h-[280px] overflow-hidden p-6 md:min-h-[340px] md:p-8">
              <p className="hydra-accent-label-sm mb-4">Clarity vs Project Complexity</p>
              <svg viewBox="0 0 420 220" className="h-auto w-full" aria-hidden>
                <g stroke="#353535" strokeWidth="1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="40" y1={20 + i * 40} x2="400" y2={20 + i * 40} />
                  ))}
                </g>
                <path
                  d="M40 40 C120 42, 200 55, 280 95 C340 130, 380 165, 400 190"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 48 C120 55, 200 85, 280 140 C340 175, 380 195, 400 205"
                  fill="none"
                  stroke="#f9c425"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 30 C140 32, 220 38, 300 55 C360 72, 390 88, 400 98"
                  fill="none"
                  stroke="var(--color-hydra-accent)"
                  strokeWidth="2"
                />
              </svg>
              <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[rgb(153,153,153)]">
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-[var(--color-hydra-accent)]" /> ShiftBOi
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-white" /> Split teams
                </span>
                <span className="inline-flex items-center gap-2">
                  <i className="inline-block size-2.5 bg-[#f9c425]" /> Spec-only handoff
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
