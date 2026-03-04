"use client";

interface AnalysisStatusBadgeProps {
  analyzedAt: string | null;
  viralityScore?: number | null;
}

export function AnalysisStatusBadge({
  analyzedAt,
  viralityScore,
}: AnalysisStatusBadgeProps) {
  if (!analyzedAt) {
    return (
      <span
        data-testid="analysis-status-pending"
        className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium"
        style={{
          border: "1px solid rgba(251, 191, 36, 0.3)",
          background: "rgba(251, 191, 36, 0.08)",
          color: "#FBBF24",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "#FBBF24" }}
        />
        Pending
      </span>
    );
  }

  return (
    <span
      data-testid="analysis-status-analyzed"
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium"
      style={{
        border: "1px solid rgba(52, 211, 153, 0.3)",
        background: "rgba(52, 211, 153, 0.08)",
        color: "#34D399",
        fontFamily: "var(--font-mono)",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "#34D399" }}
      />
      Analyzed
      {viralityScore != null && (
        <span style={{ color: "#34D399", opacity: 0.7 }}>({viralityScore})</span>
      )}
    </span>
  );
}
