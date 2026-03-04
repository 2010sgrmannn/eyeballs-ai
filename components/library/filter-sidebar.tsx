"use client";

import type {
  LibraryFilters,
  Platform,
  Creator,
  ContentTag,
  SortField,
  SortDirection,
  GroupByField,
  Folder,
} from "@/types/database";
import {
  DEFAULT_FILTERS,
  SORT_FIELD_LABELS,
  GROUP_BY_LABELS,
} from "@/types/database";

interface FilterSidebarProps {
  filters: LibraryFilters;
  onFiltersChange: (filters: LibraryFilters) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  groupBy: GroupByField | "none";
  onGroupByChange: (groupBy: GroupByField | "none") => void;
  creators: Creator[];
  availableTags: ContentTag[];
  folders?: Folder[];
}

const PLATFORMS: Platform[] = ["instagram", "tiktok", "linkedin", "twitter"];

export function FilterSidebar({
  filters,
  onFiltersChange,
  sortField,
  sortDirection,
  onSortChange,
  groupBy,
  onGroupByChange,
  creators,
  availableTags,
  folders,
}: FilterSidebarProps) {
  const nicheTags = availableTags.filter((t) => t.category === "niche");
  const hookTypes = availableTags.filter((t) => t.category === "hook_type");
  const styles = availableTags.filter((t) => t.category === "style");

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

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function updateFilter<K extends keyof LibraryFilters>(
    key: K,
    value: LibraryFilters[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const selectStyle = {
    border: "1px solid #1F1F1F",
    background: "#0A0A0A",
    color: "#E0E0E0",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    borderRadius: "6px",
  };

  const numberInputStyle = {
    border: "1px solid #1F1F1F",
    background: "#0A0A0A",
    color: "#E0E0E0",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    borderRadius: "6px",
  };

  return (
    <aside
      className="w-full space-y-5 rounded-lg p-4 lg:w-64 lg:shrink-0"
      style={{ border: "1px solid #1F1F1F", background: "#1A1A1A", borderRadius: "12px" }}
    >
      <div className="flex items-center justify-between">
        <h2
          style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#E0E0E0" }}
        >
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="transition-colors duration-200 hover:text-[#F87171]"
            style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#888" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort by">
        <select
          value={sortField}
          onChange={(e) => onSortChange(e.target.value as SortField, sortDirection)}
          className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
          style={selectStyle}
        >
          {(Object.entries(SORT_FIELD_LABELS) as [SortField, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
        <div className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => onSortChange(sortField, "desc")}
            className="flex-1 rounded-md px-2 py-1 text-xs transition-all duration-200"
            style={{
              border: sortDirection === "desc" ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
              background: sortDirection === "desc" ? "rgba(255, 45, 45, 0.15)" : "#161616",
              color: sortDirection === "desc" ? "#FF2D2D" : "#888",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
            }}
          >
            Desc
          </button>
          <button
            type="button"
            onClick={() => onSortChange(sortField, "asc")}
            className="flex-1 rounded-md px-2 py-1 text-xs transition-all duration-200"
            style={{
              border: sortDirection === "asc" ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
              background: sortDirection === "asc" ? "rgba(255, 45, 45, 0.15)" : "#161616",
              color: sortDirection === "asc" ? "#FF2D2D" : "#888",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
            }}
          >
            Asc
          </button>
        </div>
      </FilterSection>

      {/* Group by */}
      <FilterSection title="Group by">
        <select
          value={groupBy}
          onChange={(e) =>
            onGroupByChange(e.target.value as GroupByField | "none")
          }
          className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
          style={selectStyle}
        >
          {(
            Object.entries(GROUP_BY_LABELS) as [
              GroupByField | "none",
              string,
            ][]
          ).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Favorites only */}
      <FilterSection title="Favorites">
        <button
          type="button"
          onClick={() => updateFilter("favoritesOnly", !filters.favoritesOnly)}
          className="rounded-md px-2.5 py-1 text-xs transition-all duration-200"
          style={{
            border: filters.favoritesOnly ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
            background: filters.favoritesOnly ? "rgba(255, 45, 45, 0.15)" : "#161616",
            color: filters.favoritesOnly ? "#FF2D2D" : "#888",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
          }}
        >
          Favorites only
        </button>
      </FilterSection>

      {/* Folder */}
      {folders && folders.length > 0 && (
        <FilterSection title="Folder">
          <select
            value={filters.folderId}
            onChange={(e) => updateFilter("folderId", e.target.value)}
            className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
            style={selectStyle}
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      {/* Platform */}
      <FilterSection title="Platform">
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const active = filters.platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() =>
                  updateFilter(
                    "platforms",
                    toggleArrayItem(filters.platforms, p)
                  )
                }
                className="rounded-md px-2.5 py-1 text-xs capitalize transition-all duration-200"
                style={{
                  border: active ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
                  background: active ? "rgba(255, 45, 45, 0.15)" : "#161616",
                  color: active ? "#FF2D2D" : "#888",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Creator */}
      {creators.length > 0 && (
        <FilterSection title="Creator">
          <select
            value={filters.creatorIds.length === 1 ? filters.creatorIds[0] : ""}
            onChange={(e) =>
              updateFilter(
                "creatorIds",
                e.target.value ? [e.target.value] : []
              )
            }
            className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
            style={selectStyle}
          >
            <option value="">All creators</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                @{c.handle} ({c.platform})
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      {/* Niche tags */}
      {nicheTags.length > 0 && (
        <FilterSection title="Niche">
          <div className="flex flex-wrap gap-1.5">
            {nicheTags.map((t) => {
              const active = filters.nicheTags.includes(t.tag);
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      "nicheTags",
                      toggleArrayItem(filters.nicheTags, t.tag)
                    )
                  }
                  className="rounded-md px-2.5 py-1 text-xs transition-all duration-200"
                  style={{
                    border: active ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
                    background: active ? "rgba(255, 45, 45, 0.15)" : "#161616",
                    color: active ? "#FF2D2D" : "#888",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                  }}
                >
                  {t.tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Hook type */}
      {hookTypes.length > 0 && (
        <FilterSection title="Hook type">
          <div className="flex flex-wrap gap-1.5">
            {hookTypes.map((t) => {
              const active = filters.hookTypes.includes(t.tag);
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      "hookTypes",
                      toggleArrayItem(filters.hookTypes, t.tag)
                    )
                  }
                  className="rounded-md px-2.5 py-1 text-xs transition-all duration-200"
                  style={{
                    border: active ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
                    background: active ? "rgba(255, 45, 45, 0.15)" : "#161616",
                    color: active ? "#FF2D2D" : "#888",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                  }}
                >
                  {t.tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Content style */}
      {styles.length > 0 && (
        <FilterSection title="Content style">
          <div className="flex flex-wrap gap-1.5">
            {styles.map((t) => {
              const active = filters.styles.includes(t.tag);
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      "styles",
                      toggleArrayItem(filters.styles, t.tag)
                    )
                  }
                  className="rounded-md px-2.5 py-1 text-xs transition-all duration-200"
                  style={{
                    border: active ? "1px solid #FF2D2D" : "1px solid #1F1F1F",
                    background: active ? "rgba(255, 45, 45, 0.15)" : "#161616",
                    color: active ? "#FF2D2D" : "#888",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                  }}
                >
                  {t.tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Virality score range */}
      <FilterSection title="Virality score">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={filters.viralityMin}
            onChange={(e) =>
              updateFilter("viralityMin", Number(e.target.value))
            }
            className="w-16 px-2 py-1 focus:outline-none focus:border-[#FF2D2D]"
            style={numberInputStyle}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#555" }}>to</span>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.viralityMax}
            onChange={(e) =>
              updateFilter("viralityMax", Number(e.target.value))
            }
            className="w-16 px-2 py-1 focus:outline-none focus:border-[#FF2D2D]"
            style={numberInputStyle}
          />
        </div>
      </FilterSection>

      {/* Engagement ratio range */}
      <FilterSection title="Engagement ratio">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={filters.engagementMin}
            onChange={(e) =>
              updateFilter("engagementMin", Number(e.target.value))
            }
            className="w-16 px-2 py-1 focus:outline-none focus:border-[#FF2D2D]"
            style={numberInputStyle}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#555" }}>to</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={filters.engagementMax}
            onChange={(e) =>
              updateFilter("engagementMax", Number(e.target.value))
            }
            className="w-16 px-2 py-1 focus:outline-none focus:border-[#FF2D2D]"
            style={numberInputStyle}
          />
        </div>
      </FilterSection>

      {/* Date range */}
      <FilterSection title="Posted date">
        <div className="space-y-1.5">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
            style={selectStyle}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className="w-full px-2 py-1.5 focus:outline-none focus:border-[#FF2D2D]"
            style={selectStyle}
          />
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="mb-2"
        style={{ fontFamily: "var(--font-heading)", fontSize: "11px", color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
