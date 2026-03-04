import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ContextView } from "./context-view";

export default async function ContextPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: brandProfile },
    { data: stories },
    { data: products },
  ] = await Promise.all([
    supabase.from("brand_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("creator_stories").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }),
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <ContextView
      initialProfile={brandProfile ?? null}
      initialStories={stories ?? []}
      initialProducts={products ?? []}
    />
  );
}
