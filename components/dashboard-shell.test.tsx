import { describe, it, expect, mock } from "bun:test";

// Mock dependencies
mock.module("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

mock.module("next/link", () => ({
  default: ({ children }: Record<string, unknown>) => children,
}));

mock.module("@/app/dashboard/logout-button", () => ({
  LogoutButton: () => null,
}));

describe("DashboardShell component", () => {
  it("exports a DashboardShell component", async () => {
    const { DashboardShell } = await import("./dashboard-shell");
    expect(DashboardShell).toBeDefined();
    expect(typeof DashboardShell).toBe("function");
  });

  it("uses dark theme background", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./dashboard-shell.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("--color-background");
  });

  it("has desktop sidebar hidden on mobile", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./dashboard-shell.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("hidden lg:block");
  });

  it("includes mobile menu component", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./dashboard-shell.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("MobileMenu");
    expect(source).toContain("mobileMenuOpen");
  });

  it("has main content area with test id", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./dashboard-shell.tsx", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain('data-testid="main-content"');
  });
});

describe("Dashboard layout (server)", () => {
  it("layout file imports DashboardShell", async () => {
    const fs = await import("fs");
    const layoutPath = new URL(
      "../app/dashboard/layout.tsx",
      import.meta.url
    ).pathname;
    const source = fs.readFileSync(layoutPath, "utf-8");
    expect(source).toContain("DashboardShell");
    expect(source).toContain("createClient");
    expect(source).toContain('redirect("/login")');
  });
});
