// Database entity types matching the Supabase schema

export type Platform = "instagram" | "tiktok" | "linkedin" | "twitter";
export type ScriptStyle = "short" | "medium" | "long";
export type TagCategory = "niche" | "topic" | "style" | "hook_type" | "emotion";
export type ContentTagCategory = TagCategory;

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

export interface ScriptBody {
  hook: string;
  body: string;
  cta: string;
}

export interface Script {
  id: string;
  user_id: string;
  title: string | null;
  topic: string | null;
  script_body: string; // JSON-stringified ScriptBody
  niche_id: string | null;
  source_content_ids: string[] | null;
  platform: Platform | null;
  script_style: ScriptStyle | null;
  created_at: string;
  updated_at: string;
  niche?: Niche | null;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_voice: string | null;
  values: string[] | null;
  target_audience: string | null;
  content_style: string | null;
  niche: string | null;
  display_name: string | null;
  creator_type: string | null;
  primary_platform: string | null;
  social_handles: Record<string, string> | null;
  inspiration_handles: string[] | null;
  tone_descriptors: string[] | null;
  tone_formality: number | null;
  tone_humor: number | null;
  tone_authority: number | null;
  creator_archetype: string | null;
  sample_content: string | null;
  content_pillars: string[] | null;
  content_goal: string | null;
  content_formats: string[] | null;
  preferred_cta: string[] | null;
  unique_value_prop: string | null;
  audience_problem: string | null;
  audience_age_ranges: string[] | null;
  audience_gender: string | null;
  birth_year: number | null;
  location: string | null;
  personal_bio: string | null;
  fun_facts: string[] | null;
  languages: string[] | null;
  early_life: string | null;
  biggest_struggle: string | null;
  defining_moment: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
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
  carousel_urls: string[] | null;
  posted_at: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FolderItem {
  id: string;
  folder_id: string;
  content_id: string;
  created_at: string;
}

export interface ContentTag {
  id: string;
  content_id: string;
  tag: string;
  category: TagCategory | null;
}

export type StoryEmotion = "shame" | "pride" | "fear" | "relief" | "anger" | "joy" | "surprise" | "frustration";
export type StoryCategory = "struggle" | "achievement" | "childhood" | "relationship" | "career" | "turning_point" | "funny" | "lesson";

export interface CreatorStory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  emotion: StoryEmotion | null;
  category: StoryCategory | null;
  time_period: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductType = "product" | "guide" | "freebie" | "course" | "coaching" | "service" | "other";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  type: ProductType;
  description: string | null;
  price: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Niche {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
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
  favoritesOnly: boolean;
  folderId: string;
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
  favoritesOnly: false,
  folderId: "",
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

// Canvas types
export type CanvasNodeType = "backstory" | "content_folder" | "product" | "youtube" | "ai_chat";

export interface CanvasBrief {
  topic: string;
  emotion: string;
  angle: string;
  targetAudience: string;
  selectedFolderIds: string[];
  selectedProductIds: string[];
  selectedStoryIds: string[];
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

export interface Canvas {
  id: string;
  user_id: string;
  name: string;
  brief: CanvasBrief | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasNode {
  id: string;
  user_id: string;
  canvas_id: string;
  node_type: CanvasNodeType;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  data: Record<string, unknown>;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasEdge {
  id: string;
  user_id: string;
  canvas_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  animated: boolean;
  created_at: string;
}
