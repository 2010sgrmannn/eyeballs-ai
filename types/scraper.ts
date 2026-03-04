/** Platform options supported by the scraper */
export type Platform = "instagram" | "tiktok" | "linkedin" | "twitter";

/** Depth options for scraping */
export type ScrapeDepth = 7 | 30 | 60;

/** Request payload for POST /api/scrape */
export interface ScrapeRequest {
  platform: Platform;
  handle: string;
  depth: ScrapeDepth;
}

/** A single scraped post returned by the scraper service */
export interface ScrapedPost {
  externalId: string;
  contentType: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  postedAt: string;
  carouselUrls?: string[];
}

/** Creator record as stored in the database */
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

/** Content record as stored in the database */
export interface ContentRow {
  id: string;
  user_id: string;
  creator_id: string;
  platform: string;
  external_id: string;
  content_type: string;
  caption: string;
  media_url: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  engagement_ratio: number;
  posted_at: string;
  created_at: string;
}

/** Interface for scraper implementations (mock or real) */
export interface ScraperService {
  scrape(
    platform: Platform,
    handle: string,
    depth: ScrapeDepth
  ): Promise<{
    displayName: string;
    followerCount: number;
    posts: ScrapedPost[];
  }>;
}
