import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LibraryFilters,
  SortField,
  SortDirection,
  ContentWithRelations,
  Creator,
  ContentTag,
  Folder,
} from "@/types/database";
import { ITEMS_PER_PAGE } from "@/types/database";

export interface FetchLibraryParams {
  filters: LibraryFilters;
  sortField: SortField;
  sortDirection: SortDirection;
  page: number;
}

export interface FetchLibraryResult {
  data: ContentWithRelations[];
  totalCount: number;
}

/**
 * Fetch content library items with filters, sorting, and pagination.
 * Uses Supabase PostgREST queries with joins to creators and content_tags.
 */
export async function fetchLibraryContent(
  supabase: SupabaseClient,
  params: FetchLibraryParams
): Promise<FetchLibraryResult> {
  const { filters, sortField, sortDirection, page } = params;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Build the base query for content with creators join
  let query = supabase
    .from("content")
    .select("*, creators!inner(*), content_tags(*)", { count: "exact" });

  // Platform filter
  if (filters.platforms.length > 0) {
    query = query.in("platform", filters.platforms);
  }

  // Creator filter
  if (filters.creatorIds.length > 0) {
    query = query.in("creator_id", filters.creatorIds);
  }

  // Virality score range
  if (filters.viralityMin > 0) {
    query = query.gte("virality_score", filters.viralityMin);
  }
  if (filters.viralityMax < 100) {
    query = query.lte("virality_score", filters.viralityMax);
  }

  // Engagement ratio range
  if (filters.engagementMin > 0) {
    query = query.gte("engagement_ratio", filters.engagementMin);
  }
  if (filters.engagementMax < 100) {
    query = query.lte("engagement_ratio", filters.engagementMax);
  }

  // Favorites filter
  if (filters.favoritesOnly) {
    const favoriteIds = await fetchFavoritedContentIds(supabase);
    const idArray = Array.from(favoriteIds);
    if (idArray.length === 0) {
      return { data: [], totalCount: 0 };
    }
    query = query.in("id", idArray);
  }

  // Folder filter
  if (filters.folderId) {
    const folderContentIds = await fetchFolderContentIds(supabase, filters.folderId);
    if (folderContentIds.length === 0) {
      return { data: [], totalCount: 0 };
    }
    query = query.in("id", folderContentIds);
  }

  // Date range
  if (filters.dateFrom) {
    query = query.gte("posted_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("posted_at", filters.dateTo);
  }

  // Sort
  const ascending = sortDirection === "asc";
  query = query.order(sortField, { ascending, nullsFirst: false });

  // Pagination
  query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch library content: ${error.message}`);
  }

  let results = (data ?? []) as ContentWithRelations[];

  // Client-side filtering for tag-based filters (niche, hook_type, style)
  // because Supabase PostgREST does not support filtering parent rows by child rows easily
  if (filters.nicheTags.length > 0) {
    results = results.filter((item) =>
      filters.nicheTags.some((tag) =>
        item.content_tags.some(
          (ct) => ct.tag === tag && ct.category === "niche"
        )
      )
    );
  }

  if (filters.hookTypes.length > 0) {
    results = results.filter((item) =>
      filters.hookTypes.some((tag) =>
        item.content_tags.some(
          (ct) => ct.tag === tag && ct.category === "hook_type"
        )
      )
    );
  }

  if (filters.styles.length > 0) {
    results = results.filter((item) =>
      filters.styles.some((tag) =>
        item.content_tags.some(
          (ct) => ct.tag === tag && ct.category === "style"
        )
      )
    );
  }

  return {
    data: results,
    totalCount: count ?? 0,
  };
}

/**
 * Fetch all creators for the current user (for filter dropdown).
 */
export async function fetchCreators(
  supabase: SupabaseClient
): Promise<Creator[]> {
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .order("handle", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch creators: ${error.message}`);
  }

  return (data ?? []) as Creator[];
}

/**
 * Fetch all distinct tags by category (for filter options).
 */
export async function fetchAvailableTags(
  supabase: SupabaseClient
): Promise<ContentTag[]> {
  const { data, error } = await supabase
    .from("content_tags")
    .select("tag, category")
    .order("tag", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique: ContentTag[] = [];
  for (const row of data ?? []) {
    const key = `${row.category}:${row.tag}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row as ContentTag);
    }
  }

  return unique;
}

/**
 * Fetch all favorited content IDs for the current user.
 */
export async function fetchFavoritedContentIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("favorites")
    .select("content_id");

  if (error) {
    throw new Error(`Failed to fetch favorites: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.content_id));
}

/**
 * Fetch content IDs belonging to a specific folder.
 */
async function fetchFolderContentIds(
  supabase: SupabaseClient,
  folderId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("folder_items")
    .select("content_id")
    .eq("folder_id", folderId);

  if (error) {
    throw new Error(`Failed to fetch folder items: ${error.message}`);
  }

  return (data ?? []).map((row) => row.content_id);
}

/**
 * Fetch all folders for the current user.
 */
export async function fetchFolders(
  supabase: SupabaseClient
): Promise<Folder[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  return (data ?? []) as Folder[];
}

/**
 * Fetch a single content item with full details.
 */
export async function fetchContentDetail(
  supabase: SupabaseClient,
  contentId: string
): Promise<ContentWithRelations | null> {
  const { data, error } = await supabase
    .from("content")
    .select("*, creators(*), content_tags(*)")
    .eq("id", contentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to fetch content detail: ${error.message}`);
  }

  return data as ContentWithRelations;
}
