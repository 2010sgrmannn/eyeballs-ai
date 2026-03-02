"use client";

import { useState } from "react";
import type { Script, Niche } from "@/types/database";
import { GenerateTab } from "./generate-tab";
import { HistoryTab } from "./history-tab";

interface ScriptsClientProps {
  initialScripts: Script[];
  niches: Niche[];
}

export function ScriptsClient({ initialScripts, niches }: ScriptsClientProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "history">(
    "generate"
  );
  const [scripts, setScripts] = useState<Script[]>(initialScripts);

  function handleScriptGenerated(script: Script) {
    setScripts((prev) => [script, ...prev]);
  }

  function handleScriptUpdated(updated: Script) {
    setScripts((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  function handleScriptDeleted(id: string) {
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Scripts</h1>
      <p className="mt-2 text-neutral-400">
        Generate AI-powered scripts from your brand voice and top content.
      </p>

      <div className="mt-6 flex gap-1 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "border-b-2 border-white text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-white text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          History ({scripts.length})
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "generate" ? (
          <GenerateTab
            niches={niches}
            onScriptGenerated={handleScriptGenerated}
          />
        ) : (
          <HistoryTab
            scripts={scripts}
            onScriptUpdated={handleScriptUpdated}
            onScriptDeleted={handleScriptDeleted}
          />
        )}
      </div>
    </div>
  );
}
