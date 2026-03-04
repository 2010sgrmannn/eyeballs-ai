import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CanvasNodeType } from "@/types/database";

const VALID_NODE_TYPES: CanvasNodeType[] = [
  "backstory",
  "content_folder",
  "product",
  "youtube",
  "ai_chat",
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
    .from("canvas_nodes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

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
  const { node_type, position_x, position_y, width, height, data: nodeData, label } = body;

  if (!node_type || !VALID_NODE_TYPES.includes(node_type)) {
    return NextResponse.json(
      { error: `node_type must be one of: ${VALID_NODE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("canvas_nodes")
    .insert({
      user_id: user.id,
      node_type,
      position_x: position_x ?? 0,
      position_y: position_y ?? 0,
      width: width ?? 280,
      height: height ?? 200,
      data: nodeData ?? {},
      label: label ?? null,
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
  const { id, position_x, position_y, width, height, data: nodeData, label } = body;

  if (!id) {
    return NextResponse.json({ error: "Node id is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("canvas_nodes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (position_x !== undefined) updates.position_x = position_x;
  if (position_y !== undefined) updates.position_y = position_y;
  if (width !== undefined) updates.width = width;
  if (height !== undefined) updates.height = height;
  if (nodeData !== undefined) updates.data = nodeData;
  if (label !== undefined) updates.label = label;

  const { data, error } = await supabase
    .from("canvas_nodes")
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
    return NextResponse.json({ error: "Node id is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("canvas_nodes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("canvas_nodes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
