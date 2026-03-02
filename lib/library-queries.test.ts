import { describe, test, expect, mock } from "bun:test";
import type {
  LibraryFilters,
  ContentWithRelations,
  ContentTag,
} from "@/types/database";
import { DEFAULT_FILTERS, ITEMS_PER_PAGE } from "@/types/database";

// We test the query builder logic and tag filtering independently
// since we can't connect to a real Supabase instance in unit tests.

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
    caption: "Test caption",
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
    content_tags: [
      { id: "tag-1", content_id: "content-1", tag: "fitness", category: "niche" },
      { id: "tag-2", content_id: "content-1", tag: "question", category: "hook_type" },
      { id: "tag-3", content_id: "content-1", tag: "talking head", category: "style" },
    ],
    ...overrides,
  };
}

describe("library-queries", () => {
  describe("DEFAULT_FILTERS", () => {
    test("has empty arrays and full ranges", () => {
      expect(DEFAULT_FILTERS.platforms).toEqual([]);
      expect(DEFAULT_FILTERS.nicheTags).toEqual([]);
      expect(DEFAULT_FILTERS.hookTypes).toEqual([]);
      expect(DEFAULT_FILTERS.styles).toEqual([]);
      expect(DEFAULT_FILTERS.viralityMin).toBe(0);
      expect(DEFAULT_FILTERS.viralityMax).toBe(100);
      expect(DEFAULT_FILTERS.engagementMin).toBe(0);
      expect(DEFAULT_FILTERS.engagementMax).toBe(100);
      expect(DEFAULT_FILTERS.dateFrom).toBe("");
      expect(DEFAULT_FILTERS.dateTo).toBe("");
      expect(DEFAULT_FILTERS.creatorIds).toEqual([]);
    });
  });

  describe("ITEMS_PER_PAGE", () => {
    test("is 20", () => {
      expect(ITEMS_PER_PAGE).toBe(20);
    });
  });

  describe("tag-based client-side filtering", () => {
    // Simulate the client-side tag filtering from fetchLibraryContent
    function filterByTags(
      items: ContentWithRelations[],
      filters: LibraryFilters
    ): ContentWithRelations[] {
      let results = [...items];

      if (filters.nicheTags.length > 0) {
        results = results.filter((item) =>
          filters.nicheTags.some((tag) =>
            item.content_tags.some(
              (ct) => ct.tag === tag && ct.category === "niche"
            )
          )
        );
      }

      if (filters.hookTypes.length > 0) {
        results = results.filter((item) =>
          filters.hookTypes.some((tag) =>
            item.content_tags.some(
              (ct) => ct.tag === tag && ct.category === "hook_type"
            )
          )
        );
      }

      if (filters.styles.length > 0) {
        results = results.filter((item) =>
          filters.styles.some((tag) =>
            item.content_tags.some(
              (ct) => ct.tag === tag && ct.category === "style"
            )
          )
        );
      }

      return results;
    }

    test("filters by niche tags", () => {
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
      ];

      const result = filterByTags(items, {
        ...DEFAULT_FILTERS,
        nicheTags: ["fitness"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    test("filters by hook type", () => {
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

      const result = filterByTags(items, {
        ...DEFAULT_FILTERS,
        hookTypes: ["question"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    test("filters by style", () => {
      const items = [
        mockContent({
          id: "1",
          content_tags: [
            { id: "t1", content_id: "1", tag: "talking head", category: "style" },
          ],
        }),
        mockContent({
          id: "2",
          content_tags: [
            { id: "t2", content_id: "2", tag: "b-roll", category: "style" },
          ],
        }),
      ];

      const result = filterByTags(items, {
        ...DEFAULT_FILTERS,
        styles: ["b-roll"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    test("combines multiple tag filters with AND logic", () => {
      const items = [
        mockContent({
          id: "1",
          content_tags: [
            { id: "t1", content_id: "1", tag: "fitness", category: "niche" },
            { id: "t2", content_id: "1", tag: "question", category: "hook_type" },
          ],
        }),
        mockContent({
          id: "2",
          content_tags: [
            { id: "t3", content_id: "2", tag: "fitness", category: "niche" },
            { id: "t4", content_id: "2", tag: "bold claim", category: "hook_type" },
          ],
        }),
        mockContent({
          id: "3",
          content_tags: [
            { id: "t5", content_id: "3", tag: "cooking", category: "niche" },
            { id: "t6", content_id: "3", tag: "question", category: "hook_type" },
          ],
        }),
      ];

      const result = filterByTags(items, {
        ...DEFAULT_FILTERS,
        nicheTags: ["fitness"],
        hookTypes: ["question"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    test("returns all items with no tag filters", () => {
      const items = [mockContent({ id: "1" }), mockContent({ id: "2" })];

      const result = filterByTags(items, DEFAULT_FILTERS);

      expect(result).toHaveLength(2);
    });

    test("returns empty when no items match", () => {
      const items = [
        mockContent({
          id: "1",
          content_tags: [
            { id: "t1", content_id: "1", tag: "fitness", category: "niche" },
          ],
        }),
      ];

      const result = filterByTags(items, {
        ...DEFAULT_FILTERS,
        nicheTags: ["nonexistent"],
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("Supabase query builder mock", () => {
    test("fetchLibraryContent builds query with platform filter", async () => {
      // Build a minimal mock of the Supabase client
      const mockQuery = {
        select: mock(() => mockQuery),
        in: mock(() => mockQuery),
        gte: mock(() => mockQuery),
        lte: mock(() => mockQuery),
        order: mock(() => mockQuery),
        range: mock(() =>
          Promise.resolve({ data: [], error: null, count: 0 })
        ),
      };
      const mockSupabase = {
        from: mock(() => mockQuery),
      };

      const { fetchLibraryContent } = await import("@/lib/library-queries");

      const result = await fetchLibraryContent(mockSupabase as any, {
        filters: {
          ...DEFAULT_FILTERS,
          platforms: ["instagram", "tiktok"],
        },
        sortField: "virality_score",
        sortDirection: "desc",
        page: 1,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("content");
      expect(mockQuery.in).toHaveBeenCalledWith("platform", [
        "instagram",
        "tiktok",
      ]);
      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    test("fetchLibraryContent handles Supabase error", async () => {
      const mockQuery = {
        select: mock(() => mockQuery),
        order: mock(() => mockQuery),
        range: mock(() =>
          Promise.resolve({
            data: null,
            error: { message: "DB connection failed" },
            count: null,
          })
        ),
      };
      const mockSupabase = {
        from: mock(() => mockQuery),
      };

      const { fetchLibraryContent } = await import("@/lib/library-queries");

      await expect(
        fetchLibraryContent(mockSupabase as any, {
          filters: DEFAULT_FILTERS,
          sortField: "virality_score",
          sortDirection: "desc",
          page: 1,
        })
      ).rejects.toThrow("Failed to fetch library content: DB connection failed");
    });

    test("fetchCreators returns sorted creators", async () => {
      const mockCreators = [
        { id: "1", handle: "alice", platform: "instagram" },
        { id: "2", handle: "bob", platform: "tiktok" },
      ];
      const mockQuery = {
        select: mock(() => mockQuery),
        order: mock(() =>
          Promise.resolve({ data: mockCreators, error: null })
        ),
      };
      const mockSupabase = {
        from: mock(() => mockQuery),
      };

      const { fetchCreators } = await import("@/lib/library-queries");

      const result = await fetchCreators(mockSupabase as any);

      expect(mockSupabase.from).toHaveBeenCalledWith("creators");
      expect(result).toHaveLength(2);
      expect(result[0].handle).toBe("alice");
    });

    test("fetchAvailableTags deduplicates tags", async () => {
      const mockTags = [
        { tag: "fitness", category: "niche" },
        { tag: "fitness", category: "niche" },
        { tag: "cooking", category: "niche" },
      ];
      const mockQuery = {
        select: mock(() => mockQuery),
        order: mock(() =>
          Promise.resolve({ data: mockTags, error: null })
        ),
      };
      const mockSupabase = {
        from: mock(() => mockQuery),
      };

      const { fetchAvailableTags } = await import("@/lib/library-queries");

      const result = await fetchAvailableTags(mockSupabase as any);

      expect(result).toHaveLength(2);
    });

    test("fetchContentDetail returns null for not found", async () => {
      const mockQuery = {
        select: mock(() => mockQuery),
        eq: mock(() => mockQuery),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "not found" },
          })
        ),
      };
      const mockSupabase = {
        from: mock(() => mockQuery),
      };

      const { fetchContentDetail } = await import("@/lib/library-queries");

      const result = await fetchContentDetail(mockSupabase as any, "nonexistent-id");

      expect(result).toBeNull();
    });
  });
});
