"use client";

import { motion } from "motion/react";
import { motionConfig } from "@/lib/design-tokens";
import type { AnalysisResults } from "./use-profile-analysis";

interface DnaRevealProps {
  isBuilding: boolean;
  results: AnalysisResults | null;
  onContinue: () => void;
}

export function DnaReveal({ isBuilding, results, onContinue }: DnaRevealProps) {
  const dna = results?.brandDna;

  if (isBuilding) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
            <path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z" />
          </svg>
        </motion.div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: "#f0f2f5" }}>
          Building your Brand DNA...
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#6b7280" }}>
          Combining all analysis into your unique voice profile
        </p>
      </div>
    );
  }

  if (!dna) return null;

  const cards = [
    { label: "Niche", value: dna.niche, color: "#ff3333" },
    { label: "Archetype", value: dna.creator_archetype, color: "#A855F7" },
    { label: "Tone", value: dna.tone_descriptors?.slice(0, 3).join(", "), color: "#47d4ff" },
    { label: "Pillars", value: dna.content_pillars?.slice(0, 3).join(", "), color: "#00e87a" },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "#f0f2f5" }}>
          Your Brand DNA
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#6b7280", marginTop: 4 }}>
          Here&apos;s what we found from your content
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: i * 0.12, ...motionConfig.spring.gentle }}
            className="rounded-xl p-5"
            style={{
              background: "#111827",
              border: `1px solid ${card.color}30`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 600,
                color: card.color,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {card.label}
            </span>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, color: "#f0f2f5", marginTop: 6 }}>
              {card.value || "Not detected"}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center"
      >
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg px-8 py-3 transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #ff3333, #ff4747)",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontSize: "16px",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
