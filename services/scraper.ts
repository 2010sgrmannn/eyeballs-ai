import type {
  Platform,
  ScrapeDepth,
  ScrapedPost,
  ScraperService,
} from "@/types/scraper";

/** Calculate engagement ratio: (likes + comments + shares) / views */
export function calculateEngagementRatio(post: ScrapedPost): number {
  if (post.viewCount === 0) return 0;
  return (
    (post.likeCount + post.commentCount + post.shareCount) / post.viewCount
  );
}

/**
 * Generate realistic mock Instagram posts for a given handle and depth.
 * Each post has deterministic-ish data seeded by the handle string.
 */
function generateMockInstagramPosts(
  handle: string,
  depth: ScrapeDepth
): ScrapedPost[] {
  const captions = [
    "Just dropped a new video on this topic. Let me know what you think!",
    "This changed everything for me. Save this for later.",
    "POV: You finally figured out the algorithm.",
    "3 things I wish I knew when I started. Thread below.",
    "The secret nobody talks about in this niche.",
    "Hot take: quality > quantity every single time.",
    "Behind the scenes of today's shoot. So much work goes into this.",
    "Replying to a comment I got yesterday. This one hits different.",
    "Stop scrolling. You need to hear this.",
    "Trying something new today. Let me know if you want more of this.",
    "This is the sign you've been waiting for. Start now.",
    "Day in my life as a content creator. It's not glamorous.",
    "Unpopular opinion but I stand by it. Fight me in the comments.",
    "Tutorial: how I edit all my videos in under 30 minutes.",
    "Collaboration with an amazing creator. Go follow them!",
    "Monday motivation. Let's get after it this week.",
    "Q&A time! Drop your questions below.",
    "The algorithm loved this one. Here's why I think it worked.",
    "Throwback to when I had zero followers. Look at us now.",
    "New series starting tomorrow. Make sure notifications are on!",
    "Honest review: is it worth the hype? My thoughts inside.",
    "5 tools I use every day for content creation.",
    "Storytime: the craziest DM I've ever received.",
    "This trend is everywhere and I finally tried it.",
    "Thank you all for 10K! Celebrating with a giveaway.",
    "Morning routine that actually works for productivity.",
    "Reacting to my first ever post. The cringe is real.",
    "Tips for growing your account in 2026. Save this.",
    "The one thing that doubled my engagement overnight.",
    "Wrapping up the month with some wins and lessons learned.",
    "Experiment: I posted every day for 30 days. Here's what happened.",
    "Mini vlog from today's adventure. Where should I go next?",
    "Breaking down a viral post. What made it work?",
    "Outfit check before heading to the studio.",
    "Healthy meal prep ideas for busy creators.",
    "Book recommendation that changed my perspective on business.",
    "Late night thoughts on building a personal brand.",
    "Workout routine that keeps me energized for long shoot days.",
    "Answering your most-asked question once and for all.",
    "Sneak peek at something big coming next week. Stay tuned!",
    "How I plan my content calendar for the month.",
    "Responding to hate comments with kindness. Watch till the end.",
    "Top 3 mistakes new creators make. Avoid these!",
    "Just hit a huge milestone. Grateful for this community.",
    "Editing tutorial part 2: advanced transitions and effects.",
    "What I eat in a day while traveling for content.",
    "Setting boundaries as a creator. It's okay to say no.",
    "Gear I can't live without. Links in bio.",
    "This week's analytics blew my mind. Let me break it down.",
    "The truth about brand deals nobody tells you.",
    "Quick life update: big changes happening behind the scenes.",
    "Dancing to the latest trending sound because why not.",
    "Comparison: $10 vs $100 production setup. Can you tell the difference?",
    "My content creation workflow from idea to publish.",
    "Things that are criminally underrated in this industry.",
    "Reacting to followers recreating my most popular video.",
    "A day I almost quit. Here's what kept me going.",
    "Testing viral hacks so you don't have to.",
    "The power of consistency. One year of posting daily.",
    "Weekend reset routine for a productive week ahead.",
  ];

  const contentTypes = ["reel", "reel", "reel", "carousel", "image"];
  const posts: ScrapedPost[] = [];

  // Simple hash to seed "random" data from the handle
  let seed = 0;
  for (let i = 0; i < handle.length; i++) {
    seed = ((seed << 5) - seed + handle.charCodeAt(i)) | 0;
  }
  const seededRandom = (max: number) => {
    seed = (seed * 16807 + 12345) & 0x7fffffff;
    return seed % max;
  };

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < depth; i++) {
    const captionIndex = (seededRandom(captions.length) + i) % captions.length;
    const typeIndex = seededRandom(contentTypes.length);
    const views = 5000 + seededRandom(195000);
    const likes = Math.floor(views * (0.03 + seededRandom(100) / 1000));
    const comments = Math.floor(likes * (0.05 + seededRandom(100) / 1000));
    const shares = Math.floor(likes * (0.02 + seededRandom(50) / 1000));
    const daysAgo = i * Math.ceil(90 / depth) + seededRandom(3);

    posts.push({
      externalId: `${handle}_post_${Date.now()}_${i}`,
      contentType: contentTypes[typeIndex],
      caption: `${captions[captionIndex]} #${handle} #content #viral`,
      mediaUrl: `https://mock-cdn.example.com/${handle}/post_${i}.mp4`,
      thumbnailUrl: `https://mock-cdn.example.com/${handle}/thumb_${i}.jpg`,
      viewCount: views,
      likeCount: likes,
      commentCount: comments,
      shareCount: shares,
      postedAt: new Date(now - daysAgo * dayMs).toISOString(),
    });
  }

  return posts;
}

