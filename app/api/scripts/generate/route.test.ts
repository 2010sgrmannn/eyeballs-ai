import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";

// --- Mocks ---

const mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: { id: "user-123", email: "test@test.com" } as { id: string; email: string } | null },
  })
);

const mockFrom = mock();
const mockSelect = mock();
const mockEq = mock();
const mockSingle = mock();
const mockOrder = mock();
const mockLimit = mock();
const mockIn = mock();
const mockInsert = mock();

function createChainMock(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {};
  chain.select = mock(() => chain);
  chain.eq = mock(() => chain);
  chain.single = mock(() => Promise.resolve({ data: null, error: null }));
  chain.order = mock(() => chain);
  chain.limit = mock(() => chain);
  chain.in = mock(() => chain);
  chain.insert = mock(() => chain);
  // Apply overrides last
  Object.assign(chain, overrides);
  return chain;
}

let brandProfileChain: ReturnType<typeof createChainMock>;
let contentChain: ReturnType<typeof createChainMock>;
let nichesChain: ReturnType<typeof createChainMock>;
let tagsChain: ReturnType<typeof createChainMock>;
let insertChain: ReturnType<typeof createChainMock>;

const mockSupabaseFrom = mock((table: string) => {
  if (table === "brand_profiles") return brandProfileChain;
  if (table === "content") return contentChain;
  if (table === "niches") return nichesChain;
  if (table === "content_tags") return tagsChain;
  if (table === "scripts") return insertChain;
  return createChainMock();
});

mock.module("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockSupabaseFrom,
    }),
}));

const mockAnthropicCreate = mock(() =>
  Promise.resolve({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          hook: "Did you know this one trick?",
          body: "Here is the main content about productivity.",
          cta: "Follow for more tips!",
        }),
      },
    ],
  })
);

mock.module("@/lib/anthropic", () => ({
  getAnthropicClient: () => ({
    messages: { create: mockAnthropicCreate },
  }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.ANTHROPIC_API_KEY = "test-key";
});

beforeEach(() => {
  mockGetUser.mockImplementation(() =>
    Promise.resolve({
      data: { user: { id: "user-123", email: "test@test.com" } },
    })
  );

  brandProfileChain = createChainMock({
    single: mock(() =>
      Promise.resolve({
        data: {
          brand_voice: "Professional and friendly",
          values: ["innovation"],
          target_audience: "entrepreneurs",
          content_style: "educational",
          niche: "business",
        },
        error: null,
      })
    ),
  });

  contentChain = createChainMock({
    limit: mock(() =>
      Promise.resolve({
        data: [
          {
            id: "content-1",
            hook_text: "Stop scrolling!",
            cta_text: "Follow for more",
            caption: "A viral post about growth",
            virality_score: 95,
          },
        ],
      })
    ),
  });

  nichesChain = createChainMock();
  tagsChain = createChainMock();

  insertChain = createChainMock({
    insert: mock(() => {
      const c: Record<string, unknown> = {};
      c.select = mock(() => c);
      c.single = mock(() =>
        Promise.resolve({
          data: {
            id: "script-1",
            user_id: "user-123",
            title: "Productivity tips",
            topic: "Productivity tips",
            script_body: JSON.stringify({
              hook: "Did you know this one trick?",
              body: "Here is the main content about productivity.",
              cta: "Follow for more tips!",
            }),
            platform: "instagram",
            script_style: "short",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        })
      );
      return c;
    }),
  });
});

describe("POST /api/scripts/generate", () => {
  it("generates a script successfully with brand voice and viral content", async () => {
    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Productivity tips",
        platform: "instagram",
        script_style: "short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBe("script-1");
    expect(data.title).toBe("Productivity tips");
    expect(data.platform).toBe("instagram");

    // Verify Claude was called
    expect(mockAnthropicCreate).toHaveBeenCalled();
    const callArgs = mockAnthropicCreate.mock.calls[0] as unknown as [Record<string, unknown>];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createArgs = callArgs[0] as any;
    expect(createArgs.model).toBe("claude-sonnet-4-20250514");

    // Verify prompt includes brand voice and viral content
    const promptContent = createArgs.messages[0].content as string;
    expect(promptContent).toContain("Productivity tips");
    expect(promptContent).toContain("Professional and friendly");
    expect(promptContent).toContain("Stop scrolling!");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: null } })
    );

    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "test",
        platform: "instagram",
        script_style: "short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when topic is missing", async () => {
    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        script_style: "short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Topic is required");
  });

  it("returns 400 when platform is invalid", async () => {
    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "test",
        platform: "facebook",
        script_style: "short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Valid platform is required");
  });

  it("returns 400 when script_style is invalid", async () => {
    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "test",
        platform: "instagram",
        script_style: "extra_long",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Valid script_style is required");
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 502 when Claude API fails", async () => {
    mockAnthropicCreate.mockImplementationOnce(() => {
      throw new Error("API rate limit exceeded");
    });

    const { POST } = await import("@/app/api/scripts/generate/route");
    const request = new Request("http://localhost:3000/api/scripts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "test topic",
        platform: "instagram",
        script_style: "short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toContain("Failed to generate script");
  });
});
