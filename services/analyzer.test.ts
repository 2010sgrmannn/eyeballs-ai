import { describe, it, expect, mock, beforeAll } from "bun:test";
import {
  buildAnalysisPrompt,
  parseAnalysisResponse,
  analyzeContentBatch,
  analyzeContent,
  createAnthropicClient,
} from "@/services/analyzer";
import type { ContentItem, CreatorInfo } from "@/types/content";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

const mockContentItem: ContentItem = {
  id: "test-id-1",
  user_id: "user-1",
  creator_id: "creator-1",
  platform: "tiktok",
  external_id: "ext-1",
  content_type: "video",
  caption: "Check out this amazing fitness routine! Drop a comment below.",
  transcript: null,
  thumbnail_url: null,
  media_url: null,
  view_count: 50000,
  like_count: 5000,
  comment_count: 200,
  share_count: 100,
  engagement_ratio: 0.106,
  virality_score: null,
  hook_text: null,
  cta_text: null,
  posted_at: "2026-01-15T10:00:00Z",
  analyzed_at: null,
  created_at: "2026-01-15T10:00:00Z",
};

const mockCreator: CreatorInfo = {
  follower_count: 100000,
};

describe("buildAnalysisPrompt", () => {
  it("includes platform, content type, and caption", () => {
    const prompt = buildAnalysisPrompt(mockContentItem, mockCreator, "");
    expect(prompt).toContain("tiktok");
    expect(prompt).toContain("video");
    expect(prompt).toContain("Check out this amazing fitness routine");
  });

  it("includes engagement data", () => {
    const prompt = buildAnalysisPrompt(mockContentItem, mockCreator, "");
    expect(prompt).toContain("50000");
    expect(prompt).toContain("5000");
    expect(prompt).toContain("100000");
  });

  it("includes JSON structure instructions", () => {
    const prompt = buildAnalysisPrompt(mockContentItem, mockCreator, "");
    expect(prompt).toContain("hook_text");
    expect(prompt).toContain("cta_text");
    expect(prompt).toContain("virality_score");
    expect(prompt).toContain("tags");
  });

  it("handles content with null fields gracefully", () => {
    const sparse: ContentItem = {
      ...mockContentItem,
      platform: null,
      caption: null,
      view_count: null,
      like_count: null,
      comment_count: null,
      share_count: null,
      engagement_ratio: null,
    };
    const prompt = buildAnalysisPrompt(sparse, { follower_count: null }, "");
    expect(prompt).toContain("You are a social media content analyst");
    expect(prompt).not.toContain("Platform:");
    expect(prompt).not.toContain("Views:");
  });
});

describe("parseAnalysisResponse", () => {
  const validResponse = JSON.stringify({
    hook_text: "Check out this amazing fitness routine!",
    cta_text: "Drop a comment below.",
    virality_score: 72,
    tags: [
      { tag: "fitness", category: "niche" },
      { tag: "workout routine", category: "topic" },
      { tag: "talking head", category: "style" },
      { tag: "bold claim", category: "hook_type" },
      { tag: "inspiring", category: "emotion" },
    ],
  });

  const whisperTranscript = "A fitness routine video showing exercises";

  it("parses valid JSON response", () => {
    const result = parseAnalysisResponse(validResponse, whisperTranscript);
    expect(result.transcript).toBe(whisperTranscript);
    expect(result.hook_text).toBe("Check out this amazing fitness routine!");
    expect(result.cta_text).toBe("Drop a comment below.");
    expect(result.virality_score).toBe(72);
    expect(result.tags).toHaveLength(5);
  });

  it("handles markdown code fences", () => {
    const wrapped = "```json\n" + validResponse + "\n```";
    const result = parseAnalysisResponse(wrapped, whisperTranscript);
    expect(result.transcript).toBe(whisperTranscript);
    expect(result.tags).toHaveLength(5);
  });

  it("rounds virality score to integer", () => {
    const response = JSON.stringify({
      hook_text: "test",
      cta_text: "",
      virality_score: 72.6,
      tags: [],
    });
    const result = parseAnalysisResponse(response, "");
    expect(result.virality_score).toBe(73);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAnalysisResponse("not json", "")).toThrow(
      "Failed to parse analysis response as JSON"
    );
  });

  it("uses whisperTranscript param for transcript field", () => {
    const response = JSON.stringify({
      hook_text: "test",
      cta_text: "",
      virality_score: 50,
      tags: [],
    });
    const result = parseAnalysisResponse(response, "my transcript");
    expect(result.transcript).toBe("my transcript");
  });

  it("throws on missing hook_text field", () => {
    const response = JSON.stringify({
      cta_text: "",
      virality_score: 50,
      tags: [],
    });
    expect(() => parseAnalysisResponse(response, "")).toThrow(
      "Missing or invalid 'hook_text'"
    );
  });

  it("throws on virality_score out of range", () => {
    const response = JSON.stringify({
      hook_text: "test",
      cta_text: "",
      virality_score: 150,
      tags: [],
    });
    expect(() => parseAnalysisResponse(response, "")).toThrow(
      "Missing or invalid 'virality_score'"
    );
  });

  it("throws on negative virality_score", () => {
    const response = JSON.stringify({
      hook_text: "test",
      cta_text: "",
      virality_score: -10,
      tags: [],
    });
    expect(() => parseAnalysisResponse(response, "")).toThrow(
      "Missing or invalid 'virality_score'"
    );
  });

  it("filters out tags with invalid categories", () => {
    const response = JSON.stringify({
      hook_text: "test",
      cta_text: "",
      virality_score: 50,
      tags: [
        { tag: "fitness", category: "niche" },
        { tag: "invalid", category: "not_a_category" },
        { tag: "funny", category: "emotion" },
      ],
    });
    const result = parseAnalysisResponse(response, "");
    expect(result.tags).toHaveLength(2);
    expect(result.tags[0].tag).toBe("fitness");
    expect(result.tags[1].tag).toBe("funny");
  });

  it("throws when response is not an object", () => {
    expect(() => parseAnalysisResponse('"just a string"', "")).toThrow(
      "Analysis response is not an object"
    );
  });
});

