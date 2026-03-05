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
    .select("status, reels_requested, reels_scraped, reels_transcribed, reels_classified, errors")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify(job), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
