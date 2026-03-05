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
 * GET /api/proxy-image?url=<encoded-url>
 *
 * Proxies Instagram CDN images server-side to bypass referrer restrictions.
 * Requires authentication. Only allows whitelisted CDN domains.
 * Caches for 1 hour since IG CDN URLs eventually expire.
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
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.instagram.com/",
      },
      signal: AbortSignal.timeout(10_000),
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
