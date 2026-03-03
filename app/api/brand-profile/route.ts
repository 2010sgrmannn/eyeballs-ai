import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(null, { status: 200 });
  }

  return NextResponse.json(profile);
}

const ALLOWED_FIELDS = [
  "display_name", "creator_type", "primary_platform", "niche",
  "tone_descriptors", "tone_formality", "tone_humor", "tone_authority",
  "creator_archetype", "sample_content", "content_pillars", "content_goal",
  "content_formats", "preferred_cta", "values", "target_audience",
  "audience_problem", "audience_age_ranges", "audience_gender",
  "unique_value_prop", "brand_voice", "content_style",
  "birth_year", "location", "personal_bio", "fun_facts", "languages",
  "early_life", "biggest_struggle", "defining_moment",
] as const;

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only allow known fields
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brand_profiles")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
