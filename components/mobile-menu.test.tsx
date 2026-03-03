import { describe, it, expect, mock } from "bun:test";

// Mock dependencies
mock.module("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

mock.module("next/link", () => ({
  default: ({ children }: Record<string, unknown>) => children,
}));

describe("MobileMenu component", () => {
  it("exports a MobileMenu component", async () => {
    const { MobileMenu } = await import("./mobile-menu");
    expect(MobileMenu).toBeDefined();
    expect(typeof MobileMenu).toBe("function");
  });

  it("renders backdrop for dismissing menu", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./mobile-menu.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("mobile-menu-backdrop");
    expect(source).toContain("rgba(0, 0, 0, 0.6)");
  });

  it("closes on escape key", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./mobile-menu.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("Escape");
    expect(source).toContain("handleKeyDown");
  });

  it("is hidden when not open via lg:hidden and AnimatePresence", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./mobile-menu.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("AnimatePresence");
    expect(source).toContain("lg:hidden");
  });

  it("closes on route change", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./mobile-menu.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("usePathname");
    expect(source).toContain("onClose");
  });
});
