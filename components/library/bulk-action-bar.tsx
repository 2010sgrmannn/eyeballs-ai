"use client";

interface BulkActionBarProps {
  selectedCount: number;
  onFavorite: () => void;
  onMoveToFolder: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function BulkActionBar({
  selectedCount,
  onFavorite,
  onMoveToFolder,
  onDelete,
  onCancel,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const buttonStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    borderRadius: "6px",
    padding: "6px 14px",
    transition: "all 0.15s ease",
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-6 py-3"
      style={{
        background: "#1A1A1A",
        borderTop: "1px solid #1F1F1F",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "#FF2D2D",
        }}
      >
        {selectedCount}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "#E0E0E0",
        }}
      >
        selected
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onFavorite}
          style={{
            ...buttonStyle,
            border: "1px solid #1F1F1F",
            background: "#161616",
            color: "#E0E0E0",
          }}
        >
          Favorite
        </button>
        <button
          type="button"
          onClick={onMoveToFolder}
          style={{
            ...buttonStyle,
            border: "1px solid #1F1F1F",
            background: "#161616",
            color: "#E0E0E0",
          }}
        >
          Move to Folder
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{
            ...buttonStyle,
            border: "1px solid #FF2D2D",
            background: "rgba(255, 45, 45, 0.15)",
            color: "#FF2D2D",
          }}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            ...buttonStyle,
            border: "1px solid #1F1F1F",
            background: "transparent",
            color: "#888",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
