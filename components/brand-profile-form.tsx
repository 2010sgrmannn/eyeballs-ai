"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { BrandProfileFormData } from "@/types/brand-profile";
import { DEFAULT_FORM_DATA } from "@/types/brand-profile";
import type { BrandDNAAnalysis } from "@/types/brand-profile";
import {
  NICHE_OPTIONS,
  TONE_DESCRIPTOR_OPTIONS,
  ARCHETYPE_OPTIONS,
  CONTENT_PILLAR_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  CTA_OPTIONS,
  VALUE_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  CONTENT_GOAL_OPTIONS,
} from "@/lib/constants/brand-profile-options";
import type { StoryCategory, StoryEmotion } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryDraft {
  title: string;
  content: string;
  category: StoryCategory | "";
  emotion: StoryEmotion | "";
  time_period: string;
}

interface BrandProfileFormProps {
  initialData?: BrandProfileFormData;
  mode: "onboarding" | "edit";
  onAnalysisStart?: (handle: string) => void;
  startAtStep?: number;
  initialDnaData?: Partial<BrandProfileFormData>;
}

type AnalyzingPhase = "idle" | "scraping" | "transcribing" | "classifying" | "analyzing_dna" | "done" | "error";

const STORY_CATEGORIES: { value: StoryCategory; label: string }[] = [
  { value: "struggle", label: "Struggle" },
  { value: "achievement", label: "Achievement" },
  { value: "childhood", label: "Childhood" },
  { value: "relationship", label: "Relationship" },
  { value: "career", label: "Career" },
  { value: "turning_point", label: "Turning Point" },
  { value: "funny", label: "Funny" },
  { value: "lesson", label: "Lesson Learned" },
];

const STORY_EMOTIONS: { value: StoryEmotion; label: string }[] = [
  { value: "shame", label: "Shame" },
  { value: "pride", label: "Pride" },
  { value: "fear", label: "Fear" },
  { value: "relief", label: "Relief" },
  { value: "anger", label: "Anger" },
  { value: "joy", label: "Joy" },
  { value: "surprise", label: "Surprise" },
  { value: "frustration", label: "Frustration" },
];

function createEmptyStory(): StoryDraft {
  return { title: "", content: "", category: "", emotion: "", time_period: "" };
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  border: "1px solid #1F1F1F",
  background: "#0A0A0A",
  color: "#FAFAFA",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(24px, 3vw, 32px)",
  fontWeight: 700,
  color: "#FFFFFF",
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "15px",
  color: "#A1A1A1",
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  fontWeight: 600,
  color: "#6B6B6B",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "16px",
  fontWeight: 600,
  color: "#FAFAFA",
};

// ---------------------------------------------------------------------------
// Small reusable UI pieces
// ---------------------------------------------------------------------------

