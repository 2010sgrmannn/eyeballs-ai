import { describe, it, expect, mock } from "bun:test";

// Mock the logout button dependency
mock.module("@/app/dashboard/logout-button", () => ({
  LogoutButton: () => null,
}));

// Mock next/navigation
mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));

describe("Header component", () => {
  it("exports a Header component", async () => {
    const { Header } = await import("./header");
    expect(Header).toBeDefined();
    expect(typeof Header).toBe("function");
  });

  it("contains logo text in source", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./header.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("EYEBALLS.AI");
  });

  it("renders user email via props", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./header.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("userEmail");
    expect(source).toContain('data-testid="user-email"');
  });

  it("includes LogoutButton", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./header.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("LogoutButton");
  });

  it("includes hamburger menu toggle for mobile", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./header.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("onMenuToggle");
    expect(source).toContain("Toggle menu");
    expect(source).toContain("lg:hidden");
  });

  it("uses glass design tokens for styling", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./header.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("--color-border");
    expect(source).toContain("backdropFilter");
  });
});
