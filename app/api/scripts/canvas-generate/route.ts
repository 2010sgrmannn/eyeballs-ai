import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { buildCanvasPrompt } from "@/lib/prompts";
import type { Platform, ScriptStyle, Content, Product, CreatorStory } from "@/types/database";

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
    platform?: string;
    script_style?: string;
    folder_id?: string;
    product_ids?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { topic, platform, script_style, folder_id, product_ids } = body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json(
      { error: "Topic is required" },
      { status: 400 }
    );
  }

  if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json(
      {
        error:
          "Valid platform is required (instagram, tiktok, linkedin, twitter)",
      },
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

  // Fetch reference content
  let referenceContent: Content[] = [];

  if (folder_id) {
    // Get content from the specified folder via folder_items join
    const { data: folderItems } = await supabase
      .from("folder_items")
      .select("content_id")
      .eq("folder_id", folder_id);

    if (folderItems && folderItems.length > 0) {
      const { data: content } = await supabase
        .from("content")
        .select("*")
        .in(
          "id",
          folderItems.map((fi) => fi.content_id)
        )
        .eq("user_id", user.id)
        .order("virality_score", { ascending: false, nullsFirst: false });

      referenceContent = (content as Content[]) ?? [];
    }
  } else {
    // No folder specified -- get top 10 by virality_score
    const { data: content } = await supabase
      .from("content")
      .select("*")
      .eq("user_id", user.id)
      .order("virality_score", { ascending: false, nullsFirst: false })
      .limit(10);

    referenceContent = (content as Content[]) ?? [];
  }

  // Fetch products if product_ids provided
  let products: Product[] = [];

  if (product_ids && product_ids.length > 0) {
    const { data: fetchedProducts } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .in("id", product_ids);

    products = (fetchedProducts as Product[]) ?? [];
  }

  // Fetch creator stories (limit 10, ordered by sort_order)
  const { data: creatorStories } = await supabase
    .from("creator_stories")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .limit(10);

  // Build prompt and call Claude
  const prompt = buildCanvasPrompt({
    topic: topic.trim(),
    platform: platform as Platform,
    scriptStyle: script_style as ScriptStyle,
    brandProfile: brandProfile ?? null,
    referenceContent,
    products,
    creatorStories: (creatorStories as CreatorStory[]) ?? [],
  });

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 1.0,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const parsed = JSON.parse(textBlock.text);
    if (!Array.isArray(parsed) || parsed.length !== 5) {
      throw new Error("Expected array of 5 scripts");
    }

    // Validate each script
    const scripts = parsed.map(
      (
        s: { style_label?: string; hook?: string; body?: string; cta?: string },
        i: number
      ) => {
        if (!s.hook || !s.body || !s.cta) {
          throw new Error(`Invalid script structure at index ${i}`);
        }
        return {
          style_label: String(s.style_label || ""),
          hook: String(s.hook),
          body: String(s.body),
          cta: String(s.cta),
        };
      }
    );

    return NextResponse.json({ scripts }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Script generation failed";
    return NextResponse.json(
      { error: `Failed to generate scripts: ${message}` },
      { status: 502 }
    );
  }
}
