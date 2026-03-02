"use client";

import { useState } from "react";
import type { Script, ScriptBody } from "@/types/database";

interface ScriptDisplayProps {
  script: Script;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onScriptUpdated?: (script: Script) => void;
}

function parseScriptBody(raw: string): ScriptBody {
  try {
    const parsed = JSON.parse(raw);
    return {
      hook: parsed.hook || "",
      body: parsed.body || "",
      cta: parsed.cta || "",
    };
  } catch {
    return { hook: "", body: raw, cta: "" };
  }
}

export function ScriptDisplay({
  script,
  onRegenerate,
  isRegenerating,
  onScriptUpdated,
}: ScriptDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const scriptBody = parseScriptBody(script.script_body);
  const [editHook, setEditHook] = useState(scriptBody.hook);
  const [editBody, setEditBody] = useState(scriptBody.body);
  const [editCta, setEditCta] = useState(scriptBody.cta);

  function handleStartEdit() {
    const body = parseScriptBody(script.script_body);
    setEditHook(body.hook);
    setEditBody(body.body);
    setEditCta(body.cta);
    setEditing(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script_body: JSON.stringify({
            hook: editHook,
            body: editBody,
            cta: editCta,
          }),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEditing(false);
        onScriptUpdated?.(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    const text = `HOOK:\n${scriptBody.hook}\n\nBODY:\n${scriptBody.body}\n\nCTA:\n${scriptBody.cta}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 rounded-lg border border-neutral-800 p-4">
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Hook
            </label>
            <textarea
              value={editHook}
              onChange={(e) => setEditHook(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Body
            </label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              CTA
            </label>
            <textarea
              value={editCta}
              onChange={(e) => setEditCta(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-neutral-700 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Hook
            </h3>
            <p className="whitespace-pre-wrap text-sm">{scriptBody.hook}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Body
            </h3>
            <p className="whitespace-pre-wrap text-sm">{scriptBody.body}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              CTA
            </h3>
            <p className="whitespace-pre-wrap text-sm">{scriptBody.cta}</p>
          </div>
          <div className="flex gap-2 border-t border-neutral-800 pt-4">
            <button
              onClick={handleCopy}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleStartEdit}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Edit
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
