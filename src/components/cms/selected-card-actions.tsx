import Link from "next/link";

export function SelectedPencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.5 5.5 18.5 11.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M4 20 5.8 14.2 15.2 4.8a1.7 1.7 0 0 1 2.4 0l1.6 1.6a1.7 1.7 0 0 1 0 2.4L9.8 18.2 4 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SelectedTrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SelectedCardActionIcons({
  editHref,
  onRemove,
  removeDisabled,
}: {
  editHref: string;
  onRemove: () => void;
  removeDisabled?: boolean;
}) {
  return (
    <div className="cms-selected-peer-actions-end">
      <Link
        href={editHref}
        className="cms-selected-icon-btn"
        aria-label="Edit project"
        title="Edit"
      >
        <SelectedPencilIcon />
      </Link>
      <button
        type="button"
        className="cms-selected-icon-btn is-danger"
        aria-label="Remove from Selected Projects"
        title="Remove"
        disabled={removeDisabled}
        onClick={onRemove}
      >
        <SelectedTrashIcon />
      </button>
    </div>
  );
}
