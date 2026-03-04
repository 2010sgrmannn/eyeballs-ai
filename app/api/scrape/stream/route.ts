import { createClient } from "@/lib/supabase/server";
import { calculateEngagementRatio } from "@/services/scraper";
import {
  mapApifyPostToScrapedPost,
  mapApifyProfile,
} from "@/services/apify-mapper";
import {
  createAnthropicClient,
  analyzeContent,
  analyzeContentLocal,
  getVideoTranscript,
} from "@/services/analyzer";
import type { ContentItem, CreatorInfo } from "@/types/content";
import type { Platform, ScrapeDepth } from "@/types/scraper";

const VALID_PLATFORMS: Platform[] = ["instagram", "tiktok", "linkedin", "twitter"];
const VALID_DEPTHS: ScrapeDepth[] = [7, 30, 60];

export const dynamic = "force-dynamic";

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

  const body = await request.json();
  const platform = body.platform as Platform;
  const handle = (body.handle as string)?.trim().replace(/^@/, "");
  const depth = body.depth as ScrapeDepth;

  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return new Response(JSON.stringify({ error: "Invalid platform" }), { status: 400 });
  }
  if (!handle) {
    return new Response(JSON.stringify({ error: "Handle is required" }), { status: 400 });
  }
  if (!depth || !VALID_DEPTHS.includes(depth)) {
    return new Response(JSON.stringify({ error: "Invalid depth" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Phase 1: Upsert creator
        send({ phase: "init", message: `Looking up @${handle}...` });

        const { data: creator, error: creatorError } = await supabase
          .from("creators")
          .upsert(
            { user_id: user.id, platform, handle },
            { onConflict: "user_id,platform,handle" }
          )
          .select()
          .single();

        if (creatorError) {
          send({ phase: "error", message: "Failed to create creator record" });
          controller.close();
          return;
        }

        if (platform !== "instagram") {
          send({
            phase: "error",
            message: `Scraping for ${platform} is not yet implemented. Only Instagram is available.`,
          });
          controller.close();
          return;
        }

        // Phase 2: Fetch profile
        send({ phase: "profile", message: `Fetching profile for @${handle}...` });

        const token = process.env.APIFY_API_TOKEN;
        if (!token || token === "placeholder") {
          send({ phase: "error", message: "Apify API token not configured" });
          controller.close();
          return;
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
        const { displayName, followerCount, profilePicUrl, bio } = mapApifyProfile(
          profile,
          handle
        );

        send({
          phase: "profile_done",
          message: `Found @${handle}`,
          profile: { displayName, followerCount, profilePicUrl, bio, handle },
        });

        // Update creator record
        await supabase
          .from("creators")
          .update({
            display_name: displayName,
            follower_count: followerCount,
            scraped_at: new Date().toISOString(),
          })
          .eq("id", creator.id);

        // Phase 3: Fetch posts
        send({
          phase: "posts_fetching",
          message: `Fetching ${depth} posts from @${handle}...`,
          total: depth,
        });

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

        send({
          phase: "posts_fetched",
          message: `Got ${rawPosts.length} posts. Processing...`,
          total: rawPosts.length,
        });

        // Phase 4: Process each post and stream it
        const contentRows = [];
        for (let i = 0; i < rawPosts.length; i++) {
          const post = mapApifyPostToScrapedPost(rawPosts[i], handle, i);
          const engagement = calculateEngagementRatio(post);

          contentRows.push({
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
            engagement_ratio: engagement,
            carousel_urls: post.carouselUrls || [],
            posted_at: post.postedAt,
          });

          send({
            phase: "post",
            message: `Processed post ${i + 1}/${rawPosts.length}`,
            current: i + 1,
            total: rawPosts.length,
            post: {
              contentType: post.contentType,
              caption:
                post.caption.length > 120
                  ? post.caption.slice(0, 120) + "..."
                  : post.caption,
              thumbnailUrl: post.thumbnailUrl,
              mediaUrl: post.mediaUrl,
              viewCount: post.viewCount,
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              engagement: Math.round(engagement * 10000) / 100,
              postedAt: post.postedAt,
            },
          });
        }

        // Phase 5: Save to database
        send({ phase: "saving", message: "Saving to database..." });

        const { error: contentError } = await supabase
          .from("content")
          .upsert(contentRows, { onConflict: "creator_id,external_id" });

        if (contentError) {
          send({ phase: "error", message: "Failed to save content to database" });
          controller.close();
          return;
        }

        // Phase 6: Transcribe videos with Whisper + AI Analysis
        const anthropicClient = createAnthropicClient();
        const useLocalCli = !anthropicClient;

        // Fetch the saved content rows to get their IDs
        const { data: savedContent } = await supabase
          .from("content")
          .select("*")
          .eq("creator_id", creator.id)
          .eq("user_id", user.id)
          .is("analyzed_at", null)
          .order("created_at", { ascending: false })
          .limit(rawPosts.length);

        if (savedContent && savedContent.length > 0) {
          const creatorInfo: CreatorInfo = { follower_count: followerCount };

          // Phase 6a: Transcribe all videos in parallel
          const hasWhisper = !!process.env.OPENAI_API_KEY;
          const videoRows = savedContent.filter(
            (r) => r.content_type === "reel" || r.content_type === "video"
          );

          send({
            phase: "analyzing",
            message: hasWhisper
              ? `Transcribing ${videoRows.length} videos...`
              : `Analyzing ${savedContent.length} posts with AI (no OPENAI_API_KEY - skipping transcription)...`,
            current: 0,
            total: savedContent.length,
          });

          // Transcribe all videos in parallel
          const transcripts = new Map<string, string>();
          if (hasWhisper && videoRows.length > 0) {
            const transcriptResults = await Promise.allSettled(
              videoRows.map(async (row) => {
                const transcript = await getVideoTranscript(row.media_url);
                return { id: row.id, transcript };
              })
            );
            for (const result of transcriptResults) {
              if (result.status === "fulfilled" && result.value.transcript) {
                transcripts.set(result.value.id, result.value.transcript);
              }
            }
            send({
              phase: "analyzing",
              message: `Transcribed ${transcripts.size}/${videoRows.length} videos. Now analyzing with AI...`,
              current: 0,
              total: savedContent.length,
            });
          }

          // Phase 6b: Analyze all posts in parallel (with transcripts)
          let completed = 0;
          const results = await Promise.allSettled(
            savedContent.map(async (row) => {
              const whisperTranscript = transcripts.get(row.id) || "";

              const analysis = useLocalCli
                ? await analyzeContentLocal(
                    row as unknown as ContentItem,
                    creatorInfo,
                    whisperTranscript
                  )
                : await analyzeContent(
                    anthropicClient,
                    row as unknown as ContentItem,
                    creatorInfo,
                    whisperTranscript
                  );

              await supabase
                .from("content")
                .update({
                  transcript: whisperTranscript || null,
                  hook_text: analysis.hook_text,
                  cta_text: analysis.cta_text,
                  virality_score: analysis.virality_score,
                  analyzed_at: new Date().toISOString(),
                })
                .eq("id", row.id);

              // Delete existing tags, insert new ones
              await supabase
                .from("content_tags")
                .delete()
                .eq("content_id", row.id);

              if (analysis.tags.length > 0) {
                await supabase.from("content_tags").insert(
                  analysis.tags.map((t) => ({
                    content_id: row.id,
                    tag: t.tag,
                    category: t.category,
                  }))
                );
              }

              return analysis;
            })
          );

          for (const result of results) {
            completed++;
            if (result.status === "fulfilled") {
              send({
                phase: "analyzed_post",
                message: `Analyzed post ${completed}/${savedContent.length}`,
                current: completed,
                total: savedContent.length,
                analysis: {
                  hookText: result.value.hook_text,
                  viralityScore: result.value.virality_score,
                  tagCount: result.value.tags.length,
                },
              });
            } else {
              const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
              send({
                phase: "analyzing",
                message: `Analysis failed for post ${completed}: ${errMsg.slice(0, 80)}. Continuing...`,
                current: completed,
                total: savedContent.length,
              });
            }
          }
        }

        send({
          phase: "done",
          message: `Successfully scraped ${rawPosts.length} posts from @${handle}`,
          summary: {
            handle,
            displayName,
            followerCount,
            postCount: rawPosts.length,
            creatorId: creator.id,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        send({ phase: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
