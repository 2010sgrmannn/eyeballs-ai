"use client";

interface ContentTypeBadgeProps {
  content_type: string | null;
  carousel_urls: string[] | null;
}

export function ContentTypeBadge({ content_type, carousel_urls }: ContentTypeBadgeProps) {
  let label: string;

  if (content_type === "reel" || content_type === "video") {
    label = "REEL";
  } else if (carousel_urls && carousel_urls.length > 0) {
    label = `CAROUSEL \u00B7 ${carousel_urls.length}`;
  } else {
    label = "POST";
  }

  return (
    <span
      style={{
        background: "rgba(10,10,10,0.8)",
        border: "1px solid #2A2A2A",
        color: "#E0E0E0",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        padding: "2px 6px",
        borderRadius: "4px",
      }}
    >
      {label}
    </span>
  );
}
