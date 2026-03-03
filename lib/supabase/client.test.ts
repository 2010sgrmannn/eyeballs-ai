import { describe, it, expect, beforeAll } from "bun:test";

describe("Supabase browser client", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("client module exports createClient function", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./client.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("export function createClient");
    expect(source).toContain("createBrowserClient");
    expect(source).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(source).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("uses @supabase/ssr createBrowserClient", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./client.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain('import { createBrowserClient } from "@supabase/ssr"');
  });
});
