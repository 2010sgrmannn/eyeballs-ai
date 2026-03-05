import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "job_id query parameter is required" }),
      { status: 400 }
    );
  }

  const { data: job, error } = await supabase
    .from("profile_analysis_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404 }
    );
  }

  if (job.status !== "done") {
    return new Response(
      JSON.stringify({
        error: "Analysis not complete yet",
        status: job.status,
      }),
      { status: 202 }
    );
  }

  // Fetch all reels with their tags for this handle
  const { data: creator } = await supabase
    .from("creators")
    .select("id, bio, profile_pic_url, follower_count, display_name")
    .eq("user_id", user.id)
    .eq("handle", job.handle)
    .eq("platform", "instagram")
    .maybeSingle();

  let reels: unknown[] = [];
  if (creator) {
    const { data: content } = await supabase
      .from("content")
      .select("id, caption, transcript, reel_type, hook_text, cta_text, virality_score, view_count, like_count, comment_count, engagement_ratio, media_url, content_tags(tag, category)")
      .eq("creator_id", creator.id)
      .eq("user_id", user.id)
      .not("analyzed_at", "is", null)
      .order("posted_at", { ascending: false });

    reels = content || [];
  }

  return new Response(
    JSON.stringify({
      brand_dna: job.brand_dna,
      creator: creator || null,
      reels,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
