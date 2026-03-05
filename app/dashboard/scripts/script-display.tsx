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

  const inputStyle = {
    border: "1px solid rgba(255, 255, 255, 0.07)",
    background: "#080a0c",
    color: "#f0f2f5",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

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

  const buttonStyle = {
    border: "1px solid #333333",
    color: "#A1A1A1",
    fontFamily: "var(--font-body)" as const,
    fontSize: "13px",
    fontWeight: 500 as const,
  };

  const sectionLabelStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    fontWeight: 500 as const,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  };

  return (
    <div
      className="space-y-4 p-4 rounded-lg"
      style={{ border: "1px solid rgba(255, 255, 255, 0.07)", background: "#080a0c" }}
    >
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label style={{ ...sectionLabelStyle, color: "#ff3333" }}>
              Hook
            </label>
            <textarea
              value={editHook}
              onChange={(e) => setEditHook(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>
          <div className="space-y-2">
            <label style={{ ...sectionLabelStyle, color: "#00D4D4" }}>
              Body
            </label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>
          <div className="space-y-2">
            <label style={{ ...sectionLabelStyle, color: "#ff3333" }}>
              CTA
            </label>
            <textarea
              value={editCta}
              onChange={(e) => setEditCta(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                border: "1px solid #ff3333",
                background: "#ff3333",
                color: "#FFFFFF",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-1.5 rounded-lg transition-all"
              style={buttonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-1" style={{ ...sectionLabelStyle, color: "#ff3333" }}>
              Hook
            </h3>
            <p
              className="whitespace-pre-wrap"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#f0f2f5" }}
            >
              {scriptBody.hook}
            </p>
          </div>
          <div>
            <h3 className="mb-1" style={{ ...sectionLabelStyle, color: "#00D4D4" }}>
              Body
            </h3>
            <p
              className="whitespace-pre-wrap"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#f0f2f5" }}
            >
              {scriptBody.body}
            </p>
          </div>
          <div>
            <h3 className="mb-1" style={{ ...sectionLabelStyle, color: "#ff3333" }}>
              CTA
            </h3>
            <p
              className="whitespace-pre-wrap"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#f0f2f5" }}
            >
              {scriptBody.cta}
            </p>
          </div>
          <div
            className="flex gap-2 pt-4"
            style={{ borderTop: "1px solid rgba(255, 255, 255, 0.07)" }}
          >
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                ...buttonStyle,
                color: copied ? "#ff3333" : "#A1A1A1",
                borderColor: copied ? "#ff3333" : "#333333",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={buttonStyle}
            >
              Edit
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={buttonStyle}
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
