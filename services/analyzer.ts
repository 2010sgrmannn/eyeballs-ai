import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentItem,
  AnalysisResult,
  CreatorInfo,
} from "@/types/content";

const MAX_CONCURRENT = 5;

/**
 * Build the analysis prompt for a single content item.
 */
export function buildAnalysisPrompt(
  item: ContentItem,
  creator: CreatorInfo
): string {
  const parts: string[] = [];
  parts.push("Analyze the following social media content and return JSON.");
  parts.push("");

  if (item.platform) parts.push(`Platform: ${item.platform}`);
  if (item.content_type) parts.push(`Content type: ${item.content_type}`);
  if (item.caption) parts.push(`Caption: ${item.caption}`);
  if (item.transcript) parts.push(`Existing transcript: ${item.transcript}`);

  parts.push("");
  parts.push("Engagement data:");
  if (item.view_count != null) parts.push(`  Views: ${item.view_count}`);
  if (item.like_count != null) parts.push(`  Likes: ${item.like_count}`);
  if (item.comment_count != null)
    parts.push(`  Comments: ${item.comment_count}`);
  if (item.share_count != null) parts.push(`  Shares: ${item.share_count}`);
  if (item.engagement_ratio != null)
    parts.push(`  Engagement ratio: ${item.engagement_ratio}`);
  if (creator.follower_count != null)
    parts.push(`  Creator follower count: ${creator.follower_count}`);

  parts.push("");
  parts.push("Return ONLY valid JSON (no markdown, no code fences) with this exact structure:");
  parts.push(`{
  "transcript": "A descriptive transcript or summary of the content",
  "hook_text": "The opening hook - the first line or sentence that grabs attention",
  "cta_text": "The call-to-action, or empty string if none",
  "virality_score": 50,
  "tags": [
    { "tag": "example", "category": "niche" },
    { "tag": "example", "category": "topic" },
    { "tag": "example", "category": "style" },
    { "tag": "example", "category": "hook_type" },
    { "tag": "example", "category": "emotion" }
  ]
}`);
  parts.push("");
  parts.push("Rules:");
  parts.push("- transcript: Generate a descriptive transcript from the caption and context. If no caption, write a brief content description.");
  parts.push("- hook_text: The opening hook that grabs attention. Extract from the first line of caption if available.");
  parts.push("- cta_text: The call-to-action. Empty string if none found.");
  parts.push("- virality_score: 0-100 integer based on engagement ratio relative to follower count, hook strength, and content structure.");
  parts.push("- tags: Include at least one tag per category (niche, topic, style, hook_type, emotion).");
  parts.push("- category must be one of: niche, topic, style, hook_type, emotion");

  return parts.join("\n");
}

/**
 * Parse the Claude API response into an AnalysisResult.
 * Throws if the response is not valid JSON or missing required fields.
 */
export function parseAnalysisResponse(raw: string): AnalysisResult {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse analysis response as JSON: ${cleaned.slice(0, 200)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Analysis response is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  // Validate required fields
  if (typeof obj.transcript !== "string") {
    throw new Error("Missing or invalid 'transcript' in analysis response");
  }
  if (typeof obj.hook_text !== "string") {
    throw new Error("Missing or invalid 'hook_text' in analysis response");
  }
  if (typeof obj.cta_text !== "string") {
    throw new Error("Missing or invalid 'cta_text' in analysis response");
  }
  if (typeof obj.virality_score !== "number" || obj.virality_score < 0 || obj.virality_score > 100) {
    throw new Error("Missing or invalid 'virality_score' in analysis response (must be 0-100)");
  }
  if (!Array.isArray(obj.tags)) {
    throw new Error("Missing or invalid 'tags' in analysis response");
  }

  const validCategories = new Set(["niche", "topic", "style", "hook_type", "emotion"]);
  const tags = obj.tags
    .filter(
      (t: unknown) =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Record<string, unknown>).tag === "string" &&
        typeof (t as Record<string, unknown>).category === "string" &&
        validCategories.has((t as Record<string, unknown>).category as string)
    )
    .map((t: unknown) => {
      const tag = t as { tag: string; category: string };
      return {
        tag: tag.tag,
        category: tag.category as AnalysisResult["tags"][number]["category"],
      };
    });

  return {
    transcript: obj.transcript,
    hook_text: obj.hook_text,
    cta_text: obj.cta_text,
    virality_score: Math.round(obj.virality_score),
    tags,
  };
}

/**
 * Analyze a single content item using the Claude API.
 */
export async function analyzeContent(
  client: Anthropic,
  item: ContentItem,
  creator: CreatorInfo
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(item, creator);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  return parseAnalysisResponse(textBlock.text);
}

/**
 * Process items in batches with a concurrency limit.
 * Returns an array of results in the same order as the input.
 */
export async function analyzeContentBatch<T>(
  items: T[],
  processFn: (item: T) => Promise<{ success: boolean; error?: string }>,
  concurrency: number = MAX_CONCURRENT
): Promise<Array<{ success: boolean; error?: string }>> {
  const results: Array<{ success: boolean; error?: string }> = new Array(
    items.length
  );

  // Process in chunks of `concurrency`
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((item) =>
        processFn(item).catch((err) => ({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }))
      )
    );
    for (let j = 0; j < chunkResults.length; j++) {
      results[i + j] = chunkResults[j];
    }
  }

  return results;
}

/**
 * Create an Anthropic client. Throws if ANTHROPIC_API_KEY is not set.
 */
export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required for content analysis"
    );
  }
  return new Anthropic({ apiKey });
}
