"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchLibraryContent, type FetchLibraryResult } from "@/lib/library-queries";
import type {
  ContentWithRelations,
  LibraryFilters,
  Folder,
} from "@/types/database";
import { DEFAULT_FILTERS } from "@/types/database";
import { ContentCard } from "./content-card";
import { ContentDetailModal } from "./content-detail-modal";
import { Pagination } from "./pagination";
import { FolderPicker } from "./folder-picker";

interface CollectionsViewProps {
  initialFolders: Folder[];
}

export function CollectionsView({ initialFolders }: CollectionsViewProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | string>("favorites");
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [result, setResult] = useState<FetchLibraryResult>({ data: [], totalCount: 0 });
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<ContentWithRelations | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Fetch favorites IDs
  const loadFavoriteIds = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const { ids } = await res.json();
        setFavoritedIds(new Set(ids));
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  }, []);

  // Fetch content for active tab
  const fetchContent = useCallback(async (tab: string, p: number) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const filters: LibraryFilters = {
        ...DEFAULT_FILTERS,
        favoritesOnly: tab === "favorites",
        folderId: tab !== "favorites" ? tab : "",
      };
      const data = await fetchLibraryContent(supabase, {
        filters,
        sortField: "posted_at",
        sortDirection: "desc",
        page: p,
      });
      setResult(data);
    } catch (err) {
      console.error("Failed to fetch collection content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and tab change
  useEffect(() => {
    loadFavoriteIds();
  }, [loadFavoriteIds]);

  useEffect(() => {
    setPage(1);
    fetchContent(activeTab, 1);
  }, [activeTab, fetchContent]);

  useEffect(() => {
    if (page > 1) {
      fetchContent(activeTab, page);
    }
  }, [page, activeTab, fetchContent]);

  // Toggle favorite
  async function handleToggleFavorite(contentId: string) {
    const wasFavorited = favoritedIds.has(contentId);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(contentId); else next.add(contentId);
      return next;
    });

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) {
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(contentId); else next.delete(contentId);
          return next;
        });
      } else if (activeTab === "favorites") {
        // Refresh favorites list after unfavorite
        fetchContent(activeTab, page);
      }
    } catch {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(contentId); else next.delete(contentId);
        return next;
      });
    }
  }

  // Create folder
  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const { folder } = await res.json();
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFolderName("");
        setShowNewFolderInput(false);
        setActiveTab(folder.id);
      }
    } catch (err) {
      console.error("Create folder error:", err);
    }
  }

  // Delete folder
  async function handleDeleteFolder(folderId: string) {
    try {
      const res = await fetch(`/api/folders?id=${folderId}`, { method: "DELETE" });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        if (activeTab === folderId) {
          setActiveTab("favorites");
        }
      }
    } catch (err) {
      console.error("Delete folder error:", err);
    }
  }

  // Remove item from current folder
  async function handleRemoveFromFolder(contentId: string) {
    if (activeTab === "favorites") return;
    try {
      const res = await fetch("/api/folders/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: activeTab, content_ids: [contentId] }),
      });
      if (res.ok) {
        fetchContent(activeTab, page);
      }
    } catch (err) {
      console.error("Remove from folder error:", err);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeFolder = folders.find((f) => f.id === activeTab);
  const tabLabel = activeTab === "favorites" ? "Favorites" : activeFolder?.name ?? "List";

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-px"
        style={{ borderBottom: "1px solid #1F1F1F" }}
      >
        {/* Favorites tab */}
        <button
          type="button"
          onClick={() => setActiveTab("favorites")}
          className="shrink-0 px-4 py-2.5 transition-all duration-150"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            color: activeTab === "favorites" ? "#FF2D2D" : "#888",
            borderBottom: activeTab === "favorites" ? "2px solid #FF2D2D" : "2px solid transparent",
            background: "transparent",
          }}
        >
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={activeTab === "favorites" ? "#FF2D2D" : "none"} stroke={activeTab === "favorites" ? "#FF2D2D" : "#888"} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Favorites
          </span>
        </button>

        {/* Folder tabs */}
        {folders.map((folder) => (
          <div key={folder.id} className="group/tab relative flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setActiveTab(folder.id)}
              className="px-4 py-2.5 transition-all duration-150"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: activeTab === folder.id ? "#E0E0E0" : "#888",
                borderBottom: activeTab === folder.id ? "2px solid #E0E0E0" : "2px solid transparent",
                background: "transparent",
              }}
            >
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {folder.name}
              </span>
            </button>
            {/* Delete button on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full group-hover/tab:flex"
              style={{ background: "#333", color: "#888", fontSize: "10px" }}
              title="Delete list"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* New list button */}
        {showNewFolderInput ? (
          <div className="flex shrink-0 items-center gap-1 px-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setShowNewFolderInput(false); setNewFolderName(""); } }}
              placeholder="List name..."
              autoFocus
              className="w-28 px-2 py-1 focus:outline-none"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#E0E0E0",
                background: "#0A0A0A",
                border: "1px solid #2A2A2A",
                borderRadius: "4px",
              }}
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{
                background: newFolderName.trim() ? "#FF2D2D" : "#333",
                color: "#fff",
                fontSize: "14px",
              }}
              disabled={!newFolderName.trim()}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }}
              style={{ color: "#555", fontSize: "12px", fontFamily: "var(--font-body)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewFolderInput(true)}
            className="shrink-0 px-3 py-2.5 transition-colors duration-150"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#555",
              background: "transparent",
              border: "none",
            }}
          >
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New list
            </span>
          </button>
        )}
      </div>

      {/* Content header */}
      <div className="mt-4 mb-4 flex items-center justify-between">
        <div>
          <h2
            style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: "#E0E0E0" }}
          >
            {tabLabel}
          </h2>
          <p
            className="mt-0.5"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888" }}
          >
            {loading ? "Loading..." : (
              <>
                <span style={{ fontFamily: "var(--font-mono)", color: "#FF2D2D" }}>
                  {result.totalCount}
                </span>{" "}
                item{result.totalCount !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Grid */}
      {result.data.length === 0 && !loading ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg py-16"
          style={{ border: "1px dashed #1F1F1F" }}
        >
          {activeTab === "favorites" ? (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <p className="mt-3" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#555" }}>
                No favorites yet
              </p>
              <p className="mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#444" }}>
                Click the star on any content card to add it here
              </p>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <p className="mt-3" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#555" }}>
                This list is empty
              </p>
              <p className="mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#444" }}>
                Select content in the Library and use &quot;Folder&quot; to add items here
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {result.data.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onClick={setSelectedContent}
              isFavorited={favoritedIds.has(item.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalCount > 20 && (
        <Pagination
          currentPage={page}
          totalCount={result.totalCount}
          onPageChange={handlePageChange}
        />
      )}

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
