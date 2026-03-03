import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CanvasBuilder } from "@/components/canvas/canvas-builder";
import type { Canvas, CanvasNode, CanvasEdge } from "@/types/database";

interface PageProps {
  searchParams: Promise<{ canvas?: string }>;
}

export default async function CanvasPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  const [
    { data: canvases },
    { data: brandProfile },
    { data: folders },
    { data: products },
    { data: stories },
  ] = await Promise.all([
    supabase
      .from("canvases")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("brand_profiles")
      .select("personal_bio, biggest_struggle, defining_moment, fun_facts, display_name, birth_year, location, content_pillars, target_audience, niche")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, type, description, price, url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_stories")
      .select("id, title, emotion, category")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
  ]);

  const canvasList = (canvases as Canvas[]) ?? [];

  // Determine active canvas
  const activeCanvasId =
    params.canvas && canvasList.some((c) => c.id === params.canvas)
      ? params.canvas
      : canvasList[0]?.id ?? null;

  // Fetch nodes/edges for active canvas
  let nodes: CanvasNode[] = [];
  let edges: CanvasEdge[] = [];

  if (activeCanvasId) {
    const [{ data: nodeData }, { data: edgeData }] = await Promise.all([
      supabase
        .from("canvas_nodes")
        .select("*")
        .eq("canvas_id", activeCanvasId)
        .order("created_at", { ascending: true }),
      supabase
        .from("canvas_edges")
        .select("*")
        .eq("canvas_id", activeCanvasId)
        .order("created_at", { ascending: true }),
    ]);
    nodes = (nodeData as CanvasNode[]) ?? [];
    edges = (edgeData as CanvasEdge[]) ?? [];
  }

  return (
    <div className="-m-6 h-[calc(100%+48px)] min-h-[calc(100vh-64px)] w-[calc(100%+48px)] overflow-hidden">
      <CanvasBuilder
        initialNodes={nodes}
        initialEdges={edges}
        brandProfile={brandProfile ?? null}
        folders={(folders as { id: string; name: string }[]) ?? []}
        products={(products as { id: string; name: string; type: string; description: string | null; price: string | null; url: string | null }[]) ?? []}
        canvases={canvasList}
        activeCanvasId={activeCanvasId}
        stories={(stories as { id: string; title: string; emotion: string | null; category: string | null }[]) ?? []}
      />
    </div>
  );
}
