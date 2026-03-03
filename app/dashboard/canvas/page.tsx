import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CanvasBuilder } from "@/components/canvas/canvas-builder";
import type { CanvasNode, CanvasEdge } from "@/types/database";

export default async function CanvasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: nodes }, { data: edges }, { data: brandProfile }, { data: folders }, { data: products }] =
    await Promise.all([
      supabase
        .from("canvas_nodes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("canvas_edges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("brand_profiles")
        .select("personal_bio, biggest_struggle, defining_moment, fun_facts, display_name, birth_year, location")
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
    ]);

  return (
    <div className="-m-6 h-[calc(100%+48px)] min-h-[calc(100vh-64px)] w-[calc(100%+48px)] overflow-hidden">
      <CanvasBuilder
        initialNodes={(nodes as CanvasNode[]) ?? []}
        initialEdges={(edges as CanvasEdge[]) ?? []}
        brandProfile={brandProfile ?? null}
        folders={(folders as { id: string; name: string }[]) ?? []}
        products={(products as { id: string; name: string; type: string; description: string | null; price: string | null; url: string | null }[]) ?? []}
      />
    </div>
  );
}
