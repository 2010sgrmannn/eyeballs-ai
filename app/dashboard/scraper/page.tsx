"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Platform, ScrapeDepth, Creator } from "@/types/scraper";
import { toast } from "sonner";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
];

const DEPTH_OPTIONS: { value: ScrapeDepth; label: string }[] = [
  { value: 7, label: "Last 7 posts" },
  { value: 30, label: "Last 30 posts" },
  { value: 60, label: "Last 60 posts" },
];

interface CreatorWithCount extends Creator {
  post_count: number;
}

export default function ScraperPage() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");
  const [depth, setDepth] = useState<ScrapeDepth>(7);
  const [loading, setLoading] = useState(false);
  const [creators, setCreators] = useState<CreatorWithCount[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  async function fetchCreators() {
    try {
      const res = await fetch("/api/creators");
      if (!res.ok) {
        throw new Error("Failed to fetch creators");
      }
      const data = await res.json();
      setCreators(data.creators ?? []);
    } catch {
      toast.error("Failed to load creators list");
    } finally {
      setCreatorsLoading(false);
    }
  }

  useEffect(() => {
    fetchCreators();
  }, []);

  async function handleScrape(e: FormEvent) {
    e.preventDefault();

    const cleanHandle = handle.trim().replace(/^@/, "");
    if (!cleanHandle) {
      toast.error("Please enter a creator handle");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle: cleanHandle, depth }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scraping failed");
      }

      toast.success(
        `Scraped ${data.postCount} posts from @${data.handle}`
      );
      setHandle("");
      await fetchCreators();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRescrape(creator: CreatorWithCount) {
    setLoading(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: creator.platform,
          handle: creator.handle,
          depth: 7,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Re-scraping failed");
      }

      toast.success(
        `Re-scraped ${data.postCount} posts from @${creator.handle}`
      );
      await fetchCreators();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Creator Scraper</h1>
        <p className="mt-1 text-neutral-400">
          Add creator handles, choose a platform, and scrape their content.
        </p>
      </div>

      {/* Scrape Form */}
      <form
        onSubmit={handleScrape}
        className="space-y-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6"
      >
        {/* Platform Tabs */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Platform</label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  platform === p.value
                    ? "bg-white text-neutral-950"
                    : "border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Handle Input */}
        <div className="space-y-2">
          <label htmlFor="handle" className="block text-sm font-medium">
            Creator Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            className="w-full max-w-md rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
        </div>

        {/* Depth Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Number of Posts
          </label>
          <div className="flex gap-4">
            {DEPTH_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="depth"
                  value={opt.value}
                  checked={depth === opt.value}
                  onChange={() => setDepth(opt.value)}
                  className="h-4 w-4 accent-white"
                />
                <span className="text-sm text-neutral-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-white px-6 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Scraping..." : "Scrape"}
        </button>
      </form>

      {/* Creators List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scraped Creators</h2>

        {creatorsLoading ? (
          <p className="text-sm text-neutral-500">Loading creators...</p>
        ) : creators.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No creators scraped yet. Add a handle above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Handle
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Platform
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Posts
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Last Scraped
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {creators.map((creator) => (
                  <tr key={creator.id}>
                    <td className="px-4 py-3 font-medium">
                      @{creator.handle}
                      {creator.display_name && (
                        <span className="ml-2 text-neutral-500">
                          ({creator.display_name})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-300">
                      {creator.platform}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {creator.post_count}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {formatDate(creator.scraped_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRescrape(creator)}
                        disabled={loading}
                        className="rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Re-scrape
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
