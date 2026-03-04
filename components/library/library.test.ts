import { describe, test, expect } from "bun:test";
import type {
  ContentWithRelations,
  Platform,
  GroupByField,
} from "@/types/database";
import {
  DEFAULT_FILTERS,
  SORT_FIELD_LABELS,
  GROUP_BY_LABELS,
  ITEMS_PER_PAGE,
} from "@/types/database";

// Helper to create mock content
function mockContent(
  overrides: Partial<ContentWithRelations> = {}
): ContentWithRelations {
  return {
    id: "content-1",
    user_id: "user-1",
    creator_id: "creator-1",
    platform: "instagram",
    external_id: "ext-1",
    content_type: "video",
    caption: "Test caption for content",
    transcript: null,
    thumbnail_url: null,
    media_url: null,
    view_count: 1000,
    like_count: 100,
    comment_count: 10,
    share_count: 5,
    engagement_ratio: 5.5,
    virality_score: 72,
    hook_text: "Did you know?",
    cta_text: "Follow for more",
    posted_at: "2026-01-15T12:00:00Z",
    carousel_urls: null,
    analyzed_at: "2026-01-16T12:00:00Z",
    created_at: "2026-01-16T12:00:00Z",
    creators: {
      id: "creator-1",
      user_id: "user-1",
      platform: "instagram",
      handle: "testcreator",
      display_name: "Test Creator",
      follower_count: 50000,
      scraped_at: "2026-01-14T12:00:00Z",
      created_at: "2026-01-14T12:00:00Z",
    },
    content_tags: [],
    ...overrides,
  };
}

