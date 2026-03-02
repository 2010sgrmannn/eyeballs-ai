export function ViralityBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
        N/A
      </span>
    );
  }

  let colorClasses: string;
  if (score >= 70) {
    colorClasses = "bg-green-500/20 text-green-400";
  } else if (score >= 40) {
    colorClasses = "bg-yellow-500/20 text-yellow-400";
  } else {
    colorClasses = "bg-red-500/20 text-red-400";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${colorClasses}`}
    >
      {Math.round(score)}
    </span>
  );
}
