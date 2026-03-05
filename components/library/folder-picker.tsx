"use client";

import { useState } from "react";
import type { Folder } from "@/types/database";

interface FolderPickerProps {
  folders: Folder[];
  onSelect: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onClose: () => void;
}

export function FolderPicker({
  folders,
  onSelect,
  onCreateFolder,
  onClose,
}: FolderPickerProps) {
  const [newFolderName, setNewFolderName] = useState("");

  function handleCreate() {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed);
    setNewFolderName("");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />
      {/* Popover */}
      <div
        className="relative z-[60] w-64 overflow-hidden"
        style={{
          background: "#141820",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="max-h-48 overflow-y-auto">
          {folders.length === 0 && (
            <p
              className="px-3 py-2"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#555",
              }}
            >
              No folders yet
            </p>
          )}
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelect(folder.id)}
              className="w-full px-3 py-2 text-left transition-colors duration-150"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#E0E0E0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#2A2A2A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {folder.name}
            </button>
          ))}
        </div>

        {/* Create new folder */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.07)" }}
        >
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder="New folder..."
            className="min-w-0 flex-1 px-2 py-1 focus:outline-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "#E0E0E0",
              background: "#080a0c",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "4px",
            }}
          />
          <button
            type="button"
            onClick={handleCreate}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors duration-150"
            style={{
              background: newFolderName.trim() ? "#ff3333" : "#333",
              color: "#fff",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
            }}
            disabled={!newFolderName.trim()}
          >
            +
          </button>
        </div>
      </div>
    </>
  );
}
