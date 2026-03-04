import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/proxy-image?url=<encoded-url>
 *
 * Proxies Instagram CDN images server-side to bypass referrer restrictions.
 * Caches for 1 hour since IG CDN URLs eventually expire.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!res.ok) {
      return new Response("Failed to fetch image", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
