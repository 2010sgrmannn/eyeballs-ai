import { describe, it, expect, beforeAll, mock } from "bun:test";
import type { User } from "@supabase/supabase-js";

// Mock the Supabase SSR module before importing middleware
const mockGetUser = mock(() =>
  Promise.resolve({ data: { user: null as User | null }, error: null })
);

mock.module("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

function makeNextUrl(pathname: string) {
  const url = new URL(pathname, "http://localhost:3000");
  return Object.assign(url, {
    clone() {
      return makeNextUrl(url.pathname);
    },
  });
}

function makeRequest(pathname: string) {
  const cookieMap = new Map<string, string>();

  return {
    nextUrl: makeNextUrl(pathname),
    url: `http://localhost:3000${pathname}`,
    cookies: {
      getAll: () => [] as { name: string; value: string }[],
      set: (name: string, value: string) => cookieMap.set(name, value),
      get: (name: string) => cookieMap.get(name),
    },
  } as any;
}

describe("Supabase middleware - updateSession", () => {
  it("redirects unauthenticated users from /dashboard to /login", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
  });

  it("redirects unauthenticated users from /dashboard/settings to /login", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard/settings");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
  });

  it("redirects authenticated users from /login to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "test@test.com" } as User },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard");
  });

  it("redirects authenticated users from /signup to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "test@test.com" } as User },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/signup");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard");
  });

  it("allows unauthenticated users to access /login", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/login");
    const response = await updateSession(request);

    // Should not redirect - status 200
    expect(response.status).toBe(200);
  });

  it("allows authenticated users to access /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "test@test.com" } as User },
      error: null,
    });

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });
});
