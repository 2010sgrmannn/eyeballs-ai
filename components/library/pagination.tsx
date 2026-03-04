"use client";

import { ITEMS_PER_PAGE } from "@/types/database";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalCount,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg px-3 py-1.5 text-sm transition-all duration-200 hover:bg-[#161616] disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          border: "1px solid #1F1F1F",
          background: "#1A1A1A",
          color: "#888",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === null ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2"
            style={{ color: "#555", fontFamily: "var(--font-mono)" }}
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className="rounded-lg px-3 py-1.5 text-sm transition-all duration-200"
            style={{
              border: p === currentPage ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
              background: p === currentPage ? "#FF2D2D" : "#111",
              color: p === currentPage ? "#FFFFFF" : "#888",
              fontFamily: "var(--font-mono)",
              fontWeight: p === currentPage ? 600 : 400,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg px-3 py-1.5 text-sm transition-all duration-200 hover:bg-[#161616] disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          border: "1px solid #1F1F1F",
          background: "#1A1A1A",
          color: "#888",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Next
      </button>
    </div>
  );
}

function getPageNumbers(
  current: number,
  total: number
): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (current > 3) {
    pages.push(null);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}
