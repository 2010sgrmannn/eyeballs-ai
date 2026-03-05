export function ViralityBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5"
        style={{
          background: "#1A1A1A",
          color: "#555",
          fontFamily: "'IBM Plex Mono', var(--font-mono)",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        N/A
      </span>
    );
  }

  let borderColor: string;
  let bgColor: string;
  let textColor: string;

  if (score >= 70) {
    borderColor = "rgba(255, 45, 45, 0.3)";
    bgColor = "rgba(255, 45, 45, 0.15)";
    textColor = "#ff3333";
  } else if (score >= 40) {
    borderColor = "rgba(161, 161, 161, 0.3)";
    bgColor = "rgba(161, 161, 161, 0.1)";
    textColor = "#A1A1A1";
  } else {
    borderColor = "rgba(107, 107, 107, 0.3)";
    bgColor = "rgba(107, 107, 107, 0.1)";
    textColor = "#6B6B6B";
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5"
      style={{
        border: `1px solid ${borderColor}`,
        background: bgColor,
        color: textColor,
        fontFamily: "'IBM Plex Mono', var(--font-mono)",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {Math.round(score)}
    </span>
  );
}
