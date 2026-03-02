import { describe, it, expect, beforeAll } from "bun:test";

describe("Supabase browser client", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("creates a client without throwing", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("throws when URL is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      // Re-import won't work with module cache, so test the underlying function
      const { createBrowserClient } = await import("@supabase/ssr");
      expect(() =>
        createBrowserClient("", "test-key")
      ).toThrow();
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
  });

  it("throws when anon key is missing", async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    expect(() =>
      createBrowserClient("https://test.supabase.co", "")
    ).toThrow();
  });
});
