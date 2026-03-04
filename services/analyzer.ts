import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ContentItem,
  AnalysisResult,
  CreatorInfo,
} from "@/types/content";

const execFileAsync = promisify(execFile);
const MAX_CONCURRENT = 5;

/**
 * Download a video from URL to a temp file. Returns the file path.
 */
async function downloadVideo(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = join(tmpdir(), `eyeballs-${randomUUID()}.mp4`);
  await writeFile(tmpPath, buffer);
  return tmpPath;
}

/**
 * Extract audio from a video file using ffmpeg. Returns path to .mp3 file.
 */
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(".mp4", ".mp3");
  await execFileAsync("/opt/homebrew/bin/ffmpeg", [
    "-i", videoPath,
    "-vn",
    "-acodec", "libmp3lame",
    "-q:a", "4",
    "-y",
    audioPath,
  ], { timeout: 30_000 });
  return audioPath;
}

/**
 * Transcribe audio using OpenAI Whisper API.
 * Returns the word-for-word transcript.
 */
async function transcribeAudio(audioPath: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const audioFile = await readFile(audioPath);
  const file = new File([audioFile], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "text",
  });

  return typeof transcription === "string"
    ? transcription
    : (transcription as unknown as { text: string }).text;
}

/**
 * Download video, extract audio, and transcribe with Whisper.
 * Returns the word-for-word transcript or empty string on failure.
 */
export async function getVideoTranscript(mediaUrl: string | null): Promise<string> {
  if (!mediaUrl) return "";
  if (!process.env.OPENAI_API_KEY) return "";

  let videoPath = "";
  let audioPath = "";

  try {
    videoPath = await downloadVideo(mediaUrl);
    audioPath = await extractAudio(videoPath);
    const transcript = await transcribeAudio(audioPath);
    return transcript.trim();
  } catch (err) {
    console.error("Transcription failed:", err instanceof Error ? err.message : err);
    return "";
  } finally {
    if (videoPath) await unlink(videoPath).catch(() => {});
    if (audioPath) await unlink(audioPath).catch(() => {});
  }
}

/**
 * Build the analysis prompt for a single content item.
 * Now receives the actual word-for-word transcript from Whisper.
 */
export function buildAnalysisPrompt(
  item: ContentItem,
  creator: CreatorInfo,
  whisperTranscript: string
): string {
  const parts: string[] = [];
  parts.push("You are a social media content analyst. Study EVERYTHING about this content deeply - the caption, the spoken transcript, the platform, the engagement data, the creator context. Your job is to extract maximum insight and tag it thoroughly.");
  parts.push("");

  if (item.platform) parts.push(`Platform: ${item.platform}`);
  if (item.content_type) parts.push(`Content type: ${item.content_type}`);
  if (item.caption) parts.push(`\nFull Caption:\n${item.caption}`);

  if (whisperTranscript) {
    parts.push(`\nWord-for-word audio transcript (what is spoken in the video):\n${whisperTranscript}`);
  }

  parts.push("\nEngagement data:");
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
  "hook_text": "The opening hook - the first line or sentence that grabs attention",
  "cta_text": "The call-to-action, or empty string if none",
  "virality_score": 50,
  "tags": [
    { "tag": "fitness", "category": "niche" },
    { "tag": "body transformation", "category": "topic" },
    { "tag": "weight loss", "category": "topic" },
    { "tag": "talking head", "category": "style" },
    { "tag": "before and after", "category": "style" },
    { "tag": "challenge hook", "category": "hook_type" },
    { "tag": "motivation", "category": "emotion" },
    { "tag": "curiosity", "category": "emotion" }
  ]
}`);
  parts.push("");
  parts.push("TAGGING RULES - be thorough:");
  parts.push("- Study the caption word by word, the transcript, and all context clues");
  parts.push("- niche: The broad content niche (fitness, business, tech, lifestyle, etc). Usually 1-2 tags.");
  parts.push("- topic: Specific topics covered. Be detailed. 2-5 tags. Examples: 'body recomposition', 'meal prep', 'client transformation', 'gym tips', 'supplement review'");
  parts.push("- style: Visual/content format. 2-3 tags. Examples: 'talking head', 'before and after', 'tutorial', 'montage', 'text overlay', 'lifestyle vlog', 'POV', 'skit', 'carousel', 'voiceover'");
  parts.push("- hook_type: How it grabs attention. 1-2 tags. Examples: 'challenge hook', 'controversial take', 'question hook', 'story hook', 'shock value', 'number list', 'bold claim', 'relatable pain point'");
  parts.push("- emotion: What emotions it triggers. 1-3 tags. Examples: 'motivation', 'curiosity', 'FOMO', 'humor', 'inspiration', 'urgency', 'trust', 'aspiration'");
  parts.push("- Use lowercase tags. Be specific rather than generic.");
  parts.push("- Generate 8-15 total tags across all categories.");
  parts.push("");
  parts.push("OTHER RULES:");
  parts.push("- hook_text: Extract the exact opening hook from the first line of caption. If caption starts with emoji, include it.");
  parts.push("- cta_text: The call-to-action. Empty string if none found.");
  parts.push("- virality_score: 0-100 integer. Consider: engagement ratio vs follower count, hook strength, content structure, shareability, emotional pull.");

  return parts.join("\n");
}

/**
 * Parse the Claude API response into an AnalysisResult.
 * Throws if the response is not valid JSON or missing required fields.
 */
export function parseAnalysisResponse(raw: string, whisperTranscript: string): AnalysisResult {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Try to extract JSON from the response if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
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
    transcript: whisperTranscript,
    hook_text: obj.hook_text,
    cta_text: obj.cta_text,
    virality_score: Math.round(obj.virality_score),
    tags,
  };
}

/**
 * Analyze a single content item using the Claude API (requires ANTHROPIC_API_KEY).
 */
export async function analyzeContent(
  client: unknown,
  item: ContentItem,
  creator: CreatorInfo,
  whisperTranscript: string
): Promise<AnalysisResult> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropicClient = client as InstanceType<typeof Anthropic>;
  const prompt = buildAnalysisPrompt(item, creator, whisperTranscript);

  const message = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  return parseAnalysisResponse(textBlock.text, whisperTranscript);
}

/**
 * Run the local `claude` CLI using spawn (not execFile) to avoid stdin hanging.
 * Returns the stdout text.
 */
function runClaudeCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, TERM: "dumb" };
    for (const key of Object.keys(env)) {
      if (key === "CLAUDECODE" || key.startsWith("CLAUDE_CODE_")) {
        delete (env as Record<string, unknown>)[key];
      }
    }

    const child = spawn(
      "/Users/sergiotosa/.local/bin/claude",
      ["-p", prompt, "--output-format", "text"],
      {
        env: env as NodeJS.ProcessEnv,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude CLI timed out after 120s"));
    }, 120_000);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr.slice(0, 200)}`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Analyze a single content item using the local `claude` CLI (uses Max subscription).
 * Falls back to this when no ANTHROPIC_API_KEY is set.
 */
export async function analyzeContentLocal(
  item: ContentItem,
  creator: CreatorInfo,
  whisperTranscript: string
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(item, creator, whisperTranscript);
  const stdout = await runClaudeCli(prompt);
  return parseAnalysisResponse(stdout, whisperTranscript);
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
 * Create an Anthropic client. Returns null if no API key is configured.
 */
export function createAnthropicClient(): unknown | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    return null;
  }
  // Dynamic import to avoid bundling issues
  const Anthropic = require("@anthropic-ai/sdk").default;
  return new Anthropic({ apiKey });
}
