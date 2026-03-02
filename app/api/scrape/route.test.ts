import { describe, it, expect, beforeAll, mock } from "bun:test";

const mockGetUser = mock(() =>
  Promise.resolve({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  })
);

const mockUpsert = mock(() => ({
  select: () => ({
    single: () =>
      Promise.resolve({
        data: {
          id: "creator-456",
          user_id: "user-123",
          platform: "instagram",
          handle: "testcreator",
        },
        error: null,
      }),
  }),
}));

const mockUpdate = mock(() => ({
  eq: () => Promise.resolve({ error: null }),
}));

const mockContentUpsert = mock(() => Promise.resolve({ error: null }));

const mockFrom = mock((table: string) => {
  if (table === "creators") {
    return {
      upsert: mockUpsert,
      update: mockUpdate,
    };
  }
  if (table === "content") {
    return {
      upsert: mockContentUpsert,
    };
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

describe("POST /api/scrape", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null as unknown as { id: string; email: string } },
      error: null,
    });

    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        handle: "test",
        depth: 7,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid platform", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        handle: "test",
        depth: 7,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Invalid platform");
  });

  it("returns 400 for missing handle", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        handle: "",
        depth: 7,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Handle is required");
  });

  it("returns 400 for invalid depth", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        handle: "test",
        depth: 15,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Invalid depth");
  });

  it("returns 500 for unsupported platform scraping (e.g. tiktok)", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "tiktok",
        handle: "test",
        depth: 7,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain("not yet implemented");
  });

  it("succeeds for valid instagram scrape request", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        handle: "@testcreator",
        depth: 7,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.handle).toBe("testcreator");
    expect(data.platform).toBe("instagram");
    expect(data.postCount).toBe(7);
    expect(data.displayName).toBeTruthy();
    expect(data.followerCount).toBeGreaterThan(0);
  });

  it("strips @ from handle", async () => {
    const { POST } = await import("@/app/api/scrape/route");
    const request = new Request("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        handle: "@myhandle",
        depth: 7,
      }),
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.handle).toBe("myhandle");
  });
});