function Chip({
  label,
  selected,
  onClick,
  color = "red",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: "red" | "teal";
}) {
  const accent = color === "teal" ? "#00D4D4" : "#FF2D2D";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-4 py-2 transition-all duration-200 hover:scale-[1.02]"
      style={{
        border: selected ? `1px solid ${accent}` : "1px solid #1F1F1F",
        background: selected
          ? color === "teal"
            ? "rgba(0, 212, 212, 0.15)"
            : "rgba(255, 45, 45, 0.15)"
          : "#161616",
        color: selected ? accent : "#888888",
        fontFamily: "var(--font-body)",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ChipWithCustom({
  options,
  selected,
  onToggle,
  color = "red",
  max,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  color?: "red" | "teal";
  max?: number;
}) {
  const [custom, setCustom] = useState("");

  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onToggle(trimmed);
      setCustom("");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selected.includes(opt)}
            onClick={() => {
              if (!selected.includes(opt) && max && selected.length >= max) return;
              onToggle(opt);
            }}
            color={color}
          />
        ))}
        {selected
          .filter((v) => !options.includes(v))
          .map((v) => (
            <Chip key={v} label={v} selected onClick={() => onToggle(v)} color={color} />
          ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add custom..."
          className="flex-1 rounded-md px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg px-4 py-2 transition-all duration-200 hover:border-[#FF2D2D] hover:scale-[1.02]"
          style={{
            border: "1px solid #333",
            color: "#A1A1A1",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            background: "transparent",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ToneSlider({
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const positions = [1, 2, 3, 4, 5];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888888" }}>
          {leftLabel}
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888888" }}>
          {rightLabel}
        </span>
      </div>
      <div className="relative flex items-center justify-between" style={{ height: 32 }}>
        {/* Track */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            height: 4,
            borderRadius: 2,
            background: "#1F1F1F",
          }}
        />
        {/* Dots */}
        {positions.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => onChange(pos)}
            className="relative z-10 transition-all duration-200"
            style={{
              width: value === pos ? 20 : 12,
              height: value === pos ? 20 : 12,
              borderRadius: "50%",
              background: value === pos ? "#FF2D2D" : "#333",
              border: value === pos ? "2px solid #FF2D2D" : "2px solid #333",
              cursor: "pointer",
              boxShadow: value === pos ? "0 0 8px rgba(255, 45, 45, 0.4)" : "none",
            }}
            aria-label={`${leftLabel} to ${rightLabel}: ${pos}`}
          />
        ))}
      </div>
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  children,
  style: extraStyle,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02]"
      style={{
        border: selected ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
        background: selected ? "rgba(255, 45, 45, 0.08)" : "#111111",
        cursor: "pointer",
        width: "100%",
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs)
// ---------------------------------------------------------------------------

function PersonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="17" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.84 2.84 0 0 1 .98.17V9.03a6.34 6.34 0 0 0-.98-.08 6.34 6.34 0 1 0 6.34 6.34V9.37a8.16 8.16 0 0 0 3.76.92V6.84a4.79 4.79 0 0 1-.01-.15Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

function MultipleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ChartUpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function CommunityIcon() {
  return <PeopleIcon />;
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
      <path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#00D4D4" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke="#00D4D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ size = 18, color = "#00D4D4" }: { size?: number; color?: string }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BrandProfileForm({ initialData, mode, onAnalysisStart, startAtStep, initialDnaData }: BrandProfileFormProps) {
  const router = useRouter();

  // Step mapping: 0=Instagram, 1=About You, 2=Your Story, 3=Brand DNA, 4=Launch
  // In edit mode: About You, Story, Brand DNA only
  const editSteps = [1, 2, 3];
  const onboardingSteps = [0, 1, 2, 3, 4];
  const steps = mode === "edit" ? editSteps : onboardingSteps;
  const totalSteps = steps.length;

  const computedStartIndex = startAtStep !== undefined ? steps.indexOf(startAtStep) : 0;
  const [stepIndex, setStepIndex] = useState(computedStartIndex >= 0 ? computedStartIndex : 0);
  const currentStep = steps[stepIndex];

  const [formData, setFormData] = useState<BrandProfileFormData>(
    initialData ?? { ...DEFAULT_FORM_DATA }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  // Stories
  const [stories, setStories] = useState<StoryDraft[]>([
    createEmptyStory(),
    createEmptyStory(),
    createEmptyStory(),
  ]);

  // Scraping & analyzing (runs in background)
  const [jobId, setJobId] = useState<string | null>(null);
  const [analyzingPhase, setAnalyzingPhase] = useState<AnalyzingPhase>("idle");
  const [scrapePostsFound, setScrapePostsFound] = useState(0);
  const [reelsTranscribed, setReelsTranscribed] = useState(0);
  const [reelsClassified, setReelsClassified] = useState(0);
  const [reelsRequested, setReelsRequested] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;
  const dnaReadyRef = useRef(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // Clear any stale localStorage from previous versions on mount
  useEffect(() => {
    try {
      localStorage.removeItem("eyeballs_onboarding_progress");
    } catch {
      // ignore
    }
  }, []);

  // Merge initialDnaData (from analysis screen) into formData on mount
  useEffect(() => {
    if (initialDnaData) {
      setFormData((prev) => {
        const merged = { ...prev };
        for (const [key, value] of Object.entries(initialDnaData)) {
          if (value !== undefined) {
            (merged as Record<string, unknown>)[key] = value;
          }
        }
        return merged;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step transition helper
  const transitionTo = useCallback(
    (nextIndex: number) => {
      setFadeState("out");
      setTimeout(() => {
        setStepIndex(nextIndex);
        setFadeState("in");
      }, 150);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  function update<K extends keyof BrandProfileFormData>(key: K, value: BrandProfileFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayField(key: keyof BrandProfileFormData, value: string) {
    setFormData((prev) => {
      const arr = prev[key] as string[];
      const exists = arr.includes(value);
      return { ...prev, [key]: exists ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  function updateStory(index: number, field: keyof StoryDraft, value: string) {
    setStories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Scraping & AI Analysis (runs in BACKGROUND while user fills other steps)
  // ---------------------------------------------------------------------------

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }

  async function triggerScrapeAndAnalyze() {
    const handle = (formData.social_handles.instagram ?? "").trim().replace(/^@/, "");
    if (!handle) return;

    setAnalyzingPhase("scraping");
    setScrapePostsFound(0);
    setReelsTranscribed(0);
    setReelsClassified(0);
    setAnalyzeError(null);
    dnaReadyRef.current = false;

    showToast("Starting profile analysis...");

    try {
      // Start profile analysis
      const startRes = await fetch("/api/profile-analyzer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, reel_count: 10 }),
      });

      if (!startRes.ok) {
        throw new Error("Failed to start profile analysis");
      }

      const { job_id } = await startRes.json();
      setJobId(job_id);
      setReelsRequested(10);

      // Poll status until done or error (timeout after 300s)
      const startTime = Date.now();
      await new Promise<void>((resolve, reject) => {
        pollingIntervalRef.current = setInterval(async () => {
          try {
            if (Date.now() - startTime > 300_000) {
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              reject(new Error("Analysis timed out"));
              return;
            }

            const statusRes = await fetch(`/api/profile-analyzer/status?job_id=${job_id}`);
            if (!statusRes.ok) return;
            const data = await statusRes.json();

            // Update progress state
            setScrapePostsFound(data.reels_scraped ?? 0);
            setReelsTranscribed(data.reels_transcribed ?? 0);
            setReelsClassified(data.reels_classified ?? 0);
            setReelsRequested(data.reels_requested ?? 10);

            // Update phase for toast messages
            const serverStatus = data.status as AnalyzingPhase;
            if (serverStatus === "scraping") {
              setAnalyzingPhase("scraping");
              if (data.reels_scraped > 0) {
                showToast(`Scraping reels... (${data.reels_scraped}/${data.reels_requested})`);
              } else {
                showToast("Scraping reels from Instagram...");
              }
            } else if (serverStatus === "transcribing") {
              setAnalyzingPhase("transcribing");
              showToast(`Transcribing reels... (${data.reels_transcribed}/${data.reels_scraped})`);
            } else if (serverStatus === "classifying") {
              setAnalyzingPhase("classifying");
              showToast(`Classifying reels... (${data.reels_classified}/${data.reels_scraped})`);
            } else if (serverStatus === "analyzing_dna") {
              setAnalyzingPhase("analyzing_dna");
              showToast("Building your Brand DNA from all data...");
            }

            if (data.status === "done" || data.status === "error") {
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              if (data.status === "error") {
                reject(new Error(data.errors?.[data.errors.length - 1] || "Analysis failed"));
              } else {
                resolve();
              }
            }
          } catch {
            // ignore poll errors
          }
        }, 3000);
      });

      // Fetch results
      const resultsRes = await fetch(`/api/profile-analyzer/results?job_id=${job_id}`);
      if (!resultsRes.ok) {
        throw new Error("Failed to fetch analysis results");
      }

      const results = await resultsRes.json();
      const dna = results.brand_dna as BrandDNAAnalysis | null;

      if (dna) {
        // Merge AI results into formData
        setFormData((prev) => ({
          ...prev,
          niche: dna.niche || prev.niche,
          tone_descriptors: dna.tone_descriptors?.length ? dna.tone_descriptors : prev.tone_descriptors,
          tone_formality: dna.tone_formality ?? prev.tone_formality,
          tone_humor: dna.tone_humor ?? prev.tone_humor,
          tone_authority: dna.tone_authority ?? prev.tone_authority,
          creator_archetype: dna.creator_archetype || prev.creator_archetype,
          content_pillars: dna.content_pillars?.length ? dna.content_pillars : prev.content_pillars,
          content_goal: dna.content_goal || prev.content_goal,
          content_formats: dna.content_formats?.length ? dna.content_formats : prev.content_formats,
          preferred_cta: dna.preferred_cta?.length ? dna.preferred_cta : prev.preferred_cta,
          values: dna.values?.length ? dna.values : prev.values,
          target_audience: dna.target_audience || prev.target_audience,
          audience_problem: dna.audience_problem || prev.audience_problem,
          audience_age_ranges: dna.audience_age_ranges?.length ? dna.audience_age_ranges : prev.audience_age_ranges,
          audience_gender: dna.audience_gender || prev.audience_gender,
          unique_value_prop: dna.unique_value_prop || prev.unique_value_prop,
        }));
      }

      setAnalyzingPhase("done");
      dnaReadyRef.current = true;
      showToast("Brand Voice DNA ready! Review it on the Brand DNA step.");
    } catch (err) {
      console.error("[brand-profile-form] profile analysis error:", err);
      setAnalyzeError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzingPhase("error");
      dnaReadyRef.current = true; // still let them proceed to Brand DNA step
      showToast("Couldn't analyze automatically. You can fill in Brand DNA manually.");
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateCurrentStep(): string | null {
    switch (currentStep) {
      case 0:
        // Instagram step — handle is optional (they can skip)
        return null;
      case 1:
        // About You
        if (!formData.display_name.trim()) return "Please enter your name";
        if (!formData.creator_type) return "Please select your creator type";
        if (!formData.primary_platform) return "Please select your primary platform";
        return null;
      case 2: {
        // Your Story
        if (!formData.personal_bio.trim()) return "Please tell us your backstory";
        const filledStories = stories.filter((s) => s.title.trim() && s.content.trim());
        if (filledStories.length < 3) return "Please fill in at least 3 Key Moments (title + content)";
        return null;
      }
      case 3:
        // Brand DNA
        if (!formData.niche.trim()) return "Please select or enter your niche";
        if (formData.tone_descriptors.length === 0) return "Please select at least one tone descriptor";
        if (!formData.creator_archetype) return "Please choose your creator archetype";
        if (formData.content_pillars.length === 0) return "Please select at least one content pillar";
        if (!formData.content_goal) return "Please select your content goal";
        return null;
      case 4:
        // Launch
        return null;
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    setError(null);
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    // When leaving step 0 (Instagram), trigger analysis
    if (currentStep === 0) {
      const handle = (formData.social_handles.instagram ?? "").trim().replace(/^@/, "");
      if (handle) {
        if (onAnalysisStart) {
          // Delegate to parent (OnboardingFlow) — shows the full analysis screen
          onAnalysisStart(handle);
          return;
        }
        if (analyzingPhase === "idle") {
          // Fire and forget — runs in background while user fills About You + Story
          triggerScrapeAndAnalyze();
        }
      }
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < totalSteps) {
      transitionTo(nextIndex);
    }
  }

  function handleBack() {
    setError(null);
    if (stepIndex > 0) {
      transitionTo(stepIndex - 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  async function saveProfile() {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in");
        setSaving(false);
        return;
      }

      // Build backwards-compat fields
      const brand_voice = `${formData.tone_descriptors.join(", ")}. Archetype: ${formData.creator_archetype}`;
      const content_style = formData.creator_archetype;

      const payload = {
        user_id: user.id,
        display_name: formData.display_name,
        creator_type: formData.creator_type,
        primary_platform: formData.primary_platform,
        social_handles: formData.social_handles,
        inspiration_handles: formData.inspiration_handles,
        niche: formData.niche,
        tone_descriptors: formData.tone_descriptors,
        tone_formality: formData.tone_formality,
        tone_humor: formData.tone_humor,
        tone_authority: formData.tone_authority,
        creator_archetype: formData.creator_archetype,
        sample_content: formData.sample_content,
        content_pillars: formData.content_pillars,
        content_goal: formData.content_goal,
        content_formats: formData.content_formats,
        preferred_cta: formData.preferred_cta,
        values: formData.values,
        target_audience: formData.target_audience,
        audience_problem: formData.audience_problem,
        audience_age_ranges: formData.audience_age_ranges,
        audience_gender: formData.audience_gender,
        unique_value_prop: formData.unique_value_prop,
        birth_year: formData.birth_year,
        location: formData.location || null,
        personal_bio: formData.personal_bio || null,
        fun_facts: formData.fun_facts,
        languages: formData.languages,
        early_life: formData.early_life || null,
        biggest_struggle: formData.biggest_struggle || null,
        defining_moment: formData.defining_moment || null,
        brand_voice,
        content_style,
      };

      if (mode === "onboarding") {
        const { error: upsertError } = await supabase
          .from("brand_profiles")
          .upsert(
            {
              ...payload,
              onboarding_completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          setError(upsertError.message);
          setSaving(false);
          return;
        }

        // Save stories
        const filledStories = stories.filter((s) => s.title.trim() && s.content.trim());
        for (let i = 0; i < filledStories.length; i++) {
          const story = filledStories[i];
          await fetch("/api/creator-stories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: story.title.trim(),
              content: story.content.trim(),
              emotion: story.emotion || null,
              category: story.category || null,
              time_period: story.time_period?.trim() || null,
              sort_order: i,
            }),
          });
        }

        try { localStorage.removeItem("eyeballs_onboarding_progress"); } catch {}
        router.push("/dashboard");
      } else {
        const { error: updateError } = await supabase
          .from("brand_profiles")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    await saveProfile();
  }

  // ---------------------------------------------------------------------------
  // Step labels
  // ---------------------------------------------------------------------------

  const STEP_LABELS: Record<number, string> = {
    0: "Instagram",
    1: "About You",
    2: "Your Story",
    3: "Brand DNA",
    4: "Launch",
  };

  function toneSummaryLabel(value: number, left: string, right: string) {
    if (value <= 2) return left;
    if (value >= 4) return right;
    return `${left}/${right}`;
  }

  // ---------------------------------------------------------------------------
  // Render steps
  // ---------------------------------------------------------------------------

  function renderStep1AboutYou() {
    const creatorTypes = [
      { id: "solo_creator" as const, label: "Solo Creator", description: "I create content for my personal brand", icon: <PersonIcon /> },
      { id: "brand" as const, label: "Brand", description: "I create content for a company or product", icon: <BuildingIcon /> },
      { id: "agency" as const, label: "Agency", description: "I manage content for multiple clients", icon: <PeopleIcon /> },
    ];

    const platforms = [
      { id: "instagram", label: "Instagram", icon: <InstagramIcon /> },
      { id: "tiktok", label: "TikTok", icon: <TikTokIcon /> },
      { id: "youtube", label: "YouTube", icon: <YouTubeIcon /> },
      { id: "multiple", label: "Multiple", icon: <MultipleIcon /> },
    ];

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 style={headingStyle}>Welcome to Eyeballs AI</h1>
          <p style={subtitleStyle}>
            Let&apos;s build your content engine. First, tell us about yourself.
          </p>
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <label style={labelStyle}>What should we call you?</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            placeholder="Your name or brand name"
            className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
            style={inputStyle}
          />
        </div>

        {/* Creator type */}
        <div className="space-y-3">
          <label style={labelStyle}>What type of creator are you?</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {creatorTypes.map((ct) => (
              <SelectableCard
                key={ct.id}
                selected={formData.creator_type === ct.id}
                onClick={() => update("creator_type", ct.id)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div style={{ color: formData.creator_type === ct.id ? "#FF2D2D" : "#555" }}>
                    {ct.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: formData.creator_type === ct.id ? "#FFFFFF" : "#FAFAFA",
                    }}
                  >
                    {ct.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    {ct.description}
                  </span>
                </div>
              </SelectableCard>
            ))}
          </div>
        </div>

        {/* Primary platform */}
        <div className="space-y-3">
          <label style={labelStyle}>Primary platform</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {platforms.map((p) => (
              <SelectableCard
                key={p.id}
                selected={formData.primary_platform === p.id}
                onClick={() => update("primary_platform", p.id)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div style={{ color: formData.primary_platform === p.id ? "#FF2D2D" : "#555" }}>
                    {p.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: formData.primary_platform === p.id ? "#FFFFFF" : "#A1A1A1",
                    }}
                  >
                    {p.label}
                  </span>
                </div>
              </SelectableCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStep2YourStory() {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 style={headingStyle}>Your story</h1>
          <p style={subtitleStyle}>
            This is what makes your scripts human. The more you share, the more emotionally specific your content becomes.
          </p>
        </div>

        {/* Backstory fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label style={labelStyle}>Your backstory *</label>
            <textarea
              value={formData.personal_bio}
              onChange={(e) => update("personal_bio", e.target.value)}
              rows={3}
              placeholder="In 2-4 sentences, who are you really? What drives you?"
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label style={labelStyle}>Early life</label>
            <textarea
              value={formData.early_life}
              onChange={(e) => update("early_life", e.target.value)}
              rows={2}
              placeholder="Where did you grow up? What shaped you early on?"
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label style={labelStyle}>Biggest struggle</label>
            <textarea
              value={formData.biggest_struggle}
              onChange={(e) => update("biggest_struggle", e.target.value)}
              rows={2}
              placeholder="The hard thing you overcame..."
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label style={labelStyle}>Defining moment</label>
            <textarea
              value={formData.defining_moment}
              onChange={(e) => update("defining_moment", e.target.value)}
              rows={2}
              placeholder="The pivot that changed everything..."
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Key Moments */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 style={sectionTitleStyle}>Key Moments *</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#555" }}>
              Share at least 3 moments that shaped who you are. Mix it up: a struggle, an achievement, a funny moment, a lesson learned.
            </p>
          </div>

          <div className="space-y-6">
            {stories.map((story, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-xl p-5"
                style={{ background: "#111111", border: "1px solid #1F1F1F" }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "#FAFAFA" }}>
                    Moment {idx + 1}
                  </span>
                  {stories.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setStories((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg p-1 transition-all hover:scale-[1.02]"
                      style={{ border: "1px solid #1F1F1F", background: "#0A0A0A", color: "#555", cursor: "pointer" }}
                      aria-label="Remove moment"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={story.title}
                  onChange={(e) => updateStory(idx, "title", e.target.value)}
                  placeholder="Give this moment a title"
                  className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
                  style={inputStyle}
                />

                <textarea
                  value={story.content}
                  onChange={(e) => updateStory(idx, "content", e.target.value)}
                  rows={4}
                  placeholder="Tell the story. Be specific: what happened, how it felt, what changed after..."
                  className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
                  style={inputStyle}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>Category</label>
                    <select
                      value={story.category}
                      onChange={(e) => updateStory(idx, "category", e.target.value)}
                      className="w-full rounded-lg px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                      style={{ ...inputStyle, appearance: "none" }}
                    >
                      <option value="">Select...</option>
                      {STORY_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>Emotion</label>
                    <select
                      value={story.emotion}
                      onChange={(e) => updateStory(idx, "emotion", e.target.value)}
                      className="w-full rounded-lg px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                      style={{ ...inputStyle, appearance: "none" }}
                    >
                      <option value="">Select...</option>
                      {STORY_EMOTIONS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>Time period</label>
                    <input
                      type="text"
                      value={story.time_period}
                      onChange={(e) => updateStory(idx, "time_period", e.target.value)}
                      placeholder="e.g. 2019"
                      className="w-full rounded-lg px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stories.length < 10 && (
            <button
              type="button"
              onClick={() => setStories((prev) => [...prev, createEmptyStory()])}
              className="rounded-lg px-4 py-2 transition-all duration-200 hover:border-[#FF2D2D] hover:scale-[1.02]"
              style={{
                border: "1px solid #333",
                color: "#A1A1A1",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              + Add another moment
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderStep0Instagram() {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 style={headingStyle}>Connect your Instagram</h1>
          <p style={subtitleStyle}>
            We&apos;ll download your latest reels and analyze how you speak, your hooks, tone, and content patterns to build your Voice DNA automatically.
          </p>
        </div>

        {/* Instagram handle */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label style={labelStyle}>Instagram handle</label>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center rounded-l-lg px-3 py-3"
                style={{ background: "#111111", border: "1px solid #1F1F1F", borderRight: "none", color: "#555" }}
              >
                <InstagramIcon />
              </div>
              <input
                type="text"
                value={formData.social_handles.instagram ?? ""}
                onChange={(e) =>
                  update("social_handles", { ...formData.social_handles, instagram: e.target.value })
                }
                placeholder="@username"
                className="flex-1 rounded-r-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid #1F1F1F" }}
          >
            <div className="flex items-start gap-3">
              <div style={{ color: "#00D4D4", marginTop: 2 }}>
                <SparkleIcon />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#FAFAFA", marginBottom: 4 }}>
                  What happens next
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888888", lineHeight: 1.5 }}>
                  While you fill in the next steps, we&apos;ll download your latest reels in the background and use AI to analyze your captions, hooks, tone, and vocabulary. By the time you reach Brand DNA, it&apos;ll be ready for review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              // Skip Instagram, go to About You
              transitionTo(stepIndex + 1);
            }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#555",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Skip — I&apos;ll fill in Brand DNA manually
          </button>
        </div>
      </div>
    );
  }

  function renderStep3BrandDNA() {
    const goalOptions = [
      { id: "grow_audience", label: "Grow my audience", icon: <ChartUpIcon /> },
      { id: "drive_sales", label: "Drive sales", icon: <DollarIcon /> },
      { id: "build_community", label: "Build community", icon: <CommunityIcon /> },
      { id: "establish_authority", label: "Establish authority", icon: <StarIcon /> },
      { id: "entertain", label: "Entertain", icon: <SparkleIcon /> },
    ];

    const isStillAnalyzing = !onAnalysisStart && analyzingPhase !== "idle" && analyzingPhase !== "done" && analyzingPhase !== "error";

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 style={headingStyle}>Your Brand DNA</h1>
          <p style={subtitleStyle}>
            {analyzingPhase === "done"
              ? "Here's your Voice DNA based on your content. Edit or add anything we missed."
              : isStillAnalyzing
                ? "We're still analyzing your content. You can start editing below — fields will auto-fill when ready."
                : "Define your voice, strategy, and audience."}
          </p>
        </div>

        {/* Still analyzing banner */}
        {isStillAnalyzing && (
          <div
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: "rgba(0, 212, 212, 0.08)", border: "1px solid rgba(0, 212, 212, 0.2)" }}
          >
            <SpinnerIcon size={20} color="#00D4D4" />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#00D4D4" }}>
              {analyzingPhase === "scraping"
                ? `Scraping reels${scrapePostsFound > 0 ? ` (${scrapePostsFound}/${reelsRequested})` : ""}...`
                : analyzingPhase === "transcribing"
                  ? `Transcribing reels (${reelsTranscribed}/${scrapePostsFound})...`
                  : analyzingPhase === "classifying"
                    ? `Classifying reels (${reelsClassified}/${scrapePostsFound})...`
                    : "Building your Brand DNA from all data..."}
            </p>
          </div>
        )}

        {/* Voice & Tone Section */}
        <div className="space-y-6">
          <h3 style={{ ...sectionTitleStyle, fontSize: "18px", color: "#FF2D2D" }}>Voice &amp; Tone</h3>

          {/* Niche */}
          <div className="space-y-3">
            <label style={labelStyle}>Your niche</label>
            <ChipWithCustom
              options={NICHE_OPTIONS}
              selected={formData.niche ? [formData.niche] : []}
              onToggle={(v) => update("niche", formData.niche === v ? "" : v)}
              color="red"
            />
          </div>

          {/* Tone descriptors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label style={labelStyle}>Words that describe your vibe</label>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: formData.tone_descriptors.length >= 3 ? "#00D4D4" : "#555",
                }}
              >
                {formData.tone_descriptors.length} selected
              </span>
            </div>
            <ChipWithCustom
              options={TONE_DESCRIPTOR_OPTIONS}
              selected={formData.tone_descriptors}
              onToggle={(v) => toggleArrayField("tone_descriptors", v)}
              color="teal"
            />
          </div>

          {/* Tone sliders */}
          <div className="space-y-5">
            <label style={labelStyle}>Tone sliders</label>
            <ToneSlider
              leftLabel="Formal"
              rightLabel="Casual"
              value={formData.tone_formality}
              onChange={(v) => update("tone_formality", v)}
            />
            <ToneSlider
              leftLabel="Serious"
              rightLabel="Playful"
              value={formData.tone_humor}
              onChange={(v) => update("tone_humor", v)}
            />
            <ToneSlider
              leftLabel="Authoritative"
              rightLabel="Approachable"
              value={formData.tone_authority}
              onChange={(v) => update("tone_authority", v)}
            />
          </div>

          {/* Creator archetype */}
          <div className="space-y-3">
            <label style={labelStyle}>Your creator archetype</label>
            <div className="grid grid-cols-1 gap-3">
              {ARCHETYPE_OPTIONS.map((arch) => (
                <SelectableCard
                  key={arch.id}
                  selected={formData.creator_archetype === arch.id}
                  onClick={() => update("creator_archetype", arch.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: formData.creator_archetype === arch.id ? "#FF2D2D" : "#FAFAFA",
                      }}
                    >
                      {arch.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        color: "#888888",
                      }}
                    >
                      {arch.description}
                    </span>
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy Section */}
        <div className="space-y-6">
          <h3 style={{ ...sectionTitleStyle, fontSize: "18px", color: "#00D4D4" }}>Strategy</h3>

          {/* Content pillars */}
          <div className="space-y-3">
            <label style={labelStyle}>What topics do you cover?</label>
            <ChipWithCustom
              options={CONTENT_PILLAR_OPTIONS}
              selected={formData.content_pillars}
              onToggle={(v) => toggleArrayField("content_pillars", v)}
              color="teal"
            />
          </div>

          {/* Content goal */}
          <div className="space-y-3">
            <label style={labelStyle}>What&apos;s your #1 content goal?</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {goalOptions.map((g) => (
                <SelectableCard
                  key={g.id}
                  selected={formData.content_goal === g.id}
                  onClick={() => update("content_goal", g.id)}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ color: formData.content_goal === g.id ? "#FF2D2D" : "#555" }}>
                      {g.icon}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: formData.content_goal === g.id ? "#FFFFFF" : "#A1A1A1",
                      }}
                    >
                      {g.label}
                    </span>
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>

          {/* Content formats */}
          <div className="space-y-3">
            <label style={labelStyle}>Preferred content formats</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMAT_OPTIONS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  selected={formData.content_formats.includes(f)}
                  onClick={() => toggleArrayField("content_formats", f)}
                  color="red"
                />
              ))}
            </div>
          </div>

          {/* Preferred CTA */}
          <div className="space-y-3">
            <label style={labelStyle}>Your go-to call to action</label>
            <div className="flex flex-wrap gap-2">
              {CTA_OPTIONS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={formData.preferred_cta.includes(c)}
                  onClick={() => toggleArrayField("preferred_cta", c)}
                  color="teal"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Audience Section */}
        <div className="space-y-6">
          <h3 style={{ ...sectionTitleStyle, fontSize: "18px", color: "#FF2D2D" }}>Audience</h3>

          {/* Target audience */}
          <div className="space-y-2">
            <label style={labelStyle}>Who&apos;s your target audience?</label>
            <textarea
              value={formData.target_audience}
              onChange={(e) => update("target_audience", e.target.value)}
              rows={2}
              placeholder="e.g., Young entrepreneurs who want to grow their personal brand on social media"
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>

          {/* Audience problem */}
          <div className="space-y-2">
            <label style={labelStyle}>What problem do you solve for them?</label>
            <textarea
              value={formData.audience_problem}
              onChange={(e) => update("audience_problem", e.target.value)}
              rows={2}
              placeholder="e.g., They struggle to grow on social media and want actionable advice..."
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>

          {/* Audience age ranges */}
          <div className="space-y-3">
            <label style={labelStyle}>Audience age range</label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGE_OPTIONS.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={formData.audience_age_ranges.includes(a)}
                  onClick={() => toggleArrayField("audience_age_ranges", a)}
                  color="red"
                />
              ))}
            </div>
          </div>

          {/* Audience gender */}
          <div className="space-y-3">
            <label style={labelStyle}>Audience gender</label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  selected={formData.audience_gender === g}
                  onClick={() => update("audience_gender", formData.audience_gender === g ? "" : g)}
                  color="teal"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="space-y-6">
          <h3 style={{ ...sectionTitleStyle, fontSize: "18px", color: "#00D4D4" }}>Values</h3>

          {/* Values */}
          <div className="space-y-3">
            <label style={labelStyle}>Your core values</label>
            <ChipWithCustom
              options={VALUE_OPTIONS}
              selected={formData.values}
              onToggle={(v) => toggleArrayField("values", v)}
              color="teal"
            />
          </div>

          {/* Unique value prop */}
          <div className="space-y-2">
            <label style={labelStyle}>What makes you different?</label>
            <textarea
              value={formData.unique_value_prop}
              onChange={(e) => update("unique_value_prop", e.target.value)}
              rows={3}
              placeholder="e.g., I break down complex marketing strategies into 60-second videos..."
              className="w-full rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep4Launch() {
    const archLabel =
      ARCHETYPE_OPTIONS.find((a) => a.id === formData.creator_archetype)?.label ??
      formData.creator_archetype;

    const toneWords = [
      toneSummaryLabel(formData.tone_formality, "Formal", "Casual"),
      toneSummaryLabel(formData.tone_humor, "Serious", "Playful"),
      toneSummaryLabel(formData.tone_authority, "Authoritative", "Approachable"),
    ];

    const goalLabel = CONTENT_GOAL_OPTIONS.find((g) => g.id === formData.content_goal)?.label ?? formData.content_goal;

    const filledStories = stories.filter((s) => s.title.trim() && s.content.trim());

    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div style={{ animation: "scaleIn 0.5s ease-out" }}>
            <CheckCircleIcon />
          </div>
          <h1 style={headingStyle}>You&apos;re all set!</h1>
          <p style={subtitleStyle}>Here&apos;s a summary of your profile. Hit Launch to get started.</p>
        </div>

        {/* Summary card */}
        <div
          className="space-y-5 rounded-xl p-6"
          style={{ background: "#111111", border: "1px solid #1F1F1F" }}
        >
          <h3 style={{ ...sectionTitleStyle, fontSize: "18px" }}>Your Brand DNA</h3>

          <div className="space-y-4">
            {/* Name, archetype, niche */}
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Name</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#FAFAFA" }}>
                  {formData.display_name}
                </p>
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Archetype</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#FAFAFA" }}>
                  {archLabel}
                </p>
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Niche</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#FAFAFA" }}>
                  {formData.niche}
                </p>
              </div>
            </div>

            {/* Tone */}
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Voice</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {formData.tone_descriptors.map((td) => (
                  <span
                    key={td}
                    className="rounded-full px-3 py-1"
                    style={{
                      background: "rgba(0, 212, 212, 0.15)",
                      border: "1px solid #00D4D4",
                      color: "#00D4D4",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                    }}
                  >
                    {td}
                  </span>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Style</span>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
                {toneWords.join(" \u2022 ")}
              </p>
            </div>

            {/* Content goal */}
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Content goal</span>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#FAFAFA" }}>
                {goalLabel}
              </p>
            </div>

            {/* Content pillars */}
            {formData.content_pillars.length > 0 && (
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Content pillars</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {formData.content_pillars.map((p) => (
                    <span
                      key={p}
                      className="rounded-full px-3 py-1"
                      style={{
                        background: "rgba(255, 45, 45, 0.15)",
                        border: "1px solid #FF2D2D",
                        color: "#FF2D2D",
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Audience */}
            {formData.target_audience && (
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Target audience</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
                  {formData.target_audience}
                </p>
              </div>
            )}

            {/* Values */}
            {formData.values.length > 0 && (
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>Values</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
                  {formData.values.join(", ")}
                </p>
              </div>
            )}

            {/* UVP */}
            {formData.unique_value_prop && (
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}>What makes you different</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
                  {formData.unique_value_prop}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stories summary */}
        {filledStories.length > 0 && (
          <div
            className="space-y-4 rounded-xl p-6"
            style={{ background: "#111111", border: "1px solid #1F1F1F" }}
          >
            <h3 style={{ ...sectionTitleStyle, fontSize: "18px" }}>Your Key Moments ({filledStories.length})</h3>
            <div className="space-y-3">
              {filledStories.map((story, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      minWidth: 28,
                      background: "rgba(0, 212, 212, 0.15)",
                      border: "1px solid #00D4D4",
                      color: "#00D4D4",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "#FAFAFA" }}>
                      {story.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888888", marginTop: 2 }}>
                      {story.content.length > 120 ? story.content.slice(0, 120) + "..." : story.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Launch button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => saveProfile()}
            disabled={saving}
            className="rounded-lg px-8 py-3 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FF2D2D, #FF4444)",
              color: "#fff",
              fontFamily: "var(--font-heading)",
              fontSize: "16px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            {saving ? "Launching..." : "Launch"}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const isLaunchStep = mode === "onboarding" && currentStep === 4;
  const showNav = !isLaunchStep;

  const isLastFormStep =
    mode === "edit"
      ? stepIndex === totalSteps - 1
      : false; // In onboarding, launch step handles its own save

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Toast notification (top-right) — hidden when analysis screen handles it */}
      {!onAnalysisStart && toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-5 py-3 shadow-lg"
          style={{
            background: "#1A1A1A",
            border: "1px solid #2A2A2A",
            color: "#FAFAFA",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            maxWidth: 360,
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div className="flex items-center gap-3">
            {analyzingPhase !== "idle" && analyzingPhase !== "done" && analyzingPhase !== "error" && (
              <SpinnerIcon size={16} color="#00D4D4" />
            )}
            {analyzingPhase === "done" && (
              <span style={{ color: "#00D4D4" }}>&#10003;</span>
            )}
            {analyzingPhase === "error" && (
              <span style={{ color: "#FF2D2D" }}>!</span>
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Progress bar (not shown on launch) */}
      {!isLaunchStep && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#6B6B6B",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#FF2D2D",
                fontWeight: 500,
              }}
            >
              {STEP_LABELS[currentStep]}
            </span>
          </div>
          <div className="h-1 w-full rounded-full" style={{ background: "#161616" }}>
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((stepIndex + 1) / totalSteps) * 100
                }%`,
                background: "linear-gradient(90deg, #FF2D2D, #00D4D4)",
              }}
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
            />
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="rounded-lg px-4 py-3"
          style={{
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Step content with fade */}
      <form onSubmit={handleEditSubmit}>
        <div
          className="transition-opacity duration-150"
          style={{ opacity: fadeState === "in" ? 1 : 0 }}
        >
          {currentStep === 0 && renderStep0Instagram()}
          {currentStep === 1 && renderStep1AboutYou()}
          {currentStep === 2 && renderStep2YourStory()}
          {currentStep === 3 && renderStep3BrandDNA()}
          {currentStep === 4 && renderStep4Launch()}
        </div>

        {/* Navigation */}
        {showNav && (
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="rounded-lg px-4 py-2 transition-all duration-200 hover:border-[#FF2D2D] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                border: "1px solid #333",
                color: "#A1A1A1",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                background: "transparent",
              }}
            >
              Back
            </button>

            {mode === "edit" && isLastFormStep ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg px-6 py-2 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#FF2D2D",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="rounded-lg px-6 py-2 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#FF2D2D",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {saving ? "Saving..." : "Next"}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
