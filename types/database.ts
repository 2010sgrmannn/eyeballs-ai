// Database entity types matching the Supabase schema

export type Platform = "instagram" | "tiktok" | "linkedin" | "twitter";

export type TagCategory = "niche" | "topic" | "style" | "hook_type" | "emotion";

export interface Creator {
  id: string;
  user_id: string;
  platform: Platform;
  handle: string;
  display_name: string | null;
  follower_count: number | null;
  scraped_at: string | null;
  created_at: string;
}

export interface Content {
  id: string;
  user_id: string;
  creator_id: string;
  platform: string | null;
  external_id: string | null;
  content_type: string | null;
  caption: string | null;
  transcript: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  engagement_ratio: number | null;
  virality_score: number | null;
  hook_text: string | null;
  cta_text: string | null;
  posted_at: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface ContentTag {
  id: string;
  content_id: string;
  tag: string;
  category: TagCategory | null;
}

export interface ContentWithRelations extends Content {
  creators: Creator;
  content_tags: ContentTag[];
}

// Filter types for the library page
export interface LibraryFilters {
  platforms: Platform[];
  nicheTags: string[];
  hookTypes: string[];
  styles: string[];
  viralityMin: number;
  viralityMax: number;
  engagementMin: number;
  engagementMax: number;
  dateFrom: string;
  dateTo: string;
  creatorIds: string[];
}

export type SortField =
  | "virality_score"
  | "engagement_ratio"
  | "view_count"
  | "like_count"
  | "posted_at"
  | "analyzed_at";

export type SortDirection = "asc" | "desc";

export type GroupByField = "creator" | "platform" | "niche" | "hook_type";

export const DEFAULT_FILTERS: LibraryFilters = {
  platforms: [],
  nicheTags: [],
  hookTypes: [],
  styles: [],
  viralityMin: 0,
  viralityMax: 100,
  engagementMin: 0,
  engagementMax: 100,
  dateFrom: "",
  dateTo: "",
  creatorIds: [],
};

export const SORT_FIELD_LABELS: Record<SortField, string> = {
  virality_score: "Virality Score",
  engagement_ratio: "Engagement Ratio",
  view_count: "View Count",
  like_count: "Like Count",
  posted_at: "Posted Date",
  analyzed_at: "Analyzed Date",
};

export const GROUP_BY_LABELS: Record<GroupByField | "none", string> = {
  none: "No Grouping",
  creator: "Creator",
  platform: "Platform",
  niche: "Niche",
  hook_type: "Hook Type",
};

export const ITEMS_PER_PAGE = 20;
