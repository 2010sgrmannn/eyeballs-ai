import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CanvasBrief } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    canvasId: string;
    brief: CanvasBrief;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { canvasId, brief } = body;

  if (!canvasId || !brief) {
    return NextResponse.json({ error: "canvasId and brief are required" }, { status: 400 });
  }

  // Verify canvas ownership
  const { data: canvas } = await supabase
    .from("canvases")
    .select("id")
    .eq("id", canvasId)
    .eq("user_id", user.id)
    .single();

  if (!canvas) {
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }

  const nodeIds: string[] = [];
  const edgeRows: { user_id: string; canvas_id: string; source_node_id: string; target_node_id: string; edge_type: string; animated: boolean }[] = [];

  // Layout constants
  let yOffset = 200;
  const contextX = 100;
  const aiChatX = 600;
  const aiChatY = 300;
  const verticalGap = 250;

  // Create backstory node
  const backstoryId = crypto.randomUUID();
  const backstoryNode = {
    id: backstoryId,
    user_id: user.id,
    canvas_id: canvasId,
    node_type: "backstory",
    position_x: contextX,
    position_y: yOffset,
    width: 280,
    height: 200,
    data: {},
    label: "Backstory",
  };
  nodeIds.push(backstoryId);
  yOffset += verticalGap;

  // Create folder nodes
  const folderNodes = (brief.selectedFolderIds ?? []).map((folderId) => {
    const id = crypto.randomUUID();
    nodeIds.push(id);
    const node = {
      id,
      user_id: user.id,
      canvas_id: canvasId,
      node_type: "content_folder",
      position_x: contextX,
      position_y: yOffset,
      width: 280,
      height: 200,
      data: { selectedFolderId: folderId },
      label: "Content Folder",
    };
    yOffset += verticalGap;
    return node;
  });

  // Create product nodes
  const productNodes = (brief.selectedProductIds ?? []).map((productId) => {
    const id = crypto.randomUUID();
    nodeIds.push(id);
    const node = {
      id,
      user_id: user.id,
      canvas_id: canvasId,
      node_type: "product",
      position_x: contextX,
      position_y: yOffset,
      width: 280,
      height: 200,
      data: { selectedProductId: productId },
      label: "Product",
    };
    yOffset += verticalGap;
    return node;
  });

  // Create AI Chat node
  const aiChatId = crypto.randomUUID();
  const aiChatNode = {
    id: aiChatId,
    user_id: user.id,
    canvas_id: canvasId,
    node_type: "ai_chat",
    position_x: aiChatX,
    position_y: aiChatY,
    width: 420,
    height: 520,
    data: {
      model: "claude-sonnet-4",
      messages: [
        {
          role: "user",
          content: `Write a viral script about: ${brief.topic}\n\nEmotion: ${brief.emotion}\nAngle: ${brief.angle}\nTarget audience: ${brief.targetAudience}`,
        },
      ],
    },
    label: "AI Chat Agent",
  };

  // Build edges from every context node → AI Chat
  for (const sourceId of nodeIds) {
    edgeRows.push({
      user_id: user.id,
      canvas_id: canvasId,
      source_node_id: sourceId,
      target_node_id: aiChatId,
      edge_type: "default",
      animated: true,
    });
  }

  // Insert all nodes
  const allNodes = [backstoryNode, ...folderNodes, ...productNodes, aiChatNode];
  const { error: nodeError } = await supabase.from("canvas_nodes").insert(allNodes);

  if (nodeError) {
    return NextResponse.json(
      { error: `Failed to create nodes: ${nodeError.message}` },
      { status: 500 }
    );
  }

  // Insert edges
  if (edgeRows.length > 0) {
    const { error: edgeError } = await supabase.from("canvas_edges").insert(edgeRows);
    if (edgeError) {
      return NextResponse.json(
        { error: `Failed to create edges: ${edgeError.message}` },
        { status: 500 }
      );
    }
  }

  // Update canvas brief
  await supabase
    .from("canvases")
    .update({ brief })
    .eq("id", canvasId);

  // Fetch the created nodes and edges
  const [{ data: savedNodes }, { data: savedEdges }] = await Promise.all([
    supabase
      .from("canvas_nodes")
      .select("*")
      .eq("canvas_id", canvasId)
      .order("created_at", { ascending: true }),
    supabase
      .from("canvas_edges")
      .select("*")
      .eq("canvas_id", canvasId)
      .order("created_at", { ascending: true }),
  ]);

  // Trigger initial script generation
  try {
    const generateUrl = new URL("/api/canvas/generate", request.url);
    await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4",
        message: `Write a viral script about: ${brief.topic}\n\nEmotion: ${brief.emotion}\nAngle: ${brief.angle}\nTarget audience: ${brief.targetAudience}`,
        context: {
          backstories: [{}],
          folders: brief.selectedFolderIds?.map((id) => ({ folder_id: id })) ?? [],
          products: brief.selectedProductIds?.map((id) => ({ product_id: id })) ?? [],
        },
      }),
    });
  } catch {
    // Non-critical: initial generation can fail silently
  }

  return NextResponse.json({
    nodes: savedNodes ?? [],
    edges: savedEdges ?? [],
  });
}
