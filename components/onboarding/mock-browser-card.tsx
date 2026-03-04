"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { GlowingBorder } from "./glowing-border";
import { motionConfig } from "@/lib/design-tokens";

interface MockBrowserCardProps {
  handle: string;
  reelsScraped: number;
  reelsRequested: number;
}

export function MockBrowserCard({ handle, reelsScraped, reelsRequested }: MockBrowserCardProps) {
  const [typedUrl, setTypedUrl] = useState("");
  const fullUrl = `instagram.com/${handle}`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedUrl(fullUrl.slice(0, i));
      if (i >= fullUrl.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [fullUrl]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={motionConfig.spring.gentle}
      className="mx-auto w-full max-w-lg"
    >
      <GlowingBorder>
        {/* Browser chrome */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0A1018" }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#EF4444" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#EAB308" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#22C55E" }} />
          </div>

          {/* URL bar */}
          <div
            className="ml-4 flex-1 rounded-md px-3 py-1.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#A1A1A1",
              }}
            >
              {typedUrl}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ color: "#6366F1" }}
              >
                |
              </motion.span>
            </span>
          </div>
        </div>

        {/* Profile skeleton */}
        <div className="p-6 space-y-5">
          {/* Avatar + stats row */}
          <div className="flex items-center gap-5">
            <div
              className="h-16 w-16 rounded-full animate-shimmer"
              style={{ background: "#1C2840", border: "2px solid rgba(255,255,255,0.06)" }}
            />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded animate-shimmer" style={{ background: "#1C2840" }} />
              <div className="h-3 w-48 rounded animate-shimmer" style={{ background: "#162030" }} />
            </div>
          </div>

          {/* Reels counter */}
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#6B6B6B",
              }}
            >
              Discovering reels...
            </span>
            <motion.span
              key={reelsScraped}
              initial={{ scale: 1.3, color: "#6366F1" }}
              animate={{ scale: 1, color: "#A1A1A1" }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {reelsScraped}/{reelsRequested}
            </motion.span>
          </div>

          {/* Reel grid skeleton */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => {
              const isFound = i < reelsScraped;
              return (
                <motion.div
                  key={i}
                  className="aspect-[9/16] rounded-lg"
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: isFound ? 1 : 0.3,
                    borderColor: isFound ? "rgba(99, 102, 241, 0.5)" : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: isFound
                      ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))"
                      : "#111827",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {isFound && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={motionConfig.spring.bouncy}
                      className="flex h-full items-center justify-center"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlowingBorder>
    </motion.div>
  );
}