/** Mock scraper that returns realistic data without any external API calls */
export class MockScraperService implements ScraperService {
  async scrape(
    platform: Platform,
    handle: string,
    depth: ScrapeDepth
  ): Promise<{
    displayName: string;
    followerCount: number;
    posts: ScrapedPost[];
  }> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (platform !== "instagram") {
      throw new Error(
        `Scraping for ${platform} is not yet implemented. Only Instagram is available in the MVP.`
      );
    }

    const displayName = handle
      .split(/[._]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Deterministic follower count from handle
    let fc = 0;
    for (let i = 0; i < handle.length; i++) {
      fc = ((fc << 3) + handle.charCodeAt(i)) | 0;
    }
    const followerCount = 10000 + Math.abs(fc % 990000);

    const posts = generateMockInstagramPosts(handle, depth);

    return { displayName, followerCount, posts };
  }
}

/**
 * Real Instagram scraper using Apify actors.
 * Ported from 2010sgrmannn/ig-scraper Python implementation.
 */
export class ApifyScraperService implements ScraperService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async getClient() {
    const { ApifyClient } = await import("apify-client");
    return new ApifyClient({ token: this.token });
  }

  async scrape(
    platform: Platform,
    handle: string,
    depth: ScrapeDepth
  ): Promise<{
    displayName: string;
    followerCount: number;
    posts: ScrapedPost[];
  }> {
    if (platform !== "instagram") {
      throw new Error(
        `Scraping for ${platform} is not yet implemented. Only Instagram is available.`
      );
    }

    const { mapApifyPostToScrapedPost, mapApifyProfile } = await import(
      "@/services/apify-mapper"
    );

    const profileUrl = `https://www.instagram.com/${handle}/`;
    const client = await this.getClient();

    // Fetch profile info
    const profileRun = await client
      .actor("apify/instagram-api-scraper")
      .call({
        directUrls: [profileUrl],
        resultsType: "details",
        resultsLimit: 1,
      });

    const profileItems = await client
      .dataset(profileRun.defaultDatasetId)
      .listItems();

    const profile = profileItems.items[0] as Record<string, unknown> | undefined;
    const { displayName, followerCount } = mapApifyProfile(profile, handle);

    // Fetch posts/reels
    const postsRun = await client
      .actor("apify/instagram-api-scraper")
      .call({
        directUrls: [profileUrl],
        resultsType: "posts",
        resultsLimit: depth,
      });

    const postsItems = await client
      .dataset(postsRun.defaultDatasetId)
      .listItems();

    const posts: ScrapedPost[] = (
      postsItems.items as Record<string, unknown>[]
    ).map((item, i) => mapApifyPostToScrapedPost(item, handle, i));

    return { displayName, followerCount, posts };
  }
}

/**
 * Get the active scraper service.
 * Uses real Apify scraper when APIFY_API_TOKEN is set, otherwise falls back to mock.
 */
export function getScraperService(): ScraperService {
  const token = process.env.APIFY_API_TOKEN;
  if (token && token !== "placeholder") {
    return new ApifyScraperService(token);
  }
  return new MockScraperService();
}
