import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { buildScriptPrompt } from "@/lib/prompts";
import type { Platform, ScriptStyle, ScriptBody } from "@/types/database";

const VALID_PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "linkedin",
  "twitter",
];
const VALID_STYLES: ScriptStyle[] = ["short", "medium", "long"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    topic?: string;
    niche_id?: string;
    platform?: string;
    script_style?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { topic, niche_id, platform, script_style } = body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json(
      { error: "Topic is required" },
      { status: 400 }
    );
  }

  if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json(
      { error: "Valid platform is required (instagram, tiktok, linkedin, twitter)" },
      { status: 400 }
    );
  }

  if (!script_style || !VALID_STYLES.includes(script_style as ScriptStyle)) {
    return NextResponse.json(
      { error: "Valid script_style is required (short, medium, long)" },
      { status: 400 }
    );
  }

  // Fetch brand profile
  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Query top 10 content items matching niche, sorted by virality_score
  let contentQuery = supabase
    .from("content")
    .select("*")
    .eq("user_id", user.id)
    .order("virality_score", { ascending: false, nullsFirst: false })
    .limit(10);

  if (niche_id) {
    // Get content that has tags matching the niche
    const { data: niche } = await supabase
      .from("niches")
      .select("name")
      .eq("id", niche_id)
      .eq("user_id", user.id)
      .single();

    if (niche) {
      const { data: taggedContentIds } = await supabase
        .from("content_tags")
        .select("content_id")
        .eq("tag", niche.name)
        .eq("category", "niche");

      if (taggedContentIds && taggedContentIds.length > 0) {
        contentQuery = contentQuery.in(
          "id",
          taggedContentIds.map((t) => t.content_id)
        );
      }
    }
  }

  const { data: topContent } = await contentQuery;

  // Build prompt and call Claude
  const prompt = buildScriptPrompt({
    topic: topic.trim(),
    platform: platform as Platform,
    scriptStyle: script_style as ScriptStyle,
    brandProfile: brandProfile ?? null,
    topContent: topContent ?? [],
  });

  let scriptBody: ScriptBody;
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const parsed = JSON.parse(textBlock.text);
    if (!parsed.hook || !parsed.body || !parsed.cta) {
      throw new Error("Invalid script structure");
    }
    scriptBody = {
      hook: String(parsed.hook),
      body: String(parsed.body),
      cta: String(parsed.cta),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Script generation failed";
    return NextResponse.json(
      { error: `Failed to generate script: ${message}` },
      { status: 502 }
    );
  }

  // Auto-generate title from topic
  const title =
    topic.trim().length > 60
      ? topic.trim().slice(0, 57) + "..."
      : topic.trim();

  // Save to scripts table
  const { data: script, error: insertError } = await supabase
    .from("scripts")
    .insert({
      user_id: user.id,
      title,
      topic: topic.trim(),
      script_body: JSON.stringify(scriptBody),
      niche_id: niche_id || null,
      platform,
      script_style,
      source_content_ids: topContent?.map((c) => c.id) ?? [],
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save script" },
      { status: 500 }
    );
  }

  return NextResponse.json(script, { status: 201 });
}
