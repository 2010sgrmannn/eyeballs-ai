import { createClient as createJsClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";
import { calculateEngagementRatio } from "@/services/scraper";
import {
  mapApifyPostToScrapedPost,
  mapApifyProfile,
} from "@/services/apify-mapper";
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
import { withRetry } from "@/lib/retry";
import type { BrandDNAAnalysis } from "@/types/brand-profile";
import type { ReelType, TagCategory } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReelClassification {
  reel_type: ReelType;
  topics: string[];
  hook_text: string;
  cta_text: string;
  virality_score: number;
  tags: Array<{ tag: string; category: TagCategory }>;
}

interface ReelData {
  content_id: string;
  caption: string;
  transcript: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  engagement_ratio: number | null;
  classification?: ReelClassification;
}

// ---------------------------------------------------------------------------
// Service-role Supabase client for background jobs
// ---------------------------------------------------------------------------

function createBackgroundClient(accessToken?: string) {
  // Prefer service role key (no token expiry), fall back to user access token
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  if (accessToken) {
    return createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
  }
  throw new Error("No SUPABASE_SERVICE_ROLE_KEY or accessToken available for background job");
}

// ---------------------------------------------------------------------------
// Transcription -- sends mp4 directly to Whisper (no ffmpeg)
// ---------------------------------------------------------------------------

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function transcribeVideoDirectly(
  mediaUrl: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return "";

  const buffer = await withRetry(
    () => downloadToBuffer(mediaUrl),
    { maxRetries: 2, backoffMs: 1000, label: "downloadToBuffer" }
  );
  const file = new File([new Uint8Array(buffer)], "video.mp4", { type: "video/mp4" });

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "text",
  });

  return typeof transcription === "string"
    ? transcription.trim()
    : (transcription as unknown as { text: string }).text.trim();
}

// ---------------------------------------------------------------------------
// Reel Classification -- single Claude call per reel
// ---------------------------------------------------------------------------

