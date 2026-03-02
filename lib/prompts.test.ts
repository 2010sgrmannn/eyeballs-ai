import { describe, it, expect } from "bun:test";
import { buildScriptPrompt } from "@/lib/prompts";
import type { BrandProfile, Content } from "@/types/database";

describe("buildScriptPrompt", () => {
  it("includes topic, platform guidance, and style guidance", () => {
    const prompt = buildScriptPrompt({
      topic: "How to grow on Instagram",
      platform: "instagram",
      scriptStyle: "short",
      brandProfile: null,
      topContent: [],
    });

    expect(prompt).toContain("How to grow on Instagram");
    expect(prompt).toContain("Instagram Reels");
    expect(prompt).toContain("under 60 seconds");
    expect(prompt).toContain("hook");
    expect(prompt).toContain("body");
    expect(prompt).toContain("cta");
  });

  it("includes brand voice when provided", () => {
    const brandProfile: BrandProfile = {
      id: "bp-1",
      user_id: "user-1",
      brand_voice: "Witty and irreverent",
      values: ["authenticity", "humor"],
      target_audience: "Gen Z creators",
      content_style: "casual",
      niche: "comedy",
      created_at: "",
      updated_at: "",
    };

    const prompt = buildScriptPrompt({
      topic: "test",
      platform: "tiktok",
      scriptStyle: "medium",
      brandProfile,
      topContent: [],
    });

    expect(prompt).toContain("Witty and irreverent");
    expect(prompt).toContain("authenticity, humor");
    expect(prompt).toContain("Gen Z creators");
  });

  it("includes viral content patterns when provided", () => {
    const topContent: Content[] = [
      {
        id: "c1",
        user_id: "u1",
        creator_id: "cr1",
        platform: "tiktok",
        external_id: null,
        content_type: null,
        caption: "This is a viral post about productivity hacks for entrepreneurs",
        transcript: null,
        thumbnail_url: null,
        media_url: null,
        view_count: 100000,
        like_count: 5000,
        comment_count: 200,
        share_count: 1000,
        engagement_ratio: 0.062,
        virality_score: 95,
        hook_text: "Stop what you're doing right now",
        cta_text: "Save this for later",
        posted_at: null,
        analyzed_at: null,
        created_at: "",
      },
    ];

    const prompt = buildScriptPrompt({
      topic: "test",
      platform: "linkedin",
      scriptStyle: "long",
      brandProfile: null,
      topContent,
    });

    expect(prompt).toContain("Stop what you're doing right now");
    expect(prompt).toContain("Save this for later");
    expect(prompt).toContain("95");
  });

  it("handles all platform types", () => {
    for (const platform of ["instagram", "tiktok", "linkedin", "twitter"] as const) {
      const prompt = buildScriptPrompt({
        topic: "test",
        platform,
        scriptStyle: "short",
        brandProfile: null,
        topContent: [],
      });
      expect(prompt.length).toBeGreaterThan(100);
    }
  });
});
