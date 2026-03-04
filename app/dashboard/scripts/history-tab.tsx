"use client";

import { useState } from "react";
import type { Script, Platform } from "@/types/database";
import { ScriptDisplay } from "./script-display";

interface HistoryTabProps {
  scripts: Script[];
  onScriptUpdated: (script: Script) => void;
  onScriptDeleted: (id: string) => void;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

export function HistoryTab({
  scripts,
  onScriptUpdated,
  onScriptDeleted,
}: HistoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onScriptDeleted(id);
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (scripts.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
        No scripts yet. Generate your first script to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {scripts.map((script) => (
        <div
          key={script.id}
          className="rounded-lg"
          style={{ border: "1px solid #1F1F1F", background: "#111111" }}
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === script.id ? null : script.id)
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="truncate"
                  style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "#FAFAFA" }}
                >
                  {script.title || "Untitled Script"}
                </span>
                {script.platform && (
                  <span
                    className="shrink-0 px-2 py-0.5 rounded"
                    style={{
                      border: "1px solid #1F1F1F",
                      background: "rgba(123, 47, 190, 0.08)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "#7B2FBE",
                    }}
                  >
                    {PLATFORM_LABELS[script.platform as Platform] ??
                      script.platform}
                  </span>
                )}
              </div>
              <p
                className="mt-0.5 truncate"
                style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B6B6B" }}
              >
                {script.topic} &middot;{" "}
                {new Date(script.created_at).toLocaleDateString()}
              </p>
            </div>
            <span style={{ color: "#6B6B6B" }}>
              {expandedId === script.id ? "\u25B2" : "\u25BC"}
            </span>
          </button>

          {expandedId === script.id && (
            <div
              className="px-4 py-4"
              style={{ borderTop: "1px solid #1F1F1F" }}
            >
              <ScriptDisplay
                script={script}
                onScriptUpdated={onScriptUpdated}
              />
              <div className="mt-4 flex gap-2">
                {confirmDeleteId === script.id ? (
                  <>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1" }}>
                      Delete this script?
                    </span>
                    <button
                      onClick={() => handleDelete(script.id)}
                      disabled={deletingId === script.id}
                      className="px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                      style={{
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "#EF4444",
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {deletingId === script.id ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1 rounded-lg transition-all"
                      style={{
                        border: "1px solid #333333",
                        color: "#A1A1A1",
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(script.id)}
                    className="px-3 py-1 rounded-lg transition-all"
                    style={{
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#EF4444",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
