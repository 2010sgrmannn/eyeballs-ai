"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { BrandProfileFormData } from "@/types/brand-profile";

const NICHE_OPTIONS = [
  "Fitness",
  "Business",
  "Tech",
  "Lifestyle",
  "Finance",
  "Health & Wellness",
  "Education",
  "Entertainment",
  "Food & Cooking",
  "Travel",
];

const VOICE_PRESETS = [
  { label: "Casual & Witty", description: "Lighthearted, conversational, uses humor" },
  { label: "Professional & Direct", description: "Clear, authoritative, no-nonsense" },
  { label: "Motivational & Raw", description: "Intense, authentic, pushes people to act" },
  { label: "Educational & Calm", description: "Thoughtful, patient, teaches step by step" },
];

const VALUE_OPTIONS = [
  "Authenticity",
  "Hustle",
  "Mindfulness",
  "Community",
  "Growth",
  "Creativity",
  "Discipline",
  "Freedom",
  "Impact",
  "Innovation",
];

const STEP_TITLES = [
  "Your Niche",
  "Brand Voice",
  "Core Values",
  "Target Audience",
];

interface BrandProfileFormProps {
  initialData?: BrandProfileFormData;
  mode: "onboarding" | "edit";
}

export function BrandProfileForm({ initialData, mode }: BrandProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BrandProfileFormData>(
    initialData ?? {
      niche: "",
      brand_voice: "",
      values: [],
      target_audience: "",
      content_style: "",
    }
  );
  const [customNiche, setCustomNiche] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  function handleNext() {
    setError(null);

    if (currentStep === 0 && !formData.niche.trim()) {
      setError("Please select or enter a niche");
      return;
    }
    if (currentStep === 1 && !formData.brand_voice.trim()) {
      setError("Please describe your brand voice");
      return;
    }
    if (currentStep === 2 && formData.values.length === 0) {
      setError("Please select at least one value");
      return;
    }

    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function selectNiche(niche: string) {
    setFormData((prev) => ({ ...prev, niche }));
    setCustomNiche("");
  }

  function handleCustomNiche() {
    if (customNiche.trim()) {
      setFormData((prev) => ({ ...prev, niche: customNiche.trim() }));
    }
  }

  function selectVoicePreset(preset: string) {
    setFormData((prev) => ({ ...prev, content_style: preset, brand_voice: prev.brand_voice }));
  }

  function toggleValue(value: string) {
    setFormData((prev) => {
      const exists = prev.values.includes(value);
      return {
        ...prev,
        values: exists
          ? prev.values.filter((v) => v !== value)
          : [...prev.values, value],
      };
    });
  }

  function addCustomValue() {
    const trimmed = customValue.trim();
    if (trimmed && !formData.values.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, values: [...prev.values, trimmed] }));
      setCustomValue("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.target_audience.trim()) {
      setError("Please describe your target audience");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in");
        return;
      }

      if (mode === "onboarding") {
        const { error: insertError } = await supabase
          .from("brand_profiles")
          .insert({
            user_id: user.id,
            niche: formData.niche,
            brand_voice: formData.brand_voice,
            values: formData.values,
            target_audience: formData.target_audience,
            content_style: formData.content_style,
          });

        if (insertError) {
          setError(insertError.message);
          return;
        }
      } else {
        const { error: updateError } = await supabase
          .from("brand_profiles")
          .update({
            niche: formData.niche,
            brand_voice: formData.brand_voice,
            values: formData.values,
            target_audience: formData.target_audience,
            content_style: formData.content_style,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{STEP_TITLES[currentStep]}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-800">
          <div
            className="h-2 rounded-full bg-white transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Niche */}
        {currentStep === 0 && (
          <div className="space-y-4" data-testid="step-niche">
            <h2 className="text-xl font-semibold">What is your niche?</h2>
            <p className="text-sm text-neutral-400">
              Select a niche or type your own. This helps us understand your content focus.
            </p>
            <div className="flex flex-wrap gap-2">
              {NICHE_OPTIONS.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => selectNiche(niche)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    formData.niche === niche
                      ? "border-white bg-white text-neutral-950"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                onBlur={handleCustomNiche}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCustomNiche();
                  }
                }}
                placeholder="Or type your own niche..."
                className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
            </div>
            {formData.niche && !NICHE_OPTIONS.includes(formData.niche) && (
              <p className="text-sm text-neutral-400">
                Selected: <span className="text-white">{formData.niche}</span>
              </p>
            )}
          </div>
        )}

        {/* Step 2: Brand Voice */}
        {currentStep === 1 && (
          <div className="space-y-4" data-testid="step-voice">
            <h2 className="text-xl font-semibold">Describe your brand voice</h2>
            <p className="text-sm text-neutral-400">
              How do you talk to your audience? Are you casual or professional? Funny or serious?
              Motivational or educational?
            </p>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectVoicePreset(preset.label)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    formData.content_style === preset.label
                      ? "border-white bg-white text-neutral-950"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={formData.brand_voice}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, brand_voice: e.target.value }))
              }
              rows={4}
              placeholder="Describe how you communicate with your audience in your own words..."
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
        )}

        {/* Step 3: Core Values */}
        {currentStep === 2 && (
          <div className="space-y-4" data-testid="step-values">
            <h2 className="text-xl font-semibold">What do you stand for?</h2>
            <p className="text-sm text-neutral-400">
              Select the values that resonate with your brand. You can also add your own.
            </p>
            <div className="flex flex-wrap gap-2">
              {VALUE_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleValue(value)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    formData.values.includes(value)
                      ? "border-white bg-white text-neutral-950"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            {/* Custom values */}
            {formData.values
              .filter((v) => !VALUE_OPTIONS.includes(v))
              .map((v) => (
                <span
                  key={v}
                  className="mr-2 inline-flex items-center gap-1 rounded-full border border-white bg-white px-4 py-2 text-sm text-neutral-950"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => toggleValue(v)}
                    className="ml-1 text-neutral-600 hover:text-neutral-950"
                    aria-label={`Remove ${v}`}
                  >
                    x
                  </button>
                </span>
              ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomValue();
                  }
                }}
                placeholder="Add a custom value..."
                className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
              <button
                type="button"
                onClick={addCustomValue}
                className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Target Audience */}
        {currentStep === 3 && (
          <div className="space-y-4" data-testid="step-audience">
            <h2 className="text-xl font-semibold">Who are you creating for?</h2>
            <p className="text-sm text-neutral-400">
              Describe your target audience: their age range, interests, pain points, and what
              they are looking for.
            </p>
            <textarea
              value={formData.target_audience}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, target_audience: e.target.value }))
              }
              rows={6}
              placeholder="e.g., 25-35 year old entrepreneurs who are struggling to grow their social media presence and want actionable, no-fluff advice..."
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : mode === "onboarding"
                  ? "Complete"
                  : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
