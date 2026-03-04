"use client";

import { motion } from "motion/react";

interface AnalysisProgressBarProps {
  progress: number;
  label: string;
}

export function AnalysisProgressBar({ progress, label }: AnalysisProgressBarProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-2">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#6366F1" }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "#1C2840" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: "linear-gradient(90deg, #6366F1, #06B6D4)",
          }}
        />
      </div>
    </div>
  );
}
