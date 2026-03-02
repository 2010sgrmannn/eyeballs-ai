import { createClient } from "@/lib/supabase/server";
import { ScriptsClient } from "./scripts-client";
import type { Script, Niche } from "@/types/database";

export default async function ScriptsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialScripts: Script[] = [];
  let niches: Niche[] = [];

  if (user) {
    const { data: scripts } = await supabase
      .from("scripts")
      .select("*, niche:niches(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    initialScripts = (scripts as Script[]) ?? [];

    const { data: userNiches } = await supabase
      .from("niches")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    niches = (userNiches as Niche[]) ?? [];
  }

  return <ScriptsClient initialScripts={initialScripts} niches={niches} />;
}
