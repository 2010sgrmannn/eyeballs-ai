import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandProfileForm } from "@/components/brand-profile-form";
import type { BrandProfileFormData } from "@/types/brand-profile";
import { ProfileView } from "./profile-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select(
      "display_name, creator_type, primary_platform, social_handles, inspiration_handles, niche, tone_descriptors, tone_formality, tone_humor, tone_authority, creator_archetype, sample_content, content_pillars, content_goal, content_formats, preferred_cta, values, target_audience, audience_problem, audience_age_ranges, audience_gender, unique_value_prop, brand_voice, content_style, birth_year, location, personal_bio, fun_facts, languages, early_life, biggest_struggle, defining_moment, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .single();

  const initialData: BrandProfileFormData | undefined = profile
    ? {
        display_name: profile.display_name ?? "",
        creator_type: profile.creator_type ?? "",
        primary_platform: profile.primary_platform ?? "",
        social_handles: profile.social_handles ?? {},
        inspiration_handles: profile.inspiration_handles ?? [],
        niche: profile.niche ?? "",
        tone_descriptors: profile.tone_descriptors ?? [],
        tone_formality: profile.tone_formality ?? 3,
        tone_humor: profile.tone_humor ?? 3,
        tone_authority: profile.tone_authority ?? 3,
        creator_archetype: profile.creator_archetype ?? "",
        sample_content: profile.sample_content ?? "",
        content_pillars: profile.content_pillars ?? [],
        content_goal: profile.content_goal ?? "",
        content_formats: profile.content_formats ?? [],
        preferred_cta: profile.preferred_cta ?? [],
        values: profile.values ?? [],
        target_audience: profile.target_audience ?? "",
        audience_problem: profile.audience_problem ?? "",
        audience_age_ranges: profile.audience_age_ranges ?? [],
        audience_gender: profile.audience_gender ?? "",
        unique_value_prop: profile.unique_value_prop ?? "",
        birth_year: profile.birth_year ?? null,
        location: profile.location ?? "",
        personal_bio: profile.personal_bio ?? "",
        fun_facts: profile.fun_facts ?? [],
        languages: profile.languages ?? [],
        early_life: profile.early_life ?? "",
        biggest_struggle: profile.biggest_struggle ?? "",
        defining_moment: profile.defining_moment ?? "",
        brand_voice: profile.brand_voice ?? "",
        content_style: profile.content_style ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 700, color: "#FFFFFF" }}
        >
          Settings
        </h1>
        <p
          className="mt-2"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
        >
          Your brand profile and account preferences.
        </p>
      </div>

      {/* Account info */}
      <div className="mb-8 p-6 rounded-xl glass-card">
        <h2
          className="mb-4"
          style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}
        >
          Account
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#FAFAFA" }}>
              {user.email}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B6B6B" }}>
              Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Brand profile */}
      {initialData ? (
        <ProfileView
          profile={initialData}
          updatedAt={profile?.updated_at || profile?.created_at}
        />
      ) : (
        <div className="p-6 rounded-xl glass-card">
          <p
            className="mb-4"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
          >
            No brand profile yet. Set one up to get personalized scripts.
          </p>
          <BrandProfileForm mode="onboarding" />
        </div>
      )}
    </div>
  );
}
