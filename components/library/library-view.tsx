"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchLibraryContent,
  type FetchLibraryResult,
} from "@/lib/library-queries";
import type {
  ContentWithRelations,
  LibraryFilters,
  SortField,
  SortDirection,
  GroupByField,
  Creator,
  ContentTag,
} from "@/types/database";
import { DEFAULT_FILTERS } from "@/types/database";
import { FilterSidebar } from "./filter-sidebar";
import { ContentCard } from "./content-card";
import { ContentDetailModal } from "./content-detail-modal";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";

interface LibraryViewProps {
  initialData: FetchLibraryResult;
  creators: Creator[];
  availableTags: ContentTag[];
}

function groupContent(
  items: ContentWithRelations[],
  groupBy: GroupByField | "none"
): Map<string, ContentWithRelations[]> {
  if (groupBy === "none") {
    return new Map([["all", items]]);
  }

  const groups = new Map<string, ContentWithRelations[]>();

  for (const item of items) {
    let key: string;
    switch (groupBy) {
      case "creator":
        key = item.creators?.handle
          ? `@${item.creators.handle}`
          : "Unknown Creator";
        break;
      case "platform":
        key = item.platform ?? item.creators?.platform ?? "Unknown";
        break;
      case "niche": {
        const nicheTag = item.content_tags?.find(
          (t) => t.category === "niche"
        );
        key = nicheTag?.tag ?? "Untagged";
        break;
      }
      case "hook_type": {
        const hookTag = item.content_tags?.find(
          (t) => t.category === "hook_type"
        );
        key = hookTag?.tag ?? "Unknown";
        break;
      }
      default:
        key = "all";
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

export function LibraryView({
  initialData,
  creators,
  availableTags,
}: LibraryViewProps) {
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("virality_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [groupBy, setGroupBy] = useState<GroupByField | "none">("none");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<FetchLibraryResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] =
    useState<ContentWithRelations | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const fetchData = useCallback(
    async (
      f: LibraryFilters,
      sf: SortField,
      sd: SortDirection,
      p: number
    ) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const data = await fetchLibraryContent(supabase, {
          filters: f,
          sortField: sf,
          sortDirection: sd,
          page: p,
        });
        setResult(data);
      } catch (err) {
        console.error("Failed to fetch library content:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Refetch when filters, sort, or page change (skip initial)
  const [isInitial, setIsInitial] = useState(true);
  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }
    fetchData(filters, sortField, sortDirection, page);
  }, [filters, sortField, sortDirection, page, fetchData, isInitial]);

  function handleFiltersChange(newFilters: LibraryFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleSortChange(field: SortField, direction: SortDirection) {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleGroupCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const hasActiveFilters =
    filters.platforms.length > 0 ||
    filters.nicheTags.length > 0 ||
    filters.hookTypes.length > 0 ||
    filters.styles.length > 0 ||
    filters.viralityMin > 0 ||
    filters.viralityMax < 100 ||
    filters.engagementMin > 0 ||
    filters.engagementMax < 100 ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.creatorIds.length > 0;

  const groups = groupContent(result.data, groupBy);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        creators={creators}
        availableTags={availableTags}
      />

      <div className="flex-1">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {loading ? (
              "Loading..."
            ) : (
              <>
                {result.totalCount} item{result.totalCount !== 1 ? "s" : ""}
                {hasActiveFilters ? " (filtered)" : ""}
              </>
            )}
          </p>
        </div>

        {/* Content */}
        {result.data.length === 0 && !loading ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          <div className="space-y-6">
            {Array.from(groups.entries()).map(([groupKey, items]) => (
              <div key={groupKey}>
                {/* Group header */}
                {groupBy !== "none" && (
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(groupKey)}
                    className="mb-3 flex w-full items-center gap-2 text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-neutral-500 transition-transform ${
                        collapsedGroups.has(groupKey)
                          ? ""
                          : "rotate-90"
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <h2 className="text-sm font-semibold capitalize text-neutral-300">
                      {groupKey}
                    </h2>
                    <span className="text-xs text-neutral-600">
                      ({items.length})
                    </span>
                  </button>
                )}

                {/* Grid */}
                {!collapsedGroups.has(groupKey) && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {items.map((item) => (
                      <ContentCard
                        key={item.id}
                        content={item}
                        onClick={setSelectedContent}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalCount={result.totalCount}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Detail modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}
