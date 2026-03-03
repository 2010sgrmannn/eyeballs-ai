import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";

// Mock data
const mockUser = { id: "user-123", email: "test@example.com" };

const mockContentRows = [
  {
    id: "content-1",
    user_id: "user-123",
    creator_id: "creator-1",
    platform: "tiktok",
    caption: "Amazing hook! Follow for more.",
    content_type: "video",
    view_count: 10000,
    like_count: 1000,
    comment_count: 50,
    share_count: 20,
    engagement_ratio: 0.107,
    analyzed_at: null,
    creators: { follower_count: 50000 },
  },
];

// Create a fully chainable mock query builder using Proxy to handle all methods
function createChainedQuery(finalData: unknown, finalError: unknown = null) {
  const terminal = Promise.resolve({ data: finalData, error: finalError });

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") {
        return terminal.then.bind(terminal);
      }
      if (prop === "limit") {
        return () => terminal;
      }
      if (prop === "insert") {
        return () => Promise.resolve({ error: null });
      }
      // All other methods (select, eq, is, in, order, delete, update, etc.)
      // return the proxy itself for chaining
      return () => new Proxy({}, handler);
    },
  };

  return new Proxy({}, handler);
}

// Track what `from` returns per table
let contentQuery = createChainedQuery(mockContentRows);
let contentUpdateQuery = createChainedQuery(null);
let contentTagsQuery = createChainedQuery(null);

let mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: mockUser as typeof mockUser | null },
    error: null as { message: string } | null,
  })
);

const mockSupabase = {
  auth: {
    getUser: () => mockGetUser(),
  },
  from: mock((table: string) => {
    if (table === "content_tags") return contentTagsQuery;
    return contentQuery;
  }),
};

mock.module("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock analyzer module
let shouldThrowOnCreateClient = false;

const mockAnalysisResult = {
  transcript: "A fitness video about workout routines",
  hook_text: "Amazing hook!",
  cta_text: "Follow for more.",
  virality_score: 75,
  tags: [
    { tag: "fitness", category: "niche" },
    { tag: "workout", category: "topic" },
  ],
};

mock.module("@/services/analyzer", () => ({
  createAnthropicClient: () => {
    if (shouldThrowOnCreateClient) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required for content analysis");
    }
    return { messages: { create: mock(() => ({})) } };
  },
  analyzeContent: () => Promise.resolve(mockAnalysisResult),
  analyzeContentLocal: () => Promise.resolve(mockAnalysisResult),
  analyzeContentBatch: async (
    items: unknown[],
    fn: (item: unknown) => Promise<unknown>
  ) => {
    const results = [];
    for (const item of items) {
      try {
        const result = await fn(item);
        results.push(result);
      } catch (err) {
        results.push({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return results;
  },
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
});

describe("POST /api/analyze", () => {
  beforeEach(() => {
    mockGetUser = mock(() =>
      Promise.resolve({
        data: { user: mockUser as typeof mockUser | null },
        error: null as { message: string } | null,
      })
    );
    contentQuery = createChainedQuery(mockContentRows);
    contentTagsQuery = createChainedQuery(null);
    shouldThrowOnCreateClient = false;
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser = mock(() =>
      Promise.resolve({
        data: { user: null as typeof mockUser | null },
        error: { message: "Not authenticated" } as { message: string } | null,
      })
    );

    const { POST } = await import("@/app/api/analyze/route");
    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns empty results when no content to analyze", async () => {
    contentQuery = createChainedQuery([]);

    const { POST } = await import("@/app/api/analyze/route");
    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.analyzed).toBe(0);
    expect(json.errors).toBe(0);
    expect(json.results).toHaveLength(0);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    shouldThrowOnCreateClient = true;

    const { POST } = await import("@/app/api/analyze/route");
    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toContain("ANTHROPIC_API_KEY");
  });

  it("handles database fetch errors", async () => {
    contentQuery = createChainedQuery(null, {
      message: "Database connection failed",
    });

    const { POST } = await import("@/app/api/analyze/route");
    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toContain("Failed to fetch content");
  });
});
