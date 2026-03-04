import { createClient } from "@/lib/supabase/server";
import { calculateEngagementRatio } from "@/services/scraper";
import {
  mapApifyPostToScrapedPost,
  mapApifyProfile,
} from "@/services/apify-mapper";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/onboarding/scrape
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body: {
    social_handles?: Record<string, string>;
    inspiration_handles?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  const socialHandles = body.social_handles ?? {};
  const inspirationHandles = body.inspiration_handles ?? [];

  // Build a flat list of { platform, handle } objects to scrape.
  // Only Instagram is supported for now.
  interface HandleEntry {
    platform: "instagram";
    handle: string;
  }

  const allHandles: HandleEntry[] = [];
  const skippedPlatforms: string[] = [];

  for (const [platform, handle] of Object.entries(socialHandles)) {
    const cleaned = handle.trim().replace(/^@/, "");
    if (!cleaned) continue;

    if (platform === "instagram") {
      allHandles.push({ platform: "instagram", handle: cleaned });
    } else {
      skippedPlatforms.push(
        `Skipped ${platform}/@${cleaned} — only Instagram is supported`
      );
    }
  }

  for (const raw of inspirationHandles) {
    const cleaned = raw.trim().replace(/^@/, "");
    if (!cleaned) continue;
    // Inspiration handles default to Instagram
    allHandles.push({ platform: "instagram", handle: cleaned });
  }

  if (allHandles.length === 0 && skippedPlatforms.length === 0) {
    return new Response(
      JSON.stringify({ error: "No handles provided" }),
      { status: 400 }
    );
  }

  // Create job in Supabase
  const { data: job, error: jobError } = await supabase
    .from("scrape_jobs")
    .insert({
      user_id: user.id,
      status: "running",
      handles_total: allHandles.length,
      handles_completed: 0,
      posts_found: 0,
      creators_processed: [],
      errors: [...skippedPlatforms],
    })
    .select()
    .single();

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: "Failed to create scrape job" }),
      { status: 500 }
    );
  }

  // Fire-and-forget — scraping continues after response is sent
  scrapeAllHandles(job.id, user.id, allHandles).catch(async (err) => {
    console.error("[onboarding/scrape] scrapeAllHandles fatal error:", err);
    const sb = await createClient();
    await sb
      .from("scrape_jobs")
      .update({
        status: "error",
        errors: [...(job.errors || []), err instanceof Error ? err.message : String(err)],
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  });

  return new Response(
    JSON.stringify({
      job_id: job.id,
      handles_queued: allHandles.length,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ---------------------------------------------------------------------------
// Background scraping orchestrator
// ---------------------------------------------------------------------------
async function scrapeAllHandles(
  jobId: string,
  userId: string,
  handles: { platform: "instagram"; handle: string }[]
) {
  const errors: string[] = [];

  // Process max 3 handles concurrently to avoid Apify rate limits
  const concurrency = 3;
  for (let i = 0; i < handles.length; i += concurrency) {
    const batch = handles.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((h) => scrapeHandle(jobId, userId, h.platform, h.handle))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        const msg =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        errors.push(msg);
      }
    }
  }

  // Final status update
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("scrape_jobs")
    .select("handles_completed, errors")
    .eq("id", jobId)
    .single();

  const allErrors = [...(current?.errors || []), ...errors];
  const finalStatus = allErrors.length > 0 && (current?.handles_completed ?? 0) === 0 ? "error" : "done";

  await supabase
    .from("scrape_jobs")
    .update({
      status: finalStatus,
      errors: allErrors,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

// ---------------------------------------------------------------------------
// Scrape a single Instagram handle (profile + posts, no AI analysis)
// ---------------------------------------------------------------------------
async function scrapeHandle(
  jobId: string,
  userId: string,
  platform: "instagram",
  handle: string
) {
  // We need a fresh Supabase client for background work
  const supabase = await createClient();

  // 1. Upsert creator record
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .upsert(
      { user_id: userId, platform, handle },
      { onConflict: "user_id,platform,handle" }
    )
    .select()
    .single();

  if (creatorError) {
    throw new Error(`Creator upsert failed for @${handle}: ${creatorError.message}`);
  }

  // 2. Call Apify for profile details
  const token = process.env.APIFY_API_TOKEN;
  if (!token || token === "placeholder") {
    throw new Error("Apify API token not configured");
  }

  const { ApifyClient } = await import("apify-client");
  const client = new ApifyClient({ token });
  const profileUrl = `https://www.instagram.com/${handle}/`;

  const profileRun = await client
    .actor("apify/instagram-api-scraper")
    .call({
      directUrls: [profileUrl],
      resultsType: "details",
      resultsLimit: 1,
    });

  const profileItems = await client
    .dataset(profileRun.defaultDatasetId)
    .listItems();

  const profile = profileItems.items[0] as Record<string, unknown> | undefined;
  const { displayName, followerCount } = mapApifyProfile(profile, handle);

  // Update creator with profile metadata
  await supabase
    .from("creators")
    .update({
      display_name: displayName,
      follower_count: followerCount,
      scraped_at: new Date().toISOString(),
    })
    .eq("id", creator.id);

  // 3. Fetch posts (enough to build Brand DNA from captions)
  const depth = 15;
  const postsRun = await client
    .actor("apify/instagram-api-scraper")
    .call({
      directUrls: [profileUrl],
      resultsType: "posts",
      resultsLimit: depth,
    });

  const postsItems = await client
    .dataset(postsRun.defaultDatasetId)
    .listItems();

  const rawPosts = postsItems.items as Record<string, unknown>[];

  // 4. Map posts using the shared mapper
  const contentRows = rawPosts.map((item, i) => {
    const post = mapApifyPostToScrapedPost(item, handle, i);
    const engagement = calculateEngagementRatio(post);

    return {
      user_id: userId,
      creator_id: creator.id,
      platform,
      external_id: post.externalId,
      content_type: post.contentType,
      caption: post.caption,
      media_url: post.mediaUrl,
      thumbnail_url: post.thumbnailUrl,
      view_count: post.viewCount,
      like_count: post.likeCount,
      comment_count: post.commentCount,
      share_count: post.shareCount,
      engagement_ratio: engagement,
      carousel_urls: post.carouselUrls || [],
      posted_at: post.postedAt,
    };
  });

  // 5. Upsert content to DB
  if (contentRows.length > 0) {
    const { error: contentError } = await supabase
      .from("content")
      .upsert(contentRows, { onConflict: "creator_id,external_id" });

    if (contentError) {
      throw new Error(
        `Failed to save content for @${handle}: ${contentError.message}`
      );
    }
  }

  // 6. Update job progress in DB
  const { data: current } = await supabase
    .from("scrape_jobs")
    .select("handles_completed, posts_found, creators_processed")
    .eq("id", jobId)
    .single();

  await supabase
    .from("scrape_jobs")
    .update({
      handles_completed: (current?.handles_completed ?? 0) + 1,
      posts_found: (current?.posts_found ?? 0) + rawPosts.length,
      creators_processed: [...(current?.creators_processed ?? []), handle],
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}
