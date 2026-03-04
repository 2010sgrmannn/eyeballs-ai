import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Platform, ScriptStyle } from "@/types/database";

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
    style_label?: string;
    hook?: string;
    body?: string;
    cta?: string;
    source_folder_id?: string;
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

  const {
    topic,
    platform,
    script_style,
    style_label,
    hook,
    body: scriptBody,
    cta,
    source_folder_id,
    product_ids,
  } = body;

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

  if (!hook || !scriptBody || !cta) {
    return NextResponse.json(
      { error: "hook, body, and cta are required" },
      { status: 400 }
    );
  }

  // Build title from style_label + topic
  const labelPrefix = style_label ? `${style_label}: ` : "";
  const rawTitle = `${labelPrefix}${topic.trim()}`;
  const title =
    rawTitle.length > 60 ? rawTitle.slice(0, 57) + "..." : rawTitle;

  // Build the script_body JSON
  const scriptBodyJson = JSON.stringify({
    hook: String(hook),
    body: String(scriptBody),
    cta: String(cta),
  });

  // Get source content IDs from folder if provided
  let sourceContentIds: string[] = [];
  if (source_folder_id) {
    const { data: folderItems } = await supabase
      .from("folder_items")
      .select("content_id")
      .eq("folder_id", source_folder_id);

    if (folderItems) {
      sourceContentIds = folderItems.map((fi) => fi.content_id);
    }
  }

  // Save to scripts table
  const { data: script, error: insertError } = await supabase
    .from("scripts")
    .insert({
      user_id: user.id,
      title,
      topic: topic.trim(),
      script_body: scriptBodyJson,
      platform,
      script_style,
      source_content_ids: sourceContentIds.length > 0 ? sourceContentIds : [],
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
