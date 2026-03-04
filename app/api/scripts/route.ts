import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: scripts, error } = await supabase
    .from("scripts")
    .select("*, niche:niches(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }

  return NextResponse.json(scripts);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    topic?: string;
    script_body?: string;
    niche_id?: string;
    platform?: string;
    script_style?: string;
    source_content_ids?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { title, topic, script_body, niche_id, platform, script_style, source_content_ids } = body;

  if (!script_body) {
    return NextResponse.json(
      { error: "script_body is required" },
      { status: 400 }
    );
  }

  const { data: script, error } = await supabase
    .from("scripts")
    .insert({
      user_id: user.id,
      title: title || null,
      topic: topic || null,
      script_body,
      niche_id: niche_id || null,
      platform: platform || null,
      script_style: script_style || null,
      source_content_ids: source_content_ids || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save script" },
      { status: 500 }
    );
  }

  return NextResponse.json(script, { status: 201 });
}
