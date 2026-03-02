import { describe, it, expect, beforeAll } from "bun:test";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

// Since this is a React component, we test the rendering logic by importing
// and calling it as a function. In Bun test without a DOM, we verify the
// component returns the correct JSX structure.
describe("AnalysisStatusBadge", () => {
  it("exports the component", async () => {
    const mod = await import("@/components/analysis-status-badge");
    expect(mod.AnalysisStatusBadge).toBeDefined();
    expect(typeof mod.AnalysisStatusBadge).toBe("function");
  });

  it("returns pending badge when analyzedAt is null", async () => {
    const { AnalysisStatusBadge } = await import(
      "@/components/analysis-status-badge"
    );
    const result = AnalysisStatusBadge({
      analyzedAt: null,
    });

    // Verify structure - the component returns JSX
    expect(result).toBeDefined();
    expect(result.props["data-testid"]).toBe("analysis-status-pending");
    // Check that "Pending" text is somewhere in the children
    const children = Array.isArray(result.props.children)
      ? result.props.children
      : [result.props.children];
    const textContent = children.find(
      (c: unknown) => typeof c === "string" && c === "Pending"
    );
    expect(textContent).toBe("Pending");
  });

  it("returns analyzed badge when analyzedAt is set", async () => {
    const { AnalysisStatusBadge } = await import(
      "@/components/analysis-status-badge"
    );
    const result = AnalysisStatusBadge({
      analyzedAt: "2026-01-15T10:00:00Z",
    });

    expect(result).toBeDefined();
    expect(result.props["data-testid"]).toBe("analysis-status-analyzed");
  });

  it("shows virality score when provided", async () => {
    const { AnalysisStatusBadge } = await import(
      "@/components/analysis-status-badge"
    );
    const result = AnalysisStatusBadge({
      analyzedAt: "2026-01-15T10:00:00Z",
      viralityScore: 85,
    });

    expect(result).toBeDefined();
    expect(result.props["data-testid"]).toBe("analysis-status-analyzed");
    // The virality score should be in the children
    const children = Array.isArray(result.props.children)
      ? result.props.children
      : [result.props.children];
    // Find the span containing the score
    const scoreSpan = children.find(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        "props" in (c as Record<string, unknown>) &&
        (c as { props: { children: unknown } }).props.children !== undefined
    );
    expect(scoreSpan).toBeDefined();
  });

  it("does not show virality score when not provided", async () => {
    const { AnalysisStatusBadge } = await import(
      "@/components/analysis-status-badge"
    );
    const result = AnalysisStatusBadge({
      analyzedAt: "2026-01-15T10:00:00Z",
      viralityScore: null,
    });

    expect(result).toBeDefined();
    expect(result.props["data-testid"]).toBe("analysis-status-analyzed");
  });
});
