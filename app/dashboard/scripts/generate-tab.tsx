"use client";

import { useState, type FormEvent } from "react";
import type { Niche, Platform, ScriptStyle, Script } from "@/types/database";
import { ScriptDisplay } from "./script-display";

interface GenerateTabProps {
  niches: Niche[];
  onScriptGenerated: (script: Script) => void;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
];

const STYLES: { value: ScriptStyle; label: string; desc: string }[] = [
  { value: "short", label: "Short-form", desc: "< 60s" },
  { value: "medium", label: "Medium", desc: "1-3 min" },
  { value: "long", label: "Long-form", desc: "3+ min" },
];

export function GenerateTab({ niches, onScriptGenerated }: GenerateTabProps) {
  const [topic, setTopic] = useState("");
  const [nicheId, setNicheId] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [scriptStyle, setScriptStyle] = useState<ScriptStyle>("short");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          niche_id: nicheId || undefined,
          platform,
          script_style: scriptStyle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate script");
      }

      const script = await res.json();
      setGeneratedScript(script);
      onScriptGenerated(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          niche_id: nicheId || undefined,
          platform,
          script_style: scriptStyle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate script");
      }

      const script = await res.json();
      setGeneratedScript(script);
      onScriptGenerated(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: "1px solid rgba(255, 255, 255, 0.07)",
    background: "#0e1115",
    color: "#f0f2f5",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 500 as const,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg"
            style={{
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ff3333",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="topic" style={labelStyle}>
            What do you want to talk about?
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 5 productivity tips that doubled my output as a solopreneur..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
            style={inputStyle}
          />
        </div>

        {niches.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="niche" style={labelStyle}>
              Niche (optional)
            </label>
            <select
              id="niche"
              value={nicheId}
              onChange={(e) => setNicheId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            >
              <option value="">All niches</option>
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="platform" style={labelStyle}>
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="style" style={labelStyle}>
              Script style
            </label>
            <select
              id="style"
              value={scriptStyle}
              onChange={(e) => setScriptStyle(e.target.value as ScriptStyle)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.desc})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            border: "1px solid #ff3333",
            background: "#ff3333",
            color: "#FFFFFF",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {loading ? "Generating..." : "Generate script"}
        </button>
      </form>

      {generatedScript && (
        <div className="mt-8">
          <h2
            className="mb-4"
            style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: "#f0f2f5" }}
          >
            Generated Script
          </h2>
          <ScriptDisplay
            script={generatedScript}
            onRegenerate={handleRegenerate}
            isRegenerating={loading}
          />
        </div>
      )}
    </div>
  );
}
