"use client";

import { motion } from "motion/react";
import { motionConfig } from "@/lib/design-tokens";

interface ProfileScrollAnimationProps {
  reelsScraped: number;
  reelsRequested: number;
}

export function ProfileScrollAnimation({ reelsScraped, reelsRequested }: ProfileScrollAnimationProps) {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl" style={{ background: "#0e1115", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "#f0f2f5" }}>
          Reels Found
        </span>
        <motion.span
          key={reelsScraped}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#ff3333", fontWeight: 600 }}
        >
          {reelsScraped}/{reelsRequested}
        </motion.span>
      </div>

      {/* Scrolling grid */}
      <div className="relative h-72 overflow-hidden">
        <motion.div
          animate={{ y: [0, -120] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="grid grid-cols-3 gap-2 p-3"
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const isDiscovered = i < reelsScraped;
            return (
              <motion.div
                key={i}
                className="aspect-[9/16] rounded-lg"
                animate={{
                  opacity: isDiscovered ? 1 : 0.2,
                  scale: isDiscovered ? 1 : 0.95,
                }}
                transition={{ duration: 0.4 }}
                style={{
                  background: isDiscovered
                    ? "linear-gradient(135deg, rgba(255,51,51,0.2), rgba(71,212,255,0.15))"
                    : "#111827",
                  border: isDiscovered
                    ? "1px solid rgba(255,51,51,0.3)"
                    : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {isDiscovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={motionConfig.spring.bouncy}
                    className="flex h-full flex-col items-center justify-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#ff3333" }}>
                      {i + 1}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Fade overlay at bottom */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: "linear-gradient(transparent, #0e1115)" }}
        />
      </div>
    </div>
  );
}
