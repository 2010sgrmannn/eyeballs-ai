/**
 * Types for content analysis: content items, tags, and analysis results.
 */

export interface ContentItem {
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
  category: "niche" | "topic" | "style" | "hook_type" | "emotion";
}

export interface AnalysisResult {
  transcript: string;
  hook_text: string;
  cta_text: string;
  virality_score: number;
  tags: Array<{ tag: string; category: ContentTag["category"] }>;
}

export interface AnalyzeResponse {
  analyzed: number;
  errors: number;
  results: Array<{
    content_id: string;
    success: boolean;
    error?: string;
  }>;
}

export interface CreatorInfo {
  follower_count: number | null;
}
