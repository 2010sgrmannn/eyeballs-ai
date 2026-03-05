import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set all required vars so tests start clean
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.APIFY_API_TOKEN = "test-apify-token";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("passes when all env vars are set", () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => validateEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws when ANTHROPIC_API_KEY is missing (server-side)", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => validateEnv()).toThrow("ANTHROPIC_API_KEY");
  });

  it("lists all missing variables in the error message", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.OPENAI_API_KEY;
    try {
      validateEnv();
      throw new Error("should have thrown");
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(msg).toContain("OPENAI_API_KEY");
    }
  });
});
