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

  const { data, error } = await supabase
    .from("canvas_edges")
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
  const { source_node_id, target_node_id, edge_type, animated } = body;

  if (!source_node_id || !target_node_id) {
    return NextResponse.json(
      { error: "source_node_id and target_node_id are required" },
      { status: 400 }
    );
  }

  if (source_node_id === target_node_id) {
    return NextResponse.json(
      { error: "Cannot connect a node to itself" },
      { status: 400 }
    );
  }

  // Check for duplicate edge
  const { data: duplicate } = await supabase
    .from("canvas_edges")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_node_id", source_node_id)
    .eq("target_node_id", target_node_id)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: "Connection already exists" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("canvas_edges")
    .insert({
      user_id: user.id,
      source_node_id,
      target_node_id,
      edge_type: edge_type ?? "default",
      animated: animated ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
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
    return NextResponse.json({ error: "Edge id is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("canvas_edges")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Edge not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("canvas_edges")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
