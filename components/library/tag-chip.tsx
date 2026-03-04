import type { TagCategory } from "@/types/database";

export function TagChip({
  tag,
  category,
}: {
  tag: string;
  category: TagCategory | null;
}) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        background: "#242424",
        color: "#A1A1A1",
        fontFamily: "var(--font-body)",
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: "4px",
        padding: "2px 8px",
      }}
    >
      {tag}
    </span>
  );
}
