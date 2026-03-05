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
  Folder,
} from "@/types/database";
import { DEFAULT_FILTERS } from "@/types/database";
import { FilterSidebar } from "./filter-sidebar";
import { ContentCard } from "./content-card";
import { ContentDetailModal } from "./content-detail-modal";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { FolderPicker } from "./folder-picker";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] =
    useState<ContentWithRelations | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  // Favorites + Selection + Folders state
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // Fetch favorites and folders on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [favRes, foldRes] = await Promise.all([
          fetch("/api/favorites"),
          fetch("/api/folders"),
        ]);
        if (favRes.ok) {
          const { ids } = await favRes.json();
          setFavoritedIds(new Set(ids));
        }
        if (foldRes.ok) {
          const { folders: f } = await foldRes.json();
          setFolders(f);
        }
      } catch (err) {
        console.error("Failed to load favorites/folders:", err);
      }
    }
    loadMeta();
  }, []);

  const fetchData = useCallback(
    async (
      f: LibraryFilters,
      sf: SortField,
      sd: SortDirection,
      p: number
    ) => {
      setLoading(true);
      setFetchError(null);
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
        setFetchError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

  // Toggle favorite for a single item (optimistic update)
  async function handleToggleFavorite(contentId: string) {
    const wasFavorited = favoritedIds.has(contentId);

    // Optimistic: toggle immediately
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) {
        // Revert on failure
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) {
            next.add(contentId);
          } else {
            next.delete(contentId);
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // Revert on error
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(contentId);
        } else {
          next.delete(contentId);
        }
        return next;
      });
    }
  }

  // Toggle selection for a single item
  function handleToggleSelect(contentId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  }

  // Select / deselect all visible items
  function handleSelectAll() {
    const allVisibleIds = result.data.map((item) => item.id);
    const allSelected = allVisibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  }

  // Clear selection
  function handleClearSelection() {
    setSelectedIds(new Set());
    setShowFolderPicker(false);
  }

  // Bulk favorite
  async function handleBulkFavorite() {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/content/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favorite", content_ids: ids }),
      });
      if (res.ok) {
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.add(id);
          return next;
        });
        handleClearSelection();
      }
    } catch (err) {
      console.error("Bulk favorite error:", err);
    }
  }

  // Bulk delete
  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/content/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", content_ids: ids }),
      });
      if (res.ok) {
        handleClearSelection();
        fetchData(filters, sortField, sortDirection, page);
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  }

  // Move to folder
  async function handleMoveToFolder(folderId: string) {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/content/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_folder",
          content_ids: ids,
          folder_id: folderId,
        }),
      });
      if (res.ok) {
        setShowFolderPicker(false);
        handleClearSelection();
      }
    } catch (err) {
      console.error("Move to folder error:", err);
    }
  }

  // Create folder then add items
  async function handleCreateFolder(name: string) {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const { folder } = await res.json();
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        if (selectedIds.size > 0) {
          await handleMoveToFolder(folder.id);
        }
      }
    } catch (err) {
      console.error("Create folder error:", err);
    }
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
    filters.creatorIds.length > 0 ||
    filters.favoritesOnly ||
    filters.folderId !== "";

  const groups = groupContent(result.data, groupBy);
  const hasSelection = selectedIds.size > 0;
  const allVisibleIds = result.data.map((item) => item.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const actionBtnStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    borderRadius: "6px",
    padding: "5px 12px",
    transition: "all 0.15s ease",
    border: "1px solid #2A2A2A",
    background: "#161616",
    color: "#E0E0E0",
    cursor: "pointer" as const,
  };

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
        folders={folders}
      />

      <div className="flex-1">
        {/* Header */}
        <div className="mb-4">
          <h1
            style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "#E0E0E0" }}
          >
            Content Library
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888" }}
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                <span style={{ fontFamily: "var(--font-mono)", color: "#ff3333" }}>
                  {result.totalCount}
                </span>{" "}
                item{result.totalCount !== 1 ? "s" : ""}
                {hasActiveFilters ? " (filtered)" : ""}
              </>
            )}
          </p>
        </div>

        {/* Selection toolbar - sticky */}
        <div
          className="sticky top-0 z-30 mb-4 flex items-center gap-3 rounded-lg px-3 py-2"
          style={{
            background: hasSelection ? "#141820" : "#141414",
            border: hasSelection ? "1px solid #ff3333" : "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {/* Select all checkbox */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
            style={{
              background: allSelected ? "#ff3333" : "transparent",
              border: allSelected ? "1.5px solid #ff3333" : "1.5px solid #555",
            }}
            title={allSelected ? "Deselect all" : "Select all"}
          >
            {allSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: hasSelection ? "#E0E0E0" : "#888",
            }}
          >
            {hasSelection ? (
              <>
                <span style={{ fontFamily: "var(--font-mono)", color: "#ff3333" }}>
                  {selectedIds.size}
                </span>{" "}
                selected
              </>
            ) : (
              "Select items"
            )}
          </span>

          {/* Action buttons - only show when items are selected */}
          {hasSelection && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkFavorite}
                  style={actionBtnStyle}
                >
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff3333" stroke="#ff3333" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Favorite
                  </span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFolderPicker((prev) => !prev)}
                    style={actionBtnStyle}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      Folder
                    </span>
                  </button>
                  {showFolderPicker && (
                    <div className="absolute right-0 top-full z-50 mt-1">
                      <FolderPicker
                        folders={folders}
                        onSelect={handleMoveToFolder}
                        onCreateFolder={handleCreateFolder}
                        onClose={() => setShowFolderPicker(false)}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  style={{
                    ...actionBtnStyle,
                    border: "1px solid #ff3333",
                    background: "rgba(255, 45, 45, 0.1)",
                    color: "#ff3333",
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  style={{
                    ...actionBtnStyle,
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    background: "transparent",
                    color: "#888",
                  }}
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>

        {/* Error banner */}
        {fetchError && (
          <div
            className="mb-4 flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{
              background: "rgba(255, 45, 45, 0.05)",
              border: "1px solid rgba(255, 45, 45, 0.2)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#ff3333" }}>
              {fetchError}
            </span>
            <button
              type="button"
              onClick={() => {
                setFetchError(null);
                fetchData(filters, sortField, sortDirection, page);
              }}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#888",
                marginLeft: "auto",
                cursor: "pointer",
                background: "none",
                border: "none",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

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
                      stroke="#888"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${
                        collapsedGroups.has(groupKey)
                          ? ""
                          : "rotate-90"
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <h2
                      className="capitalize"
                      style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, color: "#E0E0E0" }}
                    >
                      {groupKey}
                    </h2>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#555" }}>
                      ({items.length})
                    </span>
                  </button>
                )}

                {/* Grid */}
                {!collapsedGroups.has(groupKey) && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((item) => (
                      <ContentCard
                        key={item.id}
                        content={item}
                        onClick={setSelectedContent}
                        isFavorited={favoritedIds.has(item.id)}
                        onToggleFavorite={handleToggleFavorite}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={handleToggleSelect}
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