describe("analyzeContentBatch", () => {
  it("processes items with concurrency limit", async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const results = await analyzeContentBatch(
      items,
      async () => {
        currentConcurrent++;
        if (currentConcurrent > maxConcurrent) {
          maxConcurrent = currentConcurrent;
        }
        await new Promise((r) => setTimeout(r, 10));
        currentConcurrent--;
        return { success: true };
      },
      3
    );

    expect(results).toHaveLength(7);
    expect(results.every((r) => r.success)).toBe(true);
    // Max concurrent should not exceed the limit of 3
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  it("catches errors from individual items", async () => {
    const items = ["ok", "fail", "ok"];
    const results = await analyzeContentBatch(items, async (item) => {
      if (item === "fail") throw new Error("processing failed");
      return { success: true };
    });

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toBe("processing failed");
    expect(results[2].success).toBe(true);
  });

  it("returns empty array for empty input", async () => {
    const results = await analyzeContentBatch([], async () => ({
      success: true,
    }));
    expect(results).toHaveLength(0);
  });

  it("defaults to max concurrency of 5", async () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    await analyzeContentBatch(items, async () => {
      currentConcurrent++;
      if (currentConcurrent > maxConcurrent) {
        maxConcurrent = currentConcurrent;
      }
      await new Promise((r) => setTimeout(r, 5));
      currentConcurrent--;
      return { success: true };
    });

    expect(maxConcurrent).toBeLessThanOrEqual(5);
  });
});

describe("analyzeContent", () => {
  it("calls Claude API and parses response", async () => {
    const mockResponse = {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            hook_text: "Check this out!",
            cta_text: "Follow for more",
            virality_score: 80,
            tags: [{ tag: "fitness", category: "niche" }],
          }),
        },
      ],
    };

    const mockClient = {
      messages: {
        create: mock(() => Promise.resolve(mockResponse)),
      },
    } as unknown as import("@anthropic-ai/sdk").default;

    const result = await analyzeContent(
      mockClient,
      mockContentItem,
      mockCreator,
      "A fitness video"
    );
    expect(result.transcript).toBe("A fitness video");
    expect(result.virality_score).toBe(80);
    expect(result.tags).toHaveLength(1);
  });

  it("throws when API returns no text block", async () => {
    const mockClient = {
      messages: {
        create: mock(() => Promise.resolve({ content: [] })),
      },
    } as unknown as import("@anthropic-ai/sdk").default;

    expect(
      analyzeContent(mockClient, mockContentItem, mockCreator, "")
    ).rejects.toThrow("No text response from Claude API");
  });
});

describe("createAnthropicClient", () => {
  it("returns null when ANTHROPIC_API_KEY is not set", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const client = createAnthropicClient();
    expect(client).toBeNull();
    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it("creates client when API key is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key-123";
    const client = createAnthropicClient();
    expect(client).toBeDefined();
    expect(client).not.toBeNull();
    delete process.env.ANTHROPIC_API_KEY;
  });
});
