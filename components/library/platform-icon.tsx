import type { Platform } from "@/types/database";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "IG",
  tiktok: "TT",
  linkedin: "LI",
  twitter: "X",
};

export function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold"
      style={{
        border: "1px solid #1F1F1F",
        background: "#161616",
        color: "#888",
        fontFamily: "var(--font-body)",
      }}
    >
      {PLATFORM_LABELS[platform] ?? "?"}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
      style={{
        border: "1px solid #1F1F1F",
        background: "#161616",
        color: "#888",
        fontFamily: "var(--font-body)",
        fontSize: "11px",
        fontWeight: 500,
        textTransform: "capitalize",
      }}
    >
      {platform}
    </span>
  );
}
