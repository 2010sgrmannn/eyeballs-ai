export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-16"
      style={{ border: "1px dashed #1F1F1F" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#333"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-4"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <h3
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "18px",
          fontWeight: 600,
          color: "#E0E0E0",
        }}
      >
        {hasFilters ? "No content matches your filters" : "No content yet"}
      </h3>
      <p
        className="mt-2 max-w-sm text-center"
        style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888" }}
      >
        {hasFilters
          ? "Try adjusting your filters or clearing them to see all content."
          : "Scrape some content to get started."}
      </p>
    </div>
  );
}