// Replicate groupContent logic from library-view for testing
function groupContent(
  items: ContentWithRelations[],
  groupBy: GroupByField | "none"
): Map<string, ContentWithRelations[]> {
  if (groupBy === "none") {
    return new Map([["all", items]]);
  }

  const groups = new Map<string, ContentWithRelations[]>();

  for (const item of items) {
    let key: string;
    switch (groupBy) {
      case "creator":
        key = item.creators?.handle
          ? `@${item.creators.handle}`
          : "Unknown Creator";
        break;
      case "platform":
        key = item.platform ?? item.creators?.platform ?? "Unknown";
        break;
      case "niche": {
        const nicheTag = item.content_tags?.find(
          (t) => t.category === "niche"
        );
        key = nicheTag?.tag ?? "Untagged";
        break;
      }
      case "hook_type": {
        const hookTag = item.content_tags?.find(
          (t) => t.category === "hook_type"
        );
        key = hookTag?.tag ?? "Unknown";
        break;
      }
      default:
        key = "all";
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

describe("Library component logic", () => {
  describe("groupContent", () => {
    test("returns all items under 'all' key when groupBy is none", () => {
      const items = [mockContent({ id: "1" }), mockContent({ id: "2" })];
      const result = groupContent(items, "none");

      expect(result.size).toBe(1);
      expect(result.get("all")).toHaveLength(2);
    });

    test("groups by creator handle", () => {
      const items = [
        mockContent({
          id: "1",
          creators: {
            ...mockContent().creators,
            handle: "alice",
          },
        }),
        mockContent({
          id: "2",
          creators: {
            ...mockContent().creators,
            handle: "bob",
          },
        }),
        mockContent({
          id: "3",
          creators: {
            ...mockContent().creators,
            handle: "alice",
          },
        }),
      ];

      const result = groupContent(items, "creator");

      expect(result.size).toBe(2);
      expect(result.get("@alice")).toHaveLength(2);
      expect(result.get("@bob")).toHaveLength(1);
    });

    test("groups by platform", () => {
      const items = [
        mockContent({ id: "1", platform: "instagram" }),
        mockContent({ id: "2", platform: "tiktok" }),
        mockContent({ id: "3", platform: "instagram" }),
      ];

      const result = groupContent(items, "platform");

      expect(result.size).toBe(2);
      expect(result.get("instagram")).toHaveLength(2);
      expect(result.get("tiktok")).toHaveLength(1);
    });

    test("groups by niche tag", () => {
      const items = [
        mockContent({
          id: "1",
          content_tags: [
            { id: "t1", content_id: "1", tag: "fitness", category: "niche" },
          ],
        }),
        mockContent({
          id: "2",
          content_tags: [
            { id: "t2", content_id: "2", tag: "cooking", category: "niche" },
          ],
        }),
        mockContent({
          id: "3",
          content_tags: [],
        }),
      ];

      const result = groupContent(items, "niche");

      expect(result.size).toBe(3);
      expect(result.get("fitness")).toHaveLength(1);
      expect(result.get("cooking")).toHaveLength(1);
      expect(result.get("Untagged")).toHaveLength(1);
    });

    test("groups by hook_type tag", () => {
      const items = [
        mockContent({
          id: "1",
          content_tags: [
            { id: "t1", content_id: "1", tag: "question", category: "hook_type" },
          ],
        }),
        mockContent({
          id: "2",
          content_tags: [
            { id: "t2", content_id: "2", tag: "bold claim", category: "hook_type" },
          ],
        }),
      ];

      const result = groupContent(items, "hook_type");

      expect(result.size).toBe(2);
      expect(result.get("question")).toHaveLength(1);
      expect(result.get("bold claim")).toHaveLength(1);
    });

    test("handles empty items array", () => {
      const result = groupContent([], "creator");
      expect(result.size).toBe(0);
    });
  });

  describe("virality badge color thresholds", () => {
    // Test the color logic
    function getViralityColor(score: number | null): string {
      if (score === null) return "neutral";
      if (score >= 70) return "green";
      if (score >= 40) return "yellow";
      return "red";
    }

    test("score >= 70 is green", () => {
      expect(getViralityColor(70)).toBe("green");
      expect(getViralityColor(85)).toBe("green");
      expect(getViralityColor(100)).toBe("green");
    });

    test("score 40-69 is yellow", () => {
      expect(getViralityColor(40)).toBe("yellow");
      expect(getViralityColor(55)).toBe("yellow");
      expect(getViralityColor(69)).toBe("yellow");
    });

    test("score 0-39 is red", () => {
      expect(getViralityColor(0)).toBe("red");
      expect(getViralityColor(20)).toBe("red");
      expect(getViralityColor(39)).toBe("red");
    });

    test("null score is neutral", () => {
      expect(getViralityColor(null)).toBe("neutral");
    });
  });

  describe("pagination logic", () => {
    function getPageNumbers(
      current: number,
      total: number
    ): (number | null)[] {
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }

      const pages: (number | null)[] = [1];

      if (current > 3) {
        pages.push(null);
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push(null);
      }

      pages.push(total);

      return pages;
    }

    test("shows all pages when total <= 7", () => {
      expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    test("shows ellipsis for large page counts", () => {
      const result = getPageNumbers(1, 20);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(20);
      expect(result).toContain(null);
    });

    test("shows surrounding pages for middle page", () => {
      const result = getPageNumbers(10, 20);
      expect(result).toContain(9);
      expect(result).toContain(10);
      expect(result).toContain(11);
    });

    test("calculates total pages correctly", () => {
      expect(Math.ceil(100 / ITEMS_PER_PAGE)).toBe(5);
      expect(Math.ceil(21 / ITEMS_PER_PAGE)).toBe(2);
      expect(Math.ceil(20 / ITEMS_PER_PAGE)).toBe(1);
      expect(Math.ceil(0 / ITEMS_PER_PAGE)).toBe(0);
    });
  });

  describe("type definitions", () => {
    test("SORT_FIELD_LABELS has all expected fields", () => {
      const fields: string[] = [
        "virality_score",
        "engagement_ratio",
        "view_count",
        "like_count",
        "posted_at",
        "analyzed_at",
      ];
      for (const field of fields) {
        expect(field in SORT_FIELD_LABELS).toBe(true);
      }
    });

    test("GROUP_BY_LABELS has all expected fields", () => {
      const fields: string[] = [
        "none",
        "creator",
        "platform",
        "niche",
        "hook_type",
      ];
      for (const field of fields) {
        expect(field in GROUP_BY_LABELS).toBe(true);
      }
    });
  });
});
