import { describe, it, expect, beforeAll, mock } from "bun:test";

const mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  })
);

const mockSelect = mock(() => ({
  eq: () => ({
    order: () =>
      Promise.resolve({
        data: [
          {
            id: "creator-1",
            user_id: "user-123",
            platform: "instagram",
            handle: "testuser",
            display_name: "Test User",
            follower_count: 50000,
            scraped_at: "2026-03-01T12:00:00Z",
            created_at: "2026-03-01T10:00:00Z",
          },
        ],
        error: null,
      }),
  }),
}));

const mockContentSelect = mock(() => ({
  in: () =>
    Promise.resolve({
      data: [
        { creator_id: "creator-1" },
        { creator_id: "creator-1" },
        { creator_id: "creator-1" },
      ],
      error: null,
    }),
}));

const mockFrom = mock((table: string) => {
  if (table === "creators") {
    return { select: mockSelect };
  }
  if (table === "content") {
    return { select: mockContentSelect };
  }
  return {};
});

mock.module("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

describe("GET /api/creators", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null as unknown as { id: string; email: string } },
      error: null,
    });

    const { GET } = await import("@/app/api/creators/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns creators with post counts", async () => {
    const { GET } = await import("@/app/api/creators/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.creators).toHaveLength(1);
    expect(data.creators[0].handle).toBe("testuser");
    expect(data.creators[0].post_count).toBe(3);
  });

  it("returns empty array when no creators exist", async () => {
    mockSelect.mockReturnValueOnce({
      eq: () => ({
        order: () =>
          Promise.resolve({
            data: [],
            error: null,
          }),
      }),
    });

    const { GET } = await import("@/app/api/creators/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.creators).toHaveLength(0);
  });
});
