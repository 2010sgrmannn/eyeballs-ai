import { describe, it, expect, beforeAll, mock } from "bun:test";
import type { AuthError } from "@supabase/supabase-js";

const mockExchangeCodeForSession = mock(() =>
  Promise.resolve({ data: {}, error: null as AuthError | null })
);

mock.module("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

describe("Auth callback route", () => {
  it("redirects to /dashboard on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/auth/callback?code=test-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard");
  });

  it("redirects to custom next path when provided", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/auth/callback?code=test-code&next=/dashboard/settings"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard/settings");
  });

  it("redirects to /login with error when no code provided", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("error=auth_callback_error");
  });

  it("redirects to /login with error when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid code" } as AuthError,
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/auth/callback?code=invalid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("error=auth_callback_error");
  });
});