export async function classifyReel(
  caption: string,
  transcript: string
): Promise<ReelClassification> {
  const anthropic = getAnthropicClient();

  const prompt = `You are a social media content analyst specializing in Instagram Reels. Classify this reel based on the caption and transcript.

Caption:
${caption || "(no caption)"}

Transcript (what is spoken in the video):
${transcript || "(no speech detected -- likely music/text overlay only)"}

Determine the reel type based on these rules:
- If transcript has substantial speech and appears to be someone talking to camera -> "talking_head"
- If transcript has speech but seems like narration over footage -> "voiceover"
- If transcript is empty/minimal and caption exists -> "text_overlay_music"
- If transcript mentions "watch this" or describes visual transitions -> "transition"
- If content is a step-by-step explanation -> "tutorial"
- If multiple speakers detected -> "interview"
- If content appears to be a comedy bit or acting -> "skit"
- If content shows a compilation of clips -> "montage"
- If content is reacting to something -> "reaction"
- Otherwise -> "other"

Return ONLY valid JSON (no markdown fences):
{
  "reel_type": "talking_head|transition|text_overlay_music|voiceover|skit|tutorial|montage|interview|reaction|other",
  "topics": ["topic1", "topic2"],
  "hook_text": "the opening hook line",
  "cta_text": "call to action or empty string",
  "virality_score": 50,
  "tags": [
    { "tag": "example", "category": "niche" }
  ]
}

TAGGING RULES:
- niche: Broad content niche (1-2 tags)
- topic: Specific topics covered (2-5 tags)
- style: Visual/content format (2-3 tags)
- hook_type: How it grabs attention (1-2 tags)
- emotion: Emotions triggered (1-3 tags)
- Use lowercase tags. 8-15 total tags.
- virality_score: 0-100 based on hook strength, content structure, shareability.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let cleaned = textBlock.text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  let parsed: ReelClassification;
  try {
    parsed = JSON.parse(cleaned) as ReelClassification;
  } catch (parseErr) {
    console.error("[profile-analyzer] classifyReel JSON.parse failed. Raw response:", cleaned);
    // Return a safe default classification
    return {
      reel_type: "other",
      topics: [],
      hook_text: "",
      cta_text: "",
      virality_score: 50,
      tags: [],
    };
  }

  // Validate reel_type
  const validTypes: ReelType[] = [
    "talking_head", "transition", "text_overlay_music", "voiceover",
    "skit", "tutorial", "montage", "interview", "reaction", "other",
  ];
  if (!validTypes.includes(parsed.reel_type)) {
    parsed.reel_type = "other";
  }

  // Validate tags
  const validCategories = new Set<string>(["niche", "topic", "style", "hook_type", "emotion"]);
  parsed.tags = (parsed.tags || []).filter(
    (t) => typeof t.tag === "string" && validCategories.has(t.category)
  );

  parsed.virality_score = Math.max(0, Math.min(100, Math.round(parsed.virality_score || 50)));

  return parsed;
}

// ---------------------------------------------------------------------------
// Brand DNA Generation -- one Claude call with ALL data
// ---------------------------------------------------------------------------

export async function generateBrandDNA(
  bio: string,
  reelAnalyses: ReelData[],
): Promise<BrandDNAAnalysis> {
  const anthropic = getAnthropicClient();

  const reelsBlock = reelAnalyses
    .map((r, i) => {
      const stats = [
        r.view_count != null ? `views: ${r.view_count}` : null,
        r.like_count != null ? `likes: ${r.like_count}` : null,
        r.comment_count != null ? `comments: ${r.comment_count}` : null,
        r.engagement_ratio != null
          ? `engagement: ${(r.engagement_ratio * 100).toFixed(1)}%`
          : null,
        r.classification?.reel_type ? `type: ${r.classification.reel_type}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      return `--- Reel ${i + 1} (${stats}) ---
Caption: ${r.caption || "(none)"}
Transcript: ${r.transcript || "(no speech)"}
Topics: ${r.classification?.topics?.join(", ") || "unknown"}`;
    })
    .join("\n\n");

  const prompt = `You are a brand strategist and voice analyst. Analyze this Instagram creator's full profile to extract their Brand DNA.

Bio: ${bio || "(no bio)"}

${reelAnalyses.length} Reels analyzed:

${reelsBlock}

Study their patterns carefully:
- Tone and vocabulary choices across captions AND spoken transcripts
- Hook styles (how they open reels)
- Emotional range and vulnerability level
- Topic patterns and recurring themes
- CTA patterns
- Formality vs casualness
- Humor usage
- Authority level vs approachability
- Values they express or imply
- Content format preferences (talking head vs voiceover vs text overlay etc)

Choose values from these options where indicated:
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

Return ONLY valid JSON:
{
  "niche": "string - best matching niche from options or custom",
  "tone_descriptors": ["3 descriptors from options or custom"],
  "tone_formality": 3,
  "tone_humor": 3,
  "tone_authority": 3,
  "creator_archetype": "archetype id",
  "content_pillars": ["3-5 content pillars"],
  "content_goal": "content goal id",
  "content_formats": ["1-3 formats"],
  "preferred_cta": ["1-3 CTAs"],
  "values": ["2-4 values"],
  "target_audience": "string describing target audience",
  "audience_problem": "string describing the problem they solve",
  "audience_age_ranges": ["1-2 age ranges"],
  "audience_gender": "one gender option",
  "unique_value_prop": "what makes this creator unique"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let cleaned = textBlock.text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  try {
    return JSON.parse(cleaned) as BrandDNAAnalysis;
  } catch (parseErr) {
    console.error("[profile-analyzer] generateBrandDNA JSON.parse failed. Raw response:", cleaned);
    throw new Error("Failed to parse Brand DNA response from Claude as JSON");
  }
}

// ---------------------------------------------------------------------------
// Job Status Updater
// ---------------------------------------------------------------------------

type SupabaseBackgroundClient = ReturnType<typeof createBackgroundClient>;

async function updateJob(
  supabase: SupabaseBackgroundClient,
  jobId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from("profile_analysis_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) {
    console.error(`[profile-analyzer] updateJob failed for ${jobId}:`, error.message);
  }
}

async function appendJobError(
  supabase: SupabaseBackgroundClient,
  jobId: string,
  errorMsg: string
) {
  const { data } = await supabase
    .from("profile_analysis_jobs")
    .select("errors")
    .eq("id", jobId)
    .single();

  await updateJob(supabase, jobId, {
    errors: [...(data?.errors || []), errorMsg],
  });
}

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

const JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function runProfileAnalysis(
  jobId: string,
  userId: string,
  handle: string,
  reelCount: number,
  accessToken?: string,
) {
  // Prefer service role key (no token expiry), fall back to user access token
  const supabase = createBackgroundClient(accessToken);

  // Wrap entire job in a timeout race
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Profile analysis timed out after 10 minutes")), JOB_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      runProfileAnalysisInner(supabase, jobId, userId, handle, reelCount),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error(`[profile-analyzer] Fatal error for job ${jobId}:`, err);
    await updateJob(supabase, jobId, { status: "error" });
    await appendJobError(
      supabase, jobId,
      err instanceof Error ? err.message : String(err)
    );
  }
}

async function runProfileAnalysisInner(
  supabase: SupabaseBackgroundClient,
  jobId: string,
  userId: string,
  handle: string,
  reelCount: number,
) {
  // -----------------------------------------------------------------------
  // Stage 1: Scrape
  // -----------------------------------------------------------------------
  await updateJob(supabase, jobId, { status: "scraping" });

  const token = process.env.APIFY_API_TOKEN;
  if (!token || token === "placeholder") {
    throw new Error("Apify API token not configured");
  }

  const { ApifyClient } = await import("apify-client");
  const apify = new ApifyClient({ token });
  const profileUrl = `https://www.instagram.com/${handle}/`;

  // Fetch profile details
  let bio = "";
  let profilePicUrl = "";
  let followerCount = 0;
  let displayName = handle;

  try {
    const profileRun = await apify
      .actor("apify/instagram-api-scraper")
      .call(
        { directUrls: [profileUrl], resultsType: "details", resultsLimit: 1 },
        { timeout: 30 }
      );

    const profileItems = await apify
      .dataset(profileRun.defaultDatasetId)
      .listItems();

    const profile = profileItems.items[0] as
      | Record<string, unknown>
      | undefined;
    const mapped = mapApifyProfile(profile, handle);
    displayName = mapped.displayName;
    followerCount = mapped.followerCount;
    profilePicUrl = mapped.profilePicUrl;
    bio = mapped.bio;
  } catch (err) {
    console.error(`[profile-analyzer] Profile fetch failed for @${handle}:`, err);
    await appendJobError(supabase, jobId, `Profile fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Upsert creator
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .upsert(
      {
        user_id: userId,
        platform: "instagram" as const,
        handle,
        display_name: displayName,
        follower_count: followerCount,
        bio,
        profile_pic_url: profilePicUrl,
        scraped_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,handle" }
    )
    .select()
    .single();

  if (creatorError || !creator) {
    throw new Error(`Creator upsert failed: ${creatorError?.message}`);
  }

  // Fetch posts
  let rawPosts: Record<string, unknown>[] = [];
  try {
    console.log(`[profile-analyzer] Fetching posts for @${handle}, limit=${reelCount}`);
    const postsRun = await apify
      .actor("apify/instagram-api-scraper")
      .call(
        { directUrls: [profileUrl], resultsType: "posts", resultsLimit: reelCount + 5 },
        { timeout: 90 }
      );

    const postsItems = await apify
      .dataset(postsRun.defaultDatasetId)
      .listItems();

    rawPosts = postsItems.items as Record<string, unknown>[];
    console.log(`[profile-analyzer] Got ${rawPosts.length} raw posts for @${handle}`);
  } catch (err) {
    throw new Error(
      `Apify scrape failed for @${handle}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Map and filter to reels
  const allMapped = rawPosts.map((item, i) => mapApifyPostToScrapedPost(item, handle, i));
  const reels = allMapped.filter((p) => p.contentType === "reel");
  const nonReels = allMapped.filter((p) => p.contentType !== "reel");

  // If not enough reels, include non-reels to hit the count
  let postsToProcess = reels.slice(0, reelCount);
  if (postsToProcess.length < reelCount) {
    const needed = reelCount - postsToProcess.length;
    postsToProcess = [...postsToProcess, ...nonReels.slice(0, needed)];
  }

  // Save content rows
  const contentRows = postsToProcess.map((post) => ({
    user_id: userId,
    creator_id: creator.id,
    platform: "instagram" as const,
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
    carousel_urls: post.carouselUrls || [],
    posted_at: post.postedAt,
  }));

  if (contentRows.length > 0) {
    const { error: contentError } = await supabase
      .from("content")
      .upsert(contentRows, { onConflict: "creator_id,external_id" });

    if (contentError) {
      throw new Error(`Failed to save content: ${contentError.message}`);
    }
  }

  // Fetch the content IDs we just saved
  const { data: savedContent } = await supabase
    .from("content")
    .select("id, external_id, caption, media_url, view_count, like_count, comment_count, engagement_ratio, content_type")
    .eq("creator_id", creator.id)
    .eq("user_id", userId)
    .in("external_id", postsToProcess.map((p) => p.externalId));

  if (!savedContent || savedContent.length === 0) {
    throw new Error("No content rows found after save");
  }

  await updateJob(supabase, jobId, { reels_scraped: savedContent.length });

  // -----------------------------------------------------------------------
  // Stage 2: Transcribe
  // -----------------------------------------------------------------------
  await updateJob(supabase, jobId, { status: "transcribing" });

  const reelDataList: ReelData[] = [];
  const transcribeConcurrency = 3;

  for (let i = 0; i < savedContent.length; i += transcribeConcurrency) {
    const chunk = savedContent.slice(i, i + transcribeConcurrency);
    const results = await Promise.allSettled(
      chunk.map(async (c) => {
        let transcript = "";
        if (c.media_url && c.content_type === "reel") {
          try {
            transcript = await withRetry(
              () => transcribeVideoDirectly(c.media_url),
              { maxRetries: 2, backoffMs: 1000, label: `transcribe-${c.external_id}` }
            );
          } catch (err) {
            console.error(`[profile-analyzer] Transcription failed for ${c.external_id}:`, err);
            await appendJobError(
              supabase, jobId,
              `Transcription failed for ${c.external_id}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }

        // Save transcript to DB
        if (transcript) {
          await supabase
            .from("content")
            .update({ transcript })
            .eq("id", c.id);
        }

        return {
          content_id: c.id,
          caption: c.caption || "",
          transcript,
          view_count: c.view_count,
          like_count: c.like_count,
          comment_count: c.comment_count,
          engagement_ratio: c.engagement_ratio,
        } as ReelData;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        reelDataList.push(result.value);
      }
    }

    await updateJob(supabase, jobId, { reels_transcribed: reelDataList.length });
  }

  // -----------------------------------------------------------------------
  // Stage 3: Classify
  // -----------------------------------------------------------------------
  await updateJob(supabase, jobId, { status: "classifying" });

  const classifyConcurrency = 5;
  let classified = 0;

  for (let i = 0; i < reelDataList.length; i += classifyConcurrency) {
    const chunk = reelDataList.slice(i, i + classifyConcurrency);
    await Promise.allSettled(
      chunk.map(async (reel) => {
        try {
          const classification = await withRetry(
            () => classifyReel(reel.caption, reel.transcript),
            { maxRetries: 2, backoffMs: 1000, label: `classifyReel-${reel.content_id}` }
          );
          reel.classification = classification;

          // Save reel_type + analysis to content row
          await supabase
            .from("content")
            .update({
              reel_type: classification.reel_type,
              hook_text: classification.hook_text,
              cta_text: classification.cta_text,
              virality_score: classification.virality_score,
              analyzed_at: new Date().toISOString(),
            })
            .eq("id", reel.content_id);

          // Save tags
          if (classification.tags.length > 0) {
            await supabase.from("content_tags").upsert(
              classification.tags.map((t) => ({
                content_id: reel.content_id,
                tag: t.tag,
                category: t.category,
              })),
              { onConflict: "content_id,tag" }
            );
          }

          classified++;
        } catch (err) {
          console.error(`[profile-analyzer] Classification failed for ${reel.content_id}:`, err);
          await appendJobError(
            supabase, jobId,
            `Classification failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      })
    );

    await updateJob(supabase, jobId, { reels_classified: classified });
  }

  // -----------------------------------------------------------------------
  // Stage 4: Brand DNA
  // -----------------------------------------------------------------------
  await updateJob(supabase, jobId, { status: "analyzing_dna" });

  const brandDNA = await withRetry(
    () => generateBrandDNA(bio, reelDataList),
    { maxRetries: 2, backoffMs: 2000, label: "generateBrandDNA" }
  );

  await updateJob(supabase, jobId, {
    status: "done",
    brand_dna: brandDNA,
  });

  console.log(`[profile-analyzer] Done for @${handle}: ${reelDataList.length} reels processed`);
}
