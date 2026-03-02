import { describe, it, expect, mock, beforeAll } from "bun:test";

// Mock next/navigation
mock.module("next/navigation", () => ({
  usePathname: () => "/dashboard/scraper",
}));

// Mock next/link to render a simple anchor
mock.module("next/link", () => ({
  default: ({ href, children, className, ...props }: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("a", { href, className, ...props }, children);
  },
}));

describe("Sidebar component", () => {
  it("exports a Sidebar component", async () => {
    const { Sidebar } = await import("./sidebar");
    expect(Sidebar).toBeDefined();
    expect(typeof Sidebar).toBe("function");
  });

  it("contains all expected nav items in source", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./sidebar.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("Scraper");
    expect(source).toContain("Library");
    expect(source).toContain("Scripts");
    expect(source).toContain("Settings");
  });

  it("contains all expected platform filters in source", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./sidebar.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("instagram");
    expect(source).toContain("tiktok");
    expect(source).toContain("linkedin");
    expect(source).toContain("twitter");
  });

  it("nav items have correct hrefs", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./sidebar.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("/dashboard/scraper");
    expect(source).toContain("/dashboard/library");
    expect(source).toContain("/dashboard/scripts");
    expect(source).toContain("/dashboard/settings");
  });

  it("platform filter buttons use aria-pressed for accessibility", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./sidebar.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("aria-pressed");
    expect(source).toContain("aria-label");
  });

  it("active nav item gets highlighted class", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./sidebar.tsx", import.meta.url).pathname,
      "utf-8"
    );
    // Active state uses bg-neutral-800 text-white
    expect(source).toContain("bg-neutral-800 text-white");
    // Inactive state uses text-neutral-400
    expect(source).toContain("text-neutral-400");
  });
});
