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
      <p className="text-sm text-neutral-400">
        No scripts yet. Generate your first script to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {scripts.map((script) => (
        <div
          key={script.id}
          className="rounded-lg border border-neutral-800 bg-neutral-900/50"
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === script.id ? null : script.id)
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {script.title || "Untitled Script"}
                </span>
                {script.platform && (
                  <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {PLATFORM_LABELS[script.platform as Platform] ??
                      script.platform}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {script.topic} &middot;{" "}
                {new Date(script.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="ml-2 text-neutral-500">
              {expandedId === script.id ? "\u25B2" : "\u25BC"}
            </span>
          </button>

          {expandedId === script.id && (
            <div className="border-t border-neutral-800 px-4 py-4">
              <ScriptDisplay
                script={script}
                onScriptUpdated={onScriptUpdated}
              />
              <div className="mt-4 flex gap-2">
                {confirmDeleteId === script.id ? (
                  <>
                    <span className="text-sm text-neutral-400">
                      Delete this script?
                    </span>
                    <button
                      onClick={() => handleDelete(script.id)}
                      disabled={deletingId === script.id}
                      className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === script.id ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(script.id)}
                    className="rounded-md border border-red-500/30 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10"
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
