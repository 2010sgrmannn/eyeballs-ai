"use client";

import { motion } from "motion/react";
import { motionConfig } from "@/lib/design-tokens";

interface TranscriptionFlowProps {
  reelsScraped: number;
  reelsTranscribed: number;
  reelsClassified: number;
  showClassification: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Hook": "#6366F1",
  "Story": "#A855F7",
  "Tutorial": "#06B6D4",
  "Pitch": "#22C55E",
  "Q&A": "#EAB308",
};

const MOCK_CATEGORIES = ["Hook", "Story", "Tutorial", "Pitch", "Q&A", "Hook", "Story", "Tutorial", "Tutorial", "Hook"];

export function TranscriptionFlow({
  reelsScraped,
  reelsTranscribed,
  reelsClassified,
  showClassification,
}: TranscriptionFlowProps) {
  const reelCount = Math.min(reelsScraped, 10);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {/* Left: Reels column */}
        <div className="flex-1 space-y-2">
          <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Reels
          </span>
          <div className="space-y-2">
            {Array.from({ length: Math.min(reelCount, 6) }).map((_, i) => {
              const isTranscribed = i < reelsTranscribed;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, ...motionConfig.spring.gentle }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: isTranscribed ? "rgba(99,102,241,0.1)" : "#111827",
                    border: `1px solid ${isTranscribed ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isTranscribed ? "#6366F1" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: isTranscribed ? "#A1A1A1" : "#333" }}>
                    Reel {i + 1}
                  </span>

                  {/* Classification badge */}
                  {showClassification && i < reelsClassified && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={motionConfig.spring.bouncy}
                      className="ml-auto rounded-full px-2 py-0.5"
                      style={{
                        background: `${CATEGORY_COLORS[MOCK_CATEGORIES[i]] || "#6366F1"}20`,
                        border: `1px solid ${CATEGORY_COLORS[MOCK_CATEGORIES[i]] || "#6366F1"}50`,
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: CATEGORY_COLORS[MOCK_CATEGORIES[i]] || "#6366F1",
                      }}
                    >
                      {MOCK_CATEGORIES[i]}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Middle: SVG arrows */}
        <div className="hidden sm:flex items-center justify-center" style={{ width: 80 }}>
          <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
            {Array.from({ length: Math.min(reelCount, 6) }).map((_, i) => {
              const y = 20 + i * 32;
              const isActive = i < reelsTranscribed;
              return (
                <motion.g key={i}>
                  <motion.path
                    d={`M 0 ${y} C 30 ${y}, 50 ${y}, 80 ${y}`}
                    stroke={isActive ? "#6366F1" : "#1C2840"}
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: isActive ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                  />
                  {isActive && (
                    <motion.circle
                      r="3"
                      fill="#6366F1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    >
                      <animateMotion
                        dur="1.5s"
                        repeatCount="indefinite"
                        path={`M 0 ${y} C 30 ${y}, 50 ${y}, 80 ${y}`}
                      />
                    </motion.circle>
                  )}
                  {/* Arrowhead */}
                  {isActive && (
                    <motion.polygon
                      points={`75,${y - 4} 80,${y} 75,${y + 4}`}
                      fill="#6366F1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.15 + 0.4 }}
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Right: Transcripts column */}
        <div className="flex-1 space-y-2">
          <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Transcripts
          </span>
          <div className="space-y-2">
            {Array.from({ length: Math.min(reelCount, 6) }).map((_, i) => {
              const isReady = i < reelsTranscribed;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: isReady ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.15 + 0.3, ...motionConfig.spring.gentle }}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: isReady ? "rgba(6,182,212,0.08)" : "#111827",
                    border: `1px solid ${isReady ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {isReady ? (
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded" style={{ background: "rgba(6,182,212,0.15)" }} />
                      <div className="h-2 w-3/4 rounded" style={{ background: "rgba(6,182,212,0.1)" }} />
                    </div>
                  ) : (
                    <div className="h-6 animate-shimmer rounded" style={{ background: "#1C2840" }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress counter */}
      <div className="mt-4 text-center">
        <motion.span
          key={reelsTranscribed}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#6366F1" }}
        >
          {reelsTranscribed}/{reelsScraped} transcribed
          {showClassification && ` \u2022 ${reelsClassified}/${reelsScraped} classified`}
        </motion.span>
      </div>
    </div>
  );
}
