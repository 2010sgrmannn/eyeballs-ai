export interface BrandProfileFormData {
  // Step 1: Welcome
  display_name: string;
  creator_type: "solo_creator" | "brand" | "agency" | "";
  primary_platform: string;

  // Step 2: Connect & Inspire
  social_handles: Record<string, string>; // { instagram: "handle", tiktok: "handle" }
  inspiration_handles: string[];

  // Step 3: Voice & Style
  niche: string;
  tone_descriptors: string[];
  tone_formality: number; // 1-5
  tone_humor: number; // 1-5
  tone_authority: number; // 1-5
  creator_archetype: string;
  sample_content: string;

  // Step 4: Content Strategy & Audience
  content_pillars: string[];
  content_goal: string;
  content_formats: string[];
  preferred_cta: string[];
  values: string[];
  target_audience: string;
  audience_problem: string;
  audience_age_ranges: string[];
  audience_gender: string;
  unique_value_prop: string;

  // Step 5: Your Story (optional)
  birth_year: number | null;
  location: string;
  personal_bio: string;
  fun_facts: string[];
  languages: string[];
  early_life: string;
  biggest_struggle: string;
  defining_moment: string;

  // Legacy (kept for backwards compat)
  brand_voice: string;
  content_style: string;
}

export const DEFAULT_FORM_DATA: BrandProfileFormData = {
  display_name: "",
  creator_type: "",
  primary_platform: "",
  social_handles: {},
  inspiration_handles: [],
  niche: "",
  tone_descriptors: [],
  tone_formality: 3,
  tone_humor: 3,
  tone_authority: 3,
  creator_archetype: "",
  sample_content: "",
  content_pillars: [],
  content_goal: "",
  content_formats: [],
  preferred_cta: [],
  values: [],
  target_audience: "",
  audience_problem: "",
  audience_age_ranges: [],
  audience_gender: "",
  unique_value_prop: "",
  birth_year: null,
  location: "",
  personal_bio: "",
  fun_facts: [],
  languages: [],
  early_life: "",
  biggest_struggle: "",
  defining_moment: "",
  brand_voice: "",
  content_style: "",
};

export interface BrandProfile extends BrandProfileFormData {
  id: string;
  user_id: string;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandDNAAnalysis {
  niche: string;
  tone_descriptors: string[];
  tone_formality: number;
  tone_humor: number;
  tone_authority: number;
  creator_archetype: string;
  content_pillars: string[];
  content_goal: string;
  content_formats: string[];
  preferred_cta: string[];
  values: string[];
  target_audience: string;
  audience_problem: string;
  audience_age_ranges: string[];
  audience_gender: string;
  unique_value_prop: string;
}
