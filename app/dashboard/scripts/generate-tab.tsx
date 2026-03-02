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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="topic" className="block text-sm font-medium">
            What do you want to talk about?
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 5 productivity tips that doubled my output as a solopreneur..."
            rows={3}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
        </div>

        {niches.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="niche" className="block text-sm font-medium">
              Niche (optional)
            </label>
            <select
              id="niche"
              value={nicheId}
              onChange={(e) => setNicheId(e.target.value)}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
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
            <label htmlFor="platform" className="block text-sm font-medium">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="style" className="block text-sm font-medium">
              Script Style
            </label>
            <select
              id="style"
              value={scriptStyle}
              onChange={(e) => setScriptStyle(e.target.value as ScriptStyle)}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
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
          className="rounded-md bg-white px-6 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Script"}
        </button>
      </form>

      {generatedScript && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Generated Script</h2>
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
