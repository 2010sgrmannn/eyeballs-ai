"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
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

interface StreamPost {
  contentType: string;
  caption: string;
  thumbnailUrl: string;
  mediaUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagement: number;
  postedAt: string;
}

interface ProfileInfo {
  displayName: string;
  followerCount: number;
  profilePicUrl: string;
  bio: string;
  handle: string;
}

type ScrapePhase =
  | "idle"
  | "init"
  | "profile"
  | "profile_done"
  | "posts_fetching"
  | "posts_fetched"
  | "post"
  | "saving"
  | "analyzing"
  | "analyzed_post"
  | "done"
  | "error";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function proxyUrl(url: string): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ScraperPage() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handle, setHandle] = useState("");
  const [depth, setDepth] = useState<ScrapeDepth>(7);
  const [creators, setCreators] = useState<CreatorWithCount[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());

  // Streaming state
  const [phase, setPhase] = useState<ScrapePhase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchCreators() {
    try {
      const res = await fetch("/api/creators");
      if (!res.ok) throw new Error("Failed to fetch creators");
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

  // Auto-scroll post list
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [posts]);

  async function deleteCreator(creatorId: string) {
    setDeletingId(creatorId);
    try {
      const res = await fetch("/api/creators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Creator and all content deleted");
      setCreators((prev) => prev.filter((c) => c.id !== creatorId));
      setSelectedCreators((prev) => {
        const next = new Set(prev);
        next.delete(creatorId);
        return next;
      });
    } catch {
      toast.error("Failed to delete creator");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function deleteSelected() {
    for (const id of selectedCreators) {
      await deleteCreator(id);
    }
    setSelectedCreators(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(creators.map((c) => c.id)));
    }
  }

  async function startScrape(p: Platform, h: string, d: ScrapeDepth) {
    const cleanHandle = h.trim().replace(/^@/, "");
    if (!cleanHandle) {
      toast.error("Please enter a creator handle");
      return;
    }

    setPhase("init");
    setStatusMessage(`Starting scrape for @${cleanHandle}...`);
    setProfileInfo(null);
    setPosts([]);
    setProgress({ current: 0, total: 0 });
    setAnalysisProgress({ current: 0, total: 0 });

    try {
      const res = await fetch("/api/scrape/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: p, handle: cleanHandle, depth: d }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scraping failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          try {
            const event = JSON.parse(dataLine);
            setPhase(event.phase);
            setStatusMessage(event.message);

            if (event.phase === "profile_done" && event.profile) {
              setProfileInfo(event.profile);
            }

            if (event.phase === "posts_fetching" || event.phase === "posts_fetched") {
              setProgress((prev) => ({ ...prev, total: event.total }));
            }

            if (event.phase === "post" && event.post) {
              setPosts((prev) => [...prev, event.post]);
              setProgress({ current: event.current, total: event.total });
            }

            if (event.phase === "analyzing" || event.phase === "analyzed_post") {
              setAnalysisProgress({ current: event.current, total: event.total });
            }

            if (event.phase === "done") {
              await fetchCreators();
            }

            if (event.phase === "error") {
              toast.error(event.message);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setPhase("error");
      setStatusMessage(message);
      toast.error(message);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startScrape(platform, handle, depth);
  }

  function handleRescrape(creator: CreatorWithCount) {
    startScrape(creator.platform, creator.handle, 7);
  }

  function handleBack() {
    setPhase("idle");
    setHandle("");
  }

  // --- Progress Screen ---
  if (phase !== "idle") {
    const isWorking = !["done", "error"].includes(phase);
    const progressPct =
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 700,
                color: "#FAFAFA",
              }}
            >
              {phase === "done"
                ? "Scrape Complete"
                : phase === "error"
                  ? "Scrape Failed"
                  : "Scraping..."}
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
            >
              {statusMessage}
            </p>
          </div>
          {!isWorking && (
            <button
              onClick={handleBack}
              className="rounded-lg transition-all duration-200 hover:border-[#FF2D2D] hover:scale-[1.02]"
              style={{
                border: "1px solid #333",
                background: "transparent",
                fontFamily: "var(--font-heading)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#FAFAFA",
                padding: "8px 20px",
              }}
            >
              Back
            </button>
          )}
        </div>

        {/* Spinner */}
        {isWorking && (
          <div
            className="flex items-center gap-3 rounded-lg p-4"
            style={{ border: "1px solid #1F1F1F", background: "#111111" }}
          >
            <div
              className="h-5 w-5 animate-spin rounded-full"
              style={{ border: "2px solid #333", borderTopColor: "#FF2D2D" }}
            />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#FAFAFA" }}>
              {statusMessage}
            </span>
          </div>
        )}

        {/* Profile card */}
        {profileInfo && (
          <div className="rounded-xl p-5" style={{ border: "1px solid #1F1F1F", background: "#111111" }}>
            <div className="flex items-center gap-4">
              {profileInfo.profilePicUrl ? (
                <img
                  src={proxyUrl(profileInfo.profilePicUrl)}
                  alt={profileInfo.displayName}
                  className="h-14 w-14 rounded-full object-cover"
                  style={{ border: "2px solid #222" }}
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: "#161616",
                    border: "2px solid #222",
                    fontFamily: "var(--font-heading)",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#FF2D2D",
                  }}
                >
                  {profileInfo.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, color: "#FAFAFA" }}>
                  {profileInfo.displayName}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#00D4D4" }}>
                  @{profileInfo.handle}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "#FF2D2D" }}>
                  {formatNumber(profileInfo.followerCount)}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#6B6B6B", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Followers
                </p>
              </div>
            </div>
            {profileInfo.bio && (
              <p
                className="mt-3 leading-relaxed"
                style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1" }}
              >
                {profileInfo.bio}
              </p>
            )}
          </div>
        )}

        {/* Progress bar */}
        {progress.total > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A1A1A1" }}>
                {progress.current} / {progress.total} posts
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#00D4D4" }}>
                {progressPct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#161616" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #FF2D2D, #00D4D4)" }}
              />
            </div>
          </div>
        )}

        {/* Posts feed */}
        {posts.length > 0 && (
          <div
            ref={scrollRef}
            className="max-h-[500px] space-y-3 overflow-y-auto pr-1"
          >
            {posts.map((post, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl p-4 transition-all duration-200 hover:-translate-y-px animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ border: "1px solid #1F1F1F", background: "#111111" }}
              >
                {post.thumbnailUrl && (
                  <img
                    src={proxyUrl(post.thumbnailUrl)}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    style={{ border: "1px solid #1F1F1F" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 500,
                        ...(post.contentType === "reel"
                          ? { background: "rgba(255, 45, 45, 0.1)", color: "#FF2D2D", border: "1px solid rgba(255, 45, 45, 0.2)" }
                          : post.contentType === "carousel"
                            ? { background: "rgba(0, 212, 212, 0.1)", color: "#00D4D4", border: "1px solid rgba(0, 212, 212, 0.2)" }
                            : { background: "rgba(136, 136, 136, 0.1)", color: "#A1A1A1", border: "1px solid rgba(136, 136, 136, 0.2)" }),
                      }}
                    >
                      {post.contentType}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6B6B6B" }}>
                      {timeAgo(post.postedAt)}
                    </span>
                  </div>
                  <p
                    className="line-clamp-2 leading-snug"
                    style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#FAFAFA" }}
                  >
                    {post.caption || "No caption"}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    {post.viewCount > 0 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00D4D4" }}>
                        {formatNumber(post.viewCount)} views
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FF2D2D" }}>
                      {formatNumber(post.likeCount)} likes
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6B6B6B" }}>
                      {formatNumber(post.commentCount)} comments
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00D4D4", fontWeight: 600 }}>
                      {post.engagement}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis progress */}
        {(phase === "analyzing" || phase === "analyzed_post") && analysisProgress.total > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="h-4 w-4 animate-spin rounded-full"
                style={{ border: "2px solid #333", borderTopColor: "#00D4D4" }}
              />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#FAFAFA" }}>
                Analyzing content with AI ({analysisProgress.current}/{analysisProgress.total})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#161616" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((analysisProgress.current / analysisProgress.total) * 100)}%`,
                  background: "linear-gradient(90deg, #FF2D2D, #00D4D4)",
                }}
              />
            </div>
          </div>
        )}

        {/* Done summary */}
        {phase === "done" && (
          <div
            className="rounded-xl p-5 text-center"
            style={{ border: "1px solid rgba(0, 212, 212, 0.3)", background: "rgba(0, 212, 212, 0.05)" }}
          >
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: "#00D4D4" }}>
              {posts.length} posts scraped and saved
            </p>
            <p
              className="mt-1"
              style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1" }}
            >
              Head to the Library to browse and analyze this content.
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- Default Form View ---
  return (
    <div className="space-y-8">
      <div>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "22px",
            fontWeight: 700,
            color: "#FAFAFA",
          }}
        >
          Creator Scraper
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
        >
          Add creator handles, choose a platform, and scrape their content.
        </p>
      </div>

      {/* Scrape Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl p-6"
        style={{ border: "1px solid #1F1F1F", background: "#111111" }}
      >
        {/* Platform Tabs */}
        <div className="space-y-2">
          <label
            className="block"
            style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#A1A1A1", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Platform
          </label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className="rounded-lg px-4 py-2 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 500,
                  ...(platform === p.value
                    ? { background: "#FF2D2D", color: "#fff" }
                    : { border: "1px solid #1F1F1F", color: "#A1A1A1", background: "#161616" }),
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Handle Input */}
        <div className="space-y-2">
          <label
            htmlFor="handle"
            className="block"
            style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#A1A1A1", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Creator Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            className="w-full max-w-md rounded-md px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#FF2D2D]"
            style={{
              border: "1px solid #1F1F1F",
              background: "#0A0A0A",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "#FAFAFA",
            }}
          />
        </div>

        {/* Depth Selector */}
        <div className="space-y-2">
          <label
            className="block"
            style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#A1A1A1", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
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
                  className="h-4 w-4"
                  style={{ accentColor: "#FF2D2D" }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#FAFAFA" }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="rounded-lg px-6 py-2.5 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02]"
          style={{
            background: "#FF2D2D",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 600,
            color: "#fff",
          }}
        >
          Scrape
        </button>
      </form>

      {/* Creators List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "16px",
              fontWeight: 600,
              color: "#FAFAFA",
            }}
          >
            Scraped Creators
          </h2>
          {selectedCreators.size > 0 && (
            <button
              onClick={deleteSelected}
              className="rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-red-500/20"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#f87171",
              }}
            >
              Delete Selected ({selectedCreators.size})
            </button>
          )}
        </div>

        {creatorsLoading ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
            Loading creators...
          </p>
        ) : creators.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}>
            No creators scraped yet. Add a handle above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #1F1F1F", background: "#111111" }}>
            <table className="w-full text-left">
              <thead style={{ borderBottom: "1px solid #1F1F1F" }}>
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCreators.size === creators.length && creators.length > 0}
                      onChange={toggleSelectAll}
                      style={{ accentColor: "#FF2D2D" }}
                    />
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Handle
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Platform
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Posts
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Last Scraped
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    style={{ borderBottom: "1px solid #1A1A1A" }}
                    className={`transition-colors ${selectedCreators.has(creator.id) ? "bg-[#161616]" : "hover:bg-[#161616]"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCreators.has(creator.id)}
                        onChange={() => toggleSelect(creator.id)}
                        style={{ accentColor: "#FF2D2D" }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#FAFAFA" }}>
                        @{creator.handle}
                      </span>
                      {creator.display_name && (
                        <span
                          className="ml-2"
                          style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B" }}
                        >
                          ({creator.display_name})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-md px-2 py-0.5 capitalize"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "#00D4D4",
                          background: "rgba(0, 212, 212, 0.1)",
                          border: "1px solid rgba(0, 212, 212, 0.2)",
                        }}
                      >
                        {creator.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#FAFAFA" }}>
                        {creator.post_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#6B6B6B" }}>
                        {formatDate(creator.scraped_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRescrape(creator)}
                          className="rounded-lg px-3 py-1 transition-all duration-200 hover:border-[#FF2D2D]"
                          style={{
                            border: "1px solid #333",
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#A1A1A1",
                            background: "transparent",
                          }}
                        >
                          Re-scrape
                        </button>
                        {confirmDeleteId === creator.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteCreator(creator.id)}
                              disabled={deletingId === creator.id}
                              className="rounded-lg px-3 py-1 transition-all duration-200"
                              style={{
                                background: "#ef4444",
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "#fff",
                                opacity: deletingId === creator.id ? 0.5 : 1,
                              }}
                            >
                              {deletingId === creator.id ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg px-3 py-1 transition-all duration-200"
                              style={{
                                border: "1px solid #333",
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "#A1A1A1",
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(creator.id)}
                            className="rounded-lg px-3 py-1 transition-all duration-200 hover:bg-red-500/20"
                            style={{
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              background: "rgba(239, 68, 68, 0.1)",
                              fontFamily: "var(--font-body)",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#f87171",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
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
