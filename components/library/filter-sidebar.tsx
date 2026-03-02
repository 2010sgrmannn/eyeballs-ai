"use client";

import type {
  LibraryFilters,
  Platform,
  Creator,
  ContentTag,
  SortField,
  SortDirection,
  GroupByField,
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
    filters.creatorIds.length > 0;

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function updateFilter<K extends keyof LibraryFilters>(
    key: K,
    value: LibraryFilters[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <aside className="w-full space-y-5 rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-200">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="text-xs text-neutral-500 hover:text-white"
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
          className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
        >
          {(Object.entries(SORT_FIELD_LABELS) as [SortField, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            onClick={() => onSortChange(sortField, "desc")}
            className={`flex-1 rounded px-2 py-1 text-xs ${
              sortDirection === "desc"
                ? "bg-white text-neutral-950"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            Desc
          </button>
          <button
            type="button"
            onClick={() => onSortChange(sortField, "asc")}
            className={`flex-1 rounded px-2 py-1 text-xs ${
              sortDirection === "asc"
                ? "bg-white text-neutral-950"
                : "bg-neutral-800 text-neutral-400"
            }`}
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
          className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
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

      {/* Platform */}
      <FilterSection title="Platform">
        <div className="flex flex-wrap gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                updateFilter(
                  "platforms",
                  toggleArrayItem(filters.platforms, p)
                )
              }
              className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                filters.platforms.includes(p)
                  ? "bg-white text-neutral-950"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
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
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
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
          <div className="flex flex-wrap gap-1">
            {nicheTags.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() =>
                  updateFilter(
                    "nicheTags",
                    toggleArrayItem(filters.nicheTags, t.tag)
                  )
                }
                className={`rounded-full px-2.5 py-1 text-xs ${
                  filters.nicheTags.includes(t.tag)
                    ? "bg-purple-500/30 text-purple-300"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {t.tag}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Hook type */}
      {hookTypes.length > 0 && (
        <FilterSection title="Hook type">
          <div className="flex flex-wrap gap-1">
            {hookTypes.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() =>
                  updateFilter(
                    "hookTypes",
                    toggleArrayItem(filters.hookTypes, t.tag)
                  )
                }
                className={`rounded-full px-2.5 py-1 text-xs ${
                  filters.hookTypes.includes(t.tag)
                    ? "bg-orange-500/30 text-orange-300"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {t.tag}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Content style */}
      {styles.length > 0 && (
        <FilterSection title="Content style">
          <div className="flex flex-wrap gap-1">
            {styles.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() =>
                  updateFilter(
                    "styles",
                    toggleArrayItem(filters.styles, t.tag)
                  )
                }
                className={`rounded-full px-2.5 py-1 text-xs ${
                  filters.styles.includes(t.tag)
                    ? "bg-emerald-500/30 text-emerald-300"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {t.tag}
              </button>
            ))}
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
            className="w-16 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
          />
          <span className="text-xs text-neutral-500">to</span>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.viralityMax}
            onChange={(e) =>
              updateFilter("viralityMax", Number(e.target.value))
            }
            className="w-16 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
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
            className="w-16 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
          />
          <span className="text-xs text-neutral-500">to</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={filters.engagementMax}
            onChange={(e) =>
              updateFilter("engagementMax", Number(e.target.value))
            }
            className="w-16 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
          />
        </div>
      </FilterSection>

      {/* Date range */}
      <FilterSection title="Posted date">
        <div className="space-y-1">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300"
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
      <h3 className="mb-1.5 text-xs font-medium text-neutral-500">{title}</h3>
      {children}
    </div>
  );
}
