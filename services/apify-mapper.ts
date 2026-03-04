import type { ScrapedPost } from "@/types/scraper";

/**
 * Maps a raw Apify instagram-api-scraper item to our ScrapedPost type.
 *
 * Field reference (from actual Apify output):
 *   id, type, shortCode, caption, url, commentsCount, likesCount,
 *   videoViewCount, videoPlayCount, displayUrl, videoUrl, timestamp,
 *   ownerUsername, productType, dimensionsHeight, dimensionsWidth
 */
export function mapApifyPostToScrapedPost(
  item: Record<string, unknown>,
  handle: string,
  index: number
): ScrapedPost {
  const externalId =
    (item.shortCode as string) ||
    (item.id as string) ||
    `${handle}_${Date.now()}_${index}`;

  // videoPlayCount is the real total plays; videoViewCount is a subset
  const videoPlays = typeof item.videoPlayCount === "number" ? item.videoPlayCount : 0;
  const videoViews = typeof item.videoViewCount === "number" ? item.videoViewCount : 0;
  const views = videoPlays || videoViews;

  const likes = typeof item.likesCount === "number" ? item.likesCount : 0;
  const comments = typeof item.commentsCount === "number" ? item.commentsCount : 0;

  const type = item.type as string | undefined;
  const productType = item.productType as string | undefined;
  const contentType =
    type === "Video" || productType === "clips" || productType === "reels"
      ? "reel"
      : type === "Sidecar"
        ? "carousel"
        : "image";

  const timestamp = (item.timestamp as string) || new Date().toISOString();

  // Extract carousel child media for Sidecar posts
  let carouselUrls: string[] | undefined;
  if (type === "Sidecar" && Array.isArray(item.childPosts)) {
    carouselUrls = (item.childPosts as Record<string, unknown>[])
      .map((child) => (child.videoUrl as string) || (child.displayUrl as string) || "")
      .filter(Boolean);
  }

  return {
    externalId,
    contentType,
    caption: (item.caption as string) || "",
    mediaUrl:
      (item.videoUrl as string) ||
      (item.displayUrl as string) ||
      "",
    thumbnailUrl:
      (item.displayUrl as string) || "",
    viewCount: views,
    likeCount: likes,
    commentCount: comments,
    shareCount: 0, // Instagram API doesn't expose shares
    postedAt: new Date(timestamp).toISOString(),
    ...(carouselUrls && carouselUrls.length > 0 ? { carouselUrls } : {}),
  };
}

/**
 * Extracts profile info from an Apify "details" result.
 */
export function mapApifyProfile(
  profile: Record<string, unknown> | undefined,
  handle: string
) {
  const displayName =
    (profile?.fullName as string) ||
    handle
      .split(/[._]/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const followerCount =
    typeof profile?.followersCount === "number" ? profile.followersCount : 0;

  const profilePicUrl =
    (profile?.profilePicUrlHD as string) ||
    (profile?.profilePicUrl as string) ||
    "";

  const bio = (profile?.biography as string) || "";

  return { displayName, followerCount, profilePicUrl, bio };
}
