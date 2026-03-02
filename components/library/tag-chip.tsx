import type { TagCategory } from "@/types/database";

const CATEGORY_COLORS: Record<TagCategory, string> = {
  niche: "bg-purple-500/20 text-purple-400",
  topic: "bg-blue-500/20 text-blue-400",
  style: "bg-emerald-500/20 text-emerald-400",
  hook_type: "bg-orange-500/20 text-orange-400",
  emotion: "bg-pink-500/20 text-pink-400",
};

export function TagChip({
  tag,
  category,
}: {
  tag: string;
  category: TagCategory | null;
}) {
  const colors = category
    ? CATEGORY_COLORS[category]
    : "bg-neutral-800 text-neutral-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors}`}
    >
      {tag}
    </span>
  );
}
