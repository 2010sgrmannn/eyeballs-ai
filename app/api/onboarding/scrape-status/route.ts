import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/onboarding/scrape-status?job_id=xxx
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
    .from("scrape_jobs")
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

  return new Response(
    JSON.stringify({
      status: job.status,
      handles_total: job.handles_total,
      handles_completed: job.handles_completed,
      posts_found: job.posts_found,
      creators_processed: job.creators_processed,
      errors: job.errors,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
