import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import {
  NICHE_OPTIONS,
  TONE_DESCRIPTOR_OPTIONS,
  ARCHETYPE_OPTIONS,
  CONTENT_PILLAR_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  CTA_OPTIONS,
  VALUE_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  CONTENT_GOAL_OPTIONS,
} from "@/lib/constants/brand-profile-options";
import type { BrandDNAAnalysis } from "@/types/brand-profile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST /api/onboarding/analyze-brand-dna
// ---------------------------------------------------------------------------
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

  // Optionally accept a job_id to scope the query, but not required
  let body: { job_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine
  }

  // Fetch user's scraped content captions (latest 15 with non-null captions)
  let query = supabase
    .from("content")
    .select("caption, like_count, comment_count, view_count, engagement_ratio, posted_at")
    .eq("user_id", user.id)
    .not("caption", "is", null)
    .neq("caption", "")
    .order("posted_at", { ascending: false })
    .limit(15);

  // If job_id provided, scope to creators from that job
  if (body.job_id) {
    const { data: job } = await supabase
      .from("scrape_jobs")
      .select("creators_processed")
      .eq("id", body.job_id)
      .eq("user_id", user.id)
      .single();

    if (job?.creators_processed?.length) {
      // Get creator IDs for these handles
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .in("handle", job.creators_processed);

      if (creators?.length) {
        query = query.in(
          "creator_id",
          creators.map((c) => c.id)
        );
      }
    }
  }

  const { data: posts, error: postsError } = await query;

  if (postsError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch content" }),
      { status: 500 }
    );
  }

  if (!posts || posts.length < 3) {
    return new Response(
      JSON.stringify({
        error: "Not enough content to analyze. We need at least 3 captions.",
        caption_count: posts?.length ?? 0,
      }),
      { status: 400 }
    );
  }

  // Build the prompt
  const captionsBlock = posts
    .map((p, i) => {
      const stats = [
        p.like_count != null ? `likes: ${p.like_count}` : null,
        p.comment_count != null ? `comments: ${p.comment_count}` : null,
        p.view_count != null ? `views: ${p.view_count}` : null,
        p.engagement_ratio != null
          ? `engagement: ${(p.engagement_ratio * 100).toFixed(1)}%`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      return `--- Post ${i + 1} ${stats ? `(${stats})` : ""} ---\n${p.caption}`;
    })
    .join("\n\n");

  const prompt = `You are a brand strategist and voice analyst. Analyze the following ${posts.length} Instagram captions from a content creator and extract their Brand DNA.

Study their writing patterns carefully:
- Tone and vocabulary choices
- Hook styles (how they open posts)
- Emotional range and vulnerability level
- Topic patterns and recurring themes
- CTA patterns
- Formality vs casualness
- Humor usage
- Authority level vs approachability
- Values they express or imply

Here are the captions:

${captionsBlock}

Based on your analysis, return a JSON object matching this exact structure. Choose values from the provided options where indicated, but you may also suggest custom values if they better fit.

Niche options: ${JSON.stringify(NICHE_OPTIONS)}
Tone descriptor options: ${JSON.stringify(TONE_DESCRIPTOR_OPTIONS)}
Archetype options (use the id): ${JSON.stringify(ARCHETYPE_OPTIONS.map((a) => ({ id: a.id, label: a.label })))}
Content pillar options: ${JSON.stringify(CONTENT_PILLAR_OPTIONS)}
Content format options: ${JSON.stringify(CONTENT_FORMAT_OPTIONS)}
CTA options: ${JSON.stringify(CTA_OPTIONS)}
Value options: ${JSON.stringify(VALUE_OPTIONS)}
Age range options: ${JSON.stringify(AGE_RANGE_OPTIONS)}
Gender options: ${JSON.stringify(GENDER_OPTIONS)}
Content goal options (use the id): ${JSON.stringify(CONTENT_GOAL_OPTIONS)}

Return ONLY valid JSON with these fields:
{
  "niche": "string - best matching niche from options or custom",
  "tone_descriptors": ["3 descriptors from options or custom that best match their voice"],
  "tone_formality": "number 1-5, 1=very formal, 5=very casual",
  "tone_humor": "number 1-5, 1=very serious, 5=very playful",
  "tone_authority": "number 1-5, 1=very authoritative, 5=very approachable",
  "creator_archetype": "archetype id that best fits",
  "content_pillars": ["3-5 content pillars from options or custom"],
  "content_goal": "content goal id that best fits",
  "content_formats": ["1-3 formats from options"],
  "preferred_cta": ["1-3 CTAs from options or custom"],
  "values": ["2-4 values from options or custom"],
  "target_audience": "string describing their likely target audience",
  "audience_problem": "string describing the problem they solve for their audience",
  "audience_age_ranges": ["1-2 age ranges from options"],
  "audience_gender": "one gender option",
  "unique_value_prop": "string describing what makes this creator unique based on their content"
}

Return ONLY the JSON object, no markdown fences, no explanation.`;

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Response(
        JSON.stringify({ error: "No text in AI response" }),
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysis: BrandDNAAnalysis;
    try {
      analysis = JSON.parse(textBlock.text) as BrandDNAAnalysis;
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response as JSON" }),
          { status: 500 }
        );
      }
      analysis = JSON.parse(jsonMatch[0]) as BrandDNAAnalysis;
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[analyze-brand-dna] AI analysis error:", err);
    return new Response(
      JSON.stringify({
        error: "AI analysis failed",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500 }
    );
  }
}
