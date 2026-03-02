import type { Platform } from "@/types/database";

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  tiktok: "bg-neutral-800",
  linkedin: "bg-blue-700",
  twitter: "bg-sky-500",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "IG",
  tiktok: "TT",
  linkedin: "LI",
  twitter: "X",
};

export function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${PLATFORM_COLORS[platform] ?? "bg-neutral-700"}`}
    >
      {PLATFORM_LABELS[platform] ?? "?"}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${PLATFORM_COLORS[platform] ?? "bg-neutral-700"}`}
    >
      {PLATFORM_LABELS[platform] ?? platform}
      <span className="capitalize">{platform}</span>
    </span>
  );
}
