"use client";

import { motion } from "motion/react";
import type { AnalysisPhase, AnalysisProgress, AnalysisResults } from "./use-profile-analysis";
import { MockBrowserCard } from "./mock-browser-card";
import { ProfileScrollAnimation } from "./profile-scroll-animation";
import { TranscriptionFlow } from "./transcription-flow";
import { DnaReveal } from "./dna-reveal";
import { AnalysisProgressBar } from "./analysis-progress-bar";

interface ProfileAnalysisScreenProps {
  handle: string;
  phase: AnalysisPhase;
  progress: AnalysisProgress;
  overallProgress: number;
  results: AnalysisResults | null;
  error: string | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  pending: "Connecting to Instagram...",
  scraping: "Scraping your profile...",
  transcribing: "Transcribing your reels...",
  classifying: "Classifying your content...",
  analyzing_dna: "Building your Brand DNA...",
  done: "Analysis complete!",
  error: "Something went wrong",
};

export function ProfileAnalysisScreen({
  handle,
  phase,
  progress,
  overallProgress,
  results,
  error,
  onContinue,
  onRetry,
  onBack,
}: ProfileAnalysisScreenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8 py-8">
      {/* Phase heading */}
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 700,
            color: "#FAFAFA",
          }}
        >
          {PHASE_LABELS[phase] || "Analyzing..."}
        </h2>
      </motion.div>

      {/* Progress bar */}
      {phase !== "done" && phase !== "error" && (
        <AnalysisProgressBar progress={overallProgress} label={PHASE_LABELS[phase] || ""} />
      )}

      {/* Animation content by phase */}
      <div className="w-full">
        {(phase === "pending" || phase === "scraping") && (
          <motion.div
            key="browser"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {phase === "pending" ? (
              <MockBrowserCard
                handle={handle}
                reelsScraped={0}
                reelsRequested={progress.reelsRequested}
              />
            ) : progress.reelsScraped < 3 ? (
              <MockBrowserCard
                handle={handle}
                reelsScraped={progress.reelsScraped}
                reelsRequested={progress.reelsRequested}
              />
            ) : (
              <ProfileScrollAnimation
                reelsScraped={progress.reelsScraped}
                reelsRequested={progress.reelsRequested}
              />
            )}
          </motion.div>
        )}

        {(phase === "transcribing" || phase === "classifying") && (
          <motion.div
            key="transcription"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TranscriptionFlow
              reelsScraped={progress.reelsScraped}
              reelsTranscribed={progress.reelsTranscribed}
              reelsClassified={progress.reelsClassified}
              showClassification={phase === "classifying"}
            />
          </motion.div>
        )}

        {phase === "analyzing_dna" && (
          <motion.div
            key="dna-building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <DnaReveal isBuilding results={null} onContinue={onContinue} />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="dna-reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DnaReveal isBuilding={false} results={results} onContinue={onContinue} />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-md text-center space-y-4"
          >
            <div
              className="rounded-xl p-6"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#f87171" }}>
                {error || "Analysis failed. You can retry or fill in Brand DNA manually."}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg px-6 py-2 transition-all hover:brightness-110"
                style={{
                  background: "#6366F1",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg px-6 py-2 transition-all hover:border-[#6366F1]"
                style={{
                  border: "1px solid #333",
                  color: "#A1A1A1",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Fill in manually
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
