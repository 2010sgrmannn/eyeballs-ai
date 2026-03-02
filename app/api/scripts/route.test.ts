import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";

const mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: { id: "user-123", email: "test@test.com" } as { id: string; email: string } | null },
  })
);

const mockScripts = [
  {
    id: "script-1",
    user_id: "user-123",
    title: "Script One",
    topic: "growth",
    script_body: JSON.stringify({ hook: "h", body: "b", cta: "c" }),
    platform: "instagram",
    created_at: "2026-03-01T00:00:00Z",
    niche: { id: "n1", name: "Marketing" },
  },
];

function createChainMock(resolveValue: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  chain.select = mock(() => chain);
  chain.eq = mock(() => chain);
  chain.order = mock(() => Promise.resolve(resolveValue));
  chain.single = mock(() => Promise.resolve(resolveValue));
  return chain;
}

const mockSupabaseFrom = mock((_table: string) =>
  createChainMock({ data: mockScripts, error: null })
);

mock.module("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockSupabaseFrom,
    }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

beforeEach(() => {
  mockGetUser.mockImplementation(() =>
    Promise.resolve({
      data: { user: { id: "user-123", email: "test@test.com" } },
    })
  );
});

describe("GET /api/scripts", () => {
  it("returns user scripts ordered by created_at DESC", async () => {
    const { GET } = await import("@/app/api/scripts/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("script-1");
    expect(data[0].niche.name).toBe("Marketing");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: null } })
    );

    const { GET } = await import("@/app/api/scripts/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});
