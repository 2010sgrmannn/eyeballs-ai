import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { runProfileAnalysis } from "@/services/profile-analyzer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body: { handle?: string; reel_count?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  const handle = (body.handle ?? "").trim().replace(/^@/, "");
  if (!handle) {
    return new Response(JSON.stringify({ error: "handle is required" }), {
      status: 400,
    });
  }

  const reelCount = Math.min(Math.max(body.reel_count ?? 10, 1), 30);

  // Upsert creator record
  const { error: creatorError } = await supabase
    .from("creators")
    .upsert(
      { user_id: user.id, platform: "instagram", handle },
      { onConflict: "user_id,platform,handle" }
    );

  if (creatorError) {
    return new Response(
      JSON.stringify({ error: "Failed to create creator record" }),
      { status: 500 }
    );
  }

  // Create profile analysis job
  const { data: job, error: jobError } = await supabase
    .from("profile_analysis_jobs")
    .insert({
      user_id: user.id,
      handle,
      status: "pending",
      reels_requested: reelCount,
    })
    .select()
    .single();

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: "Failed to create analysis job" }),
      { status: 500 }
    );
  }

  // Capture access token as fallback for background job DB writes
  // (used when SUPABASE_SERVICE_ROLE_KEY is not set)
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  after(async () => {
    try {
      await runProfileAnalysis(job.id, user.id, handle, reelCount, accessToken ?? undefined);
    } catch (err) {
      console.error("[profile-analyzer/start] Fatal error:", err);
    }
  });

  return new Response(
    JSON.stringify({ job_id: job.id }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
