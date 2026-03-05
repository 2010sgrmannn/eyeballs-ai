import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // Try update first (most common case — profile exists from onboarding)
  const { data: updated, error: updateError } = await supabase
    .from("brand_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If update returned a row, we're done
  if (updated) {
    return NextResponse.json(updated);
  }

  // No row existed — insert a new one
  const { data: inserted, error: insertError } = await supabase
    .from("brand_profiles")
    .insert({ user_id: user.id, ...updates })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(inserted);
}
