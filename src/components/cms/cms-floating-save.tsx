"use client";

export function CmsFloatingSave({
  dirty,
  saving,
  onSave,
  onDiscard,
  label = "Unsaved changes",
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  label?: string;
}) {
  if (!dirty) return null;

  return (
    <div className="cms-float-save" role="status">
      <span className="cms-panel-lead" style={{ margin: "0 auto 0 0" }}>
        {label}
      </span>
      {onDiscard ? (
        <button type="button" className="cms-btn" disabled={saving} onClick={onDiscard}>
          Discard
        </button>
      ) : null}
      <button
        type="button"
        className="cms-btn cms-btn-primary"
        disabled={saving}
        onClick={onSave}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
