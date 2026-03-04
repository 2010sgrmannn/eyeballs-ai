import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StoryEmotion, StoryCategory } from "@/types/database";

const VALID_EMOTIONS: StoryEmotion[] = [
  "shame", "pride", "fear", "relief", "anger", "joy", "surprise", "frustration",
];
const VALID_CATEGORIES: StoryCategory[] = [
  "struggle", "achievement", "childhood", "relationship", "career", "turning_point", "funny", "lesson",
];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creator_stories")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, emotion, category, time_period, sort_order } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (emotion && !VALID_EMOTIONS.includes(emotion)) {
    return NextResponse.json({ error: `Emotion must be one of: ${VALID_EMOTIONS.join(", ")}` }, { status: 400 });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("creator_stories")
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      emotion: emotion || null,
      category: category || null,
      time_period: time_period?.trim() || null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, content, emotion, category, time_period, sort_order } = body;

  if (!id) {
    return NextResponse.json({ error: "Story id is required" }, { status: 400 });
  }

  // Validate ownership
  const { data: existing } = await supabase
    .from("creator_stories")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  if (emotion && !VALID_EMOTIONS.includes(emotion)) {
    return NextResponse.json({ error: `Emotion must be one of: ${VALID_EMOTIONS.join(", ")}` }, { status: 400 });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.content = content.trim();
  if (emotion !== undefined) updates.emotion = emotion || null;
  if (category !== undefined) updates.category = category || null;
  if (time_period !== undefined) updates.time_period = time_period?.trim() || null;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("creator_stories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Story id is required" }, { status: 400 });
  }

  // Validate ownership
  const { data: existing } = await supabase
    .from("creator_stories")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("creator_stories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
