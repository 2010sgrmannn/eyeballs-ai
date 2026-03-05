import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_DOMAINS = [
  ".cdninstagram.com",
  ".fbcdn.net",
];

function isDomainAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
}

/**
 * GET /api/proxy-video?url=<encoded-url>
 *
 * Proxies Instagram video CDN URLs server-side with range request support
 * so <video> elements can seek and stream properly.
 * Requires authentication. Only allows whitelisted CDN domains.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  if (!isDomainAllowed(url)) {
    return new Response("Forbidden: URL domain not allowed", { status: 403 });
  }

  try {
    // Forward range header if present (for seeking)
    const rangeHeader = request.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Referer: "https://www.instagram.com/",
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const res = await fetch(url, {
      headers: fetchHeaders,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok && res.status !== 206) {
      return new Response("Failed to fetch video", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "video/mp4";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    const acceptRanges = res.headers.get("accept-ranges");

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Accept-Ranges": acceptRanges || "bytes",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    // Stream the body through directly instead of buffering
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
