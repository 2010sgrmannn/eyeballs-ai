"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BrandProfileForm } from "@/components/brand-profile-form";
import { ProfileAnalysisScreen } from "./profile-analysis-screen";
import { useProfileAnalysis } from "./use-profile-analysis";
import type { BrandProfileFormData } from "@/types/brand-profile";
import type { BrandDNAAnalysis } from "@/types/brand-profile";

type View = "form" | "analyzing" | "form-with-dna";

export function OnboardingFlow() {
  const [view, setView] = useState<View>("form");
  const [handle, setHandle] = useState("");
  const [dnaData, setDnaData] = useState<Partial<BrandProfileFormData> | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const analysis = useProfileAnalysis();

  const handleAnalysisStart = useCallback(
    (igHandle: string) => {
      if (isStarting) return;
      setIsStarting(true);
      setHandle(igHandle.replace(/^@/, ""));
      analysis.start(igHandle);
      setView("analyzing");
    },
    [analysis, isStarting]
  );

  const handleContinue = useCallback(() => {
    // Merge DNA results into form data
    if (analysis.results?.brandDna) {
      const dna = analysis.results.brandDna;
      setDnaData({
        niche: dna.niche || undefined,
        tone_descriptors: dna.tone_descriptors?.length ? dna.tone_descriptors : undefined,
        tone_formality: dna.tone_formality ?? undefined,
        tone_humor: dna.tone_humor ?? undefined,
        tone_authority: dna.tone_authority ?? undefined,
        creator_archetype: dna.creator_archetype || undefined,
        content_pillars: dna.content_pillars?.length ? dna.content_pillars : undefined,
        content_goal: dna.content_goal || undefined,
        content_formats: dna.content_formats?.length ? dna.content_formats : undefined,
        preferred_cta: dna.preferred_cta?.length ? dna.preferred_cta : undefined,
        values: dna.values?.length ? dna.values : undefined,
        target_audience: dna.target_audience || undefined,
        audience_problem: dna.audience_problem || undefined,
        audience_age_ranges: dna.audience_age_ranges?.length ? dna.audience_age_ranges : undefined,
        audience_gender: dna.audience_gender || undefined,
        unique_value_prop: dna.unique_value_prop || undefined,
      });
    }
    setView("form-with-dna");
  }, [analysis.results]);

  const handleBack = useCallback(() => {
    setIsStarting(false);
    setView("form");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%" }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <BrandProfileForm
            mode="onboarding"
            onAnalysisStart={handleAnalysisStart}
            isAnalysisStarting={isStarting}
          />
        </motion.div>
      )}

      {view === "analyzing" && (
        <motion.div
          key="analysis"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%" }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <ProfileAnalysisScreen
            handle={handle}
            phase={analysis.phase}
            progress={analysis.progress}
            overallProgress={analysis.overallProgress}
            results={analysis.results}
            error={analysis.error}
            onContinue={handleContinue}
            onRetry={analysis.retry}
            onBack={handleBack}
          />
        </motion.div>
      )}

      {view === "form-with-dna" && (
        <motion.div
          key="form-dna"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%" }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <BrandProfileForm
            mode="onboarding"
            startAtStep={1}
            initialDnaData={dnaData ?? undefined}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
