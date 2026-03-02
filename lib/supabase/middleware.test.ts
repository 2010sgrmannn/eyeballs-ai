import { describe, it, expect, beforeAll, mock } from "bun:test";
import type { User } from "@supabase/supabase-js";

// Mock the Supabase SSR module before importing middleware
const mockGetUser = mock(() =>
  Promise.resolve({ data: { user: null as User | null }, error: null })
);

const mockSelect = mock(() => ({
  eq: mock(() => ({
    single: mock(() => Promise.resolve({ data: null, error: null })),
  })),
}));

const mockFrom = mock(() => ({
  select: mockSelect,
}));

mock.module("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
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

function setupMocks(user: User | null, hasProfile: boolean) {
  mockGetUser.mockResolvedValueOnce({
    data: { user },
    error: null,
  });

  const mockSingle = mock(() =>
    Promise.resolve({
      data: hasProfile ? { id: "profile-1" } : null,
      error: hasProfile ? null : { code: "PGRST116" },
    })
  );
  const mockEq = mock(() => ({ single: mockSingle }));
  const mockSelectInner = mock(() => ({ eq: mockEq }));
  mockFrom.mockReturnValueOnce({ select: mockSelectInner });
}

const testUser = { id: "user-1", email: "test@test.com" } as User;

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
      data: { user: testUser },
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
      data: { user: testUser },
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

  it("redirects authenticated user without profile from /dashboard to /dashboard/onboarding", async () => {
    setupMocks(testUser, false);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard/onboarding");
  });

  it("allows authenticated user without profile to access /dashboard/onboarding", async () => {
    setupMocks(testUser, false);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard/onboarding");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("redirects authenticated user with profile from /dashboard/onboarding to /dashboard", async () => {
    setupMocks(testUser, true);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard/onboarding");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard");
    // Should not contain /onboarding in the redirect target
    expect(location).not.toContain("/onboarding");
  });

  it("allows authenticated user with profile to access /dashboard", async () => {
    setupMocks(testUser, true);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("allows authenticated user with profile to access /dashboard/settings", async () => {
    setupMocks(testUser, true);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard/settings");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("redirects authenticated user without profile from /dashboard/settings to /dashboard/onboarding", async () => {
    setupMocks(testUser, false);

    const { updateSession } = await import("@/lib/supabase/middleware");
    const request = makeRequest("/dashboard/settings");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard/onboarding");
  });
});
