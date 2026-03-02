import { describe, it, expect } from "bun:test";
import {
  MockScraperService,
  calculateEngagementRatio,
} from "@/services/scraper";
import type { ScrapedPost } from "@/types/scraper";

describe("calculateEngagementRatio", () => {
  it("returns correct ratio for a post with views", () => {
    const post: ScrapedPost = {
      externalId: "test_1",
      contentType: "reel",
      caption: "Test caption",
      mediaUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumb.jpg",
      viewCount: 10000,
      likeCount: 500,
      commentCount: 50,
      shareCount: 25,
      postedAt: new Date().toISOString(),
    };

    const ratio = calculateEngagementRatio(post);
    // (500 + 50 + 25) / 10000 = 0.0575
    expect(ratio).toBeCloseTo(0.0575, 4);
  });

  it("returns 0 when view count is 0", () => {
    const post: ScrapedPost = {
      externalId: "test_2",
      contentType: "image",
      caption: "No views",
      mediaUrl: "https://example.com/img.jpg",
      thumbnailUrl: "https://example.com/thumb.jpg",
      viewCount: 0,
      likeCount: 10,
      commentCount: 2,
      shareCount: 1,
      postedAt: new Date().toISOString(),
    };

    expect(calculateEngagementRatio(post)).toBe(0);
  });

  it("returns 0 when all engagement is 0", () => {
    const post: ScrapedPost = {
      externalId: "test_3",
      contentType: "reel",
      caption: "No engagement",
      mediaUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumb.jpg",
      viewCount: 5000,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      postedAt: new Date().toISOString(),
    };

    expect(calculateEngagementRatio(post)).toBe(0);
  });
});

describe("MockScraperService", () => {
  const scraper = new MockScraperService();

  it("returns posts for instagram with correct depth", async () => {
    const result = await scraper.scrape("instagram", "testuser", 7);

    expect(result.posts).toHaveLength(7);
    expect(result.displayName).toBeTruthy();
    expect(result.followerCount).toBeGreaterThan(0);
  });

  it("returns 30 posts when depth is 30", async () => {
    const result = await scraper.scrape("instagram", "creator123", 30);
    expect(result.posts).toHaveLength(30);
  });

  it("returns 60 posts when depth is 60", async () => {
    const result = await scraper.scrape("instagram", "bigcreator", 60);
    expect(result.posts).toHaveLength(60);
  });

  it("each post has all required fields", async () => {
    const result = await scraper.scrape("instagram", "fieldtest", 7);

    for (const post of result.posts) {
      expect(post.externalId).toBeTruthy();
      expect(post.contentType).toBeTruthy();
      expect(post.caption).toBeTruthy();
      expect(post.mediaUrl).toBeTruthy();
      expect(post.thumbnailUrl).toBeTruthy();
      expect(typeof post.viewCount).toBe("number");
      expect(typeof post.likeCount).toBe("number");
      expect(typeof post.commentCount).toBe("number");
      expect(typeof post.shareCount).toBe("number");
      expect(post.postedAt).toBeTruthy();
    }
  });

  it("generates a display name from handle", async () => {
    const result = await scraper.scrape("instagram", "john.doe", 7);
    expect(result.displayName).toBe("John Doe");
  });

  it("throws for unsupported platforms", async () => {
    await expect(scraper.scrape("tiktok", "user", 7)).rejects.toThrow(
      "not yet implemented"
    );
  });

  it("throws for linkedin platform", async () => {
    await expect(scraper.scrape("linkedin", "user", 7)).rejects.toThrow(
      "not yet implemented"
    );
  });

  it("throws for twitter platform", async () => {
    await expect(scraper.scrape("twitter", "user", 7)).rejects.toThrow(
      "not yet implemented"
    );
  });

  it("produces deterministic results for same handle", async () => {
    const result1 = await scraper.scrape("instagram", "deterministic_test", 7);
    const result2 = await scraper.scrape("instagram", "deterministic_test", 7);

    expect(result1.displayName).toBe(result2.displayName);
    expect(result1.followerCount).toBe(result2.followerCount);
    expect(result1.posts.length).toBe(result2.posts.length);

    // Post content should be the same (captions are deterministic from the handle seed)
    for (let i = 0; i < result1.posts.length; i++) {
      expect(result1.posts[i].caption).toBe(result2.posts[i].caption);
      expect(result1.posts[i].viewCount).toBe(result2.posts[i].viewCount);
    }
  });
});
