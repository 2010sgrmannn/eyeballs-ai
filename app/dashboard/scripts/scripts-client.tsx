"use client";

import { useState } from "react";
import type { Script, Niche } from "@/types/database";
import { ScriptCanvas } from "@/components/scripts/script-canvas";
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
      <h1
        style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 700, color: "#FFFFFF" }}
      >
        Scripts
      </h1>
      <p
        className="mt-2"
        style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
      >
        Generate AI-powered scripts from your brand voice and top content.
      </p>

      <div
        className="mt-6 flex gap-1"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.07)" }}
      >
        <button
          onClick={() => setActiveTab("generate")}
          className="px-4 py-2 transition-all"
          style={{
            borderBottom: activeTab === "generate" ? "2px solid #ff3333" : "2px solid transparent",
            color: activeTab === "generate" ? "#f0f2f5" : "#6b7280",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "-1px",
          }}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className="px-4 py-2 transition-all"
          style={{
            borderBottom: activeTab === "history" ? "2px solid #ff3333" : "2px solid transparent",
            color: activeTab === "history" ? "#f0f2f5" : "#6b7280",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "-1px",
          }}
        >
          History ({scripts.length})
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "generate" ? (
          <ScriptCanvas />
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
