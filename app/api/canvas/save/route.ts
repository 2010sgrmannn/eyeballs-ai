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

interface NodePayload {
  id?: string;
  node_type: CanvasNodeType;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  data?: Record<string, unknown>;
  label?: string;
}

interface EdgePayload {
  id?: string;
  source_node_id: string;
  target_node_id: string;
  edge_type?: string;
  animated?: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { canvas_id?: string; nodes?: NodePayload[]; edges?: EdgePayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { canvas_id, nodes = [], edges = [] } = body;

  if (!canvas_id) {
    return NextResponse.json({ error: "canvas_id is required" }, { status: 400 });
  }

  // Verify canvas ownership
  const { data: canvas } = await supabase
    .from("canvases")
    .select("id")
    .eq("id", canvas_id)
    .eq("user_id", user.id)
    .single();

  if (!canvas) {
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }

  // Validate node types
  for (const node of nodes) {
    if (!VALID_NODE_TYPES.includes(node.node_type)) {
      return NextResponse.json(
        { error: `Invalid node_type: ${node.node_type}` },
        { status: 400 }
      );
    }
  }

  // Get current state scoped by canvas_id
  const { data: existingNodes } = await supabase
    .from("canvas_nodes")
    .select("id")
    .eq("canvas_id", canvas_id)
    .eq("user_id", user.id);

  const { data: existingEdges } = await supabase
    .from("canvas_edges")
    .select("id")
    .eq("canvas_id", canvas_id)
    .eq("user_id", user.id);

  const existingNodeIds = new Set((existingNodes ?? []).map((n) => n.id));
  const existingEdgeIds = new Set((existingEdges ?? []).map((e) => e.id));

  const incomingNodeIds = new Set(nodes.filter((n) => n.id).map((n) => n.id));
  const incomingEdgeIds = new Set(edges.filter((e) => e.id).map((e) => e.id));

  // Delete removed nodes (edges cascade automatically)
  const nodesToDelete = [...existingNodeIds].filter((id) => !incomingNodeIds.has(id));
  if (nodesToDelete.length > 0) {
    await supabase
      .from("canvas_nodes")
      .delete()
      .eq("user_id", user.id)
      .eq("canvas_id", canvas_id)
      .in("id", nodesToDelete);
  }

  // Delete removed edges
  const edgesToDelete = [...existingEdgeIds].filter((id) => !incomingEdgeIds.has(id));
  if (edgesToDelete.length > 0) {
    await supabase
      .from("canvas_edges")
      .delete()
      .eq("user_id", user.id)
      .eq("canvas_id", canvas_id)
      .in("id", edgesToDelete);
  }

  // Upsert nodes
  if (nodes.length > 0) {
    const nodeRows = nodes.map((n) => ({
      id: n.id || undefined,
      user_id: user.id,
      canvas_id,
      node_type: n.node_type,
      position_x: n.position_x,
      position_y: n.position_y,
      width: n.width ?? 280,
      height: n.height ?? 200,
      data: n.data ?? {},
      label: n.label ?? null,
      updated_at: new Date().toISOString(),
    }));

    const { error: nodeError } = await supabase
      .from("canvas_nodes")
      .upsert(nodeRows, { onConflict: "id" });

    if (nodeError) {
      return NextResponse.json(
        { error: `Failed to save nodes: ${nodeError.message}` },
        { status: 500 }
      );
    }
  }

  // Insert new edges (edges without IDs or with new IDs)
  const newEdges = edges.filter((e) => !e.id || !existingEdgeIds.has(e.id));
  const existingEdgesToKeep = edges.filter((e) => e.id && existingEdgeIds.has(e.id));

  if (newEdges.length > 0) {
    const edgeRows = newEdges.map((e) => ({
      user_id: user.id,
      canvas_id,
      source_node_id: e.source_node_id,
      target_node_id: e.target_node_id,
      edge_type: e.edge_type ?? "default",
      animated: e.animated ?? true,
    }));

    const { error: edgeError } = await supabase
      .from("canvas_edges")
      .insert(edgeRows);

    if (edgeError) {
      return NextResponse.json(
        { error: `Failed to save edges: ${edgeError.message}` },
        { status: 500 }
      );
    }
  }

  // Touch canvas updated_at
  await supabase
    .from("canvases")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", canvas_id);

  // Fetch updated state
  const [{ data: savedNodes }, { data: savedEdges }] = await Promise.all([
    supabase
      .from("canvas_nodes")
      .select("*")
      .eq("canvas_id", canvas_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("canvas_edges")
      .select("*")
      .eq("canvas_id", canvas_id)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    nodes: savedNodes ?? [],
    edges: savedEdges ?? [],
    deleted: { nodes: nodesToDelete.length, edges: edgesToDelete.length },
    kept_edges: existingEdgesToKeep.length,
  });
}
