import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getScraperService, calculateEngagementRatio } from "@/services/scraper";
import type { Platform, ScrapeDepth, ScrapeRequest } from "@/types/scraper";

const VALID_PLATFORMS: Platform[] = ["instagram", "tiktok", "linkedin", "twitter"];
const VALID_DEPTHS: ScrapeDepth[] = [7, 30, 60];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ScrapeRequest>;

    if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be one of: instagram, tiktok, linkedin, twitter" },
        { status: 400 }
      );
    }

    if (!body.handle || typeof body.handle !== "string" || body.handle.trim().length === 0) {
      return NextResponse.json(
        { error: "Handle is required" },
        { status: 400 }
      );
    }

    if (!body.depth || !VALID_DEPTHS.includes(body.depth)) {
      return NextResponse.json(
        { error: "Invalid depth. Must be one of: 7, 30, 60" },
        { status: 400 }
      );
    }

    // Strip @ prefix if present
    const handle = body.handle.trim().replace(/^@/, "");
    const { platform, depth } = body;

    // Upsert creator (insert or update on conflict)
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .upsert(
        {
          user_id: user.id,
          platform,
          handle,
        },
        { onConflict: "user_id,platform,handle" }
      )
      .select()
      .single();

    if (creatorError) {
      console.error("Creator upsert error:", creatorError);
      return NextResponse.json(
        { error: "Failed to create or update creator record" },
        { status: 500 }
      );
    }

    // Run the scraper
    const scraper = getScraperService();
    const result = await scraper.scrape(platform, handle, depth);

    // Update creator with scraped metadata
    const { error: updateError } = await supabase
      .from("creators")
      .update({
        display_name: result.displayName,
        follower_count: result.followerCount,
        scraped_at: new Date().toISOString(),
      })
      .eq("id", creator.id);

    if (updateError) {
      console.error("Creator update error:", updateError);
    }

    // Insert scraped posts into content table
    const contentRows = result.posts.map((post) => ({
      user_id: user.id,
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
      engagement_ratio: calculateEngagementRatio(post),
      posted_at: post.postedAt,
    }));

    const { error: contentError } = await supabase
      .from("content")
      .upsert(contentRows, { onConflict: "creator_id,external_id" });

    if (contentError) {
      console.error("Content insert error:", contentError);
      return NextResponse.json(
        { error: "Failed to store scraped content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      creatorId: creator.id,
      handle,
      platform,
      displayName: result.displayName,
      followerCount: result.followerCount,
      postCount: result.posts.length,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
