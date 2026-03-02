"use client";

interface AnalysisStatusBadgeProps {
  analyzedAt: string | null;
  viralityScore?: number | null;
}

/**
 * Displays analysis status on content cards.
 * Shows "Pending" (yellow) when not yet analyzed, or "Analyzed" (green) with
 * optional virality score when analysis is complete.
 */
export function AnalysisStatusBadge({
  analyzedAt,
  viralityScore,
}: AnalysisStatusBadgeProps) {
  if (!analyzedAt) {
    return (
      <span
        data-testid="analysis-status-pending"
        className="inline-flex items-center gap-1 rounded-full bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-400"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
        Pending
      </span>
    );
  }

  return (
    <span
      data-testid="analysis-status-analyzed"
      className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
      Analyzed
      {viralityScore != null && (
        <span className="ml-1 text-green-300">({viralityScore})</span>
      )}
    </span>
  );
}
