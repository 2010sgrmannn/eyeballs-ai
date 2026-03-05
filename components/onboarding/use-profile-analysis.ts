"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BrandDNAAnalysis } from "@/types/brand-profile";

export type AnalysisPhase =
  | "idle"
  | "pending"
  | "scraping"
  | "transcribing"
  | "classifying"
  | "analyzing_dna"
  | "done"
  | "error";

export interface AnalysisProgress {
  reelsRequested: number;
  reelsScraped: number;
  reelsTranscribed: number;
  reelsClassified: number;
}

export interface AnalysisResults {
  brandDna: BrandDNAAnalysis | null;
  creator: {
    id: string;
    bio: string;
    profile_pic_url: string;
    follower_count: number;
    display_name: string;
  } | null;
}

interface UseProfileAnalysisReturn {
  phase: AnalysisPhase;
  progress: AnalysisProgress;
  results: AnalysisResults | null;
  error: string | null;
  start: (handle: string) => void;
  retry: () => void;
  overallProgress: number;
}

const MAX_CONSECUTIVE_FAILURES = 5;

function calcProgress(phase: AnalysisPhase, p: AnalysisProgress): number {
  const total = p.reelsRequested || 10;
  switch (phase) {
    case "idle":
      return 0;
    case "pending":
      return 2;
    case "scraping":
      return 5 + (p.reelsScraped / total) * 25;
    case "transcribing":
      return 30 + (p.reelsTranscribed / Math.max(p.reelsScraped, 1)) * 30;
    case "classifying":
      return 60 + (p.reelsClassified / Math.max(p.reelsScraped, 1)) * 20;
    case "analyzing_dna":
      return 82;
    case "done":
      return 100;
    case "error":
      return 0;
    default:
      return 0;
  }
}

export function useProfileAnalysis(): UseProfileAnalysisReturn {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState<AnalysisProgress>({
    reelsRequested: 10,
    reelsScraped: 0,
    reelsTranscribed: 0,
    reelsClassified: 0,
  });
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const consecutiveFailuresRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const start = useCallback((handle: string) => {
    const clean = handle.trim().replace(/^@/, "");
    if (!clean) return;
    handleRef.current = clean;

    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    if (pollingRef.current) clearInterval(pollingRef.current);

    const controller = new AbortController();
    abortRef.current = controller;
    consecutiveFailuresRef.current = 0;

    setPhase("pending");
    setProgress({ reelsRequested: 10, reelsScraped: 0, reelsTranscribed: 0, reelsClassified: 0 });
    setError(null);
    setResults(null);

    (async () => {
      try {
        const startRes = await fetch("/api/profile-analyzer/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: clean, reel_count: 10 }),
          signal: controller.signal,
        });

        if (!startRes.ok) throw new Error("Failed to start profile analysis");

        const { job_id } = await startRes.json();
        jobIdRef.current = job_id;

        const startTime = Date.now();

        pollingRef.current = setInterval(async () => {
          try {
            if (Date.now() - startTime > 300_000) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setPhase("error");
              setError("Analysis timed out");
              return;
            }

            const statusRes = await fetch(`/api/profile-analyzer/status?job_id=${job_id}`, {
              signal: controller.signal,
            });
            if (!statusRes.ok) {
              consecutiveFailuresRef.current++;
              if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setPhase("error");
                setError("Lost connection to analysis server");
              }
              return;
            }

            // Reset on success
            consecutiveFailuresRef.current = 0;

            const data = await statusRes.json();

            setProgress({
              reelsRequested: data.reels_requested ?? 10,
              reelsScraped: data.reels_scraped ?? 0,
              reelsTranscribed: data.reels_transcribed ?? 0,
              reelsClassified: data.reels_classified ?? 0,
            });

            const serverPhase = data.status as AnalysisPhase;
            if (["scraping", "transcribing", "classifying", "analyzing_dna"].includes(serverPhase)) {
              setPhase(serverPhase);
            }

            if (data.status === "done") {
              if (pollingRef.current) clearInterval(pollingRef.current);

              const resultsRes = await fetch(`/api/profile-analyzer/results?job_id=${job_id}`, {
                signal: controller.signal,
              });
              if (resultsRes.ok) {
                const r = await resultsRes.json();
                setResults({
                  brandDna: r.brand_dna ?? null,
                  creator: r.creator ?? null,
                });
              }
              setPhase("done");
            } else if (data.status === "error") {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setPhase("error");
              setError(data.errors?.[data.errors.length - 1] || "Analysis failed");
            }
          } catch (pollErr) {
            // Ignore abort errors
            if (pollErr instanceof DOMException && pollErr.name === "AbortError") return;

            consecutiveFailuresRef.current++;
            if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setPhase("error");
              setError("Lost connection to analysis server");
            }
          }
        }, 3000);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === "AbortError") return;

        setPhase("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    })();
  }, []);

  const retry = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (handleRef.current) {
      start(handleRef.current);
    }
  }, [start]);

  return {
    phase,
    progress,
    results,
    error,
    start,
    retry,
    overallProgress: calcProgress(phase, progress),
  };
}
