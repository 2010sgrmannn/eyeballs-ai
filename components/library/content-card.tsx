"use client";

import type { ContentWithRelations, Platform } from "@/types/database";
import { PlatformBadge, PlatformIcon } from "./platform-icon";
import { ViralityBadge } from "./virality-badge";
import { ContentTypeBadge } from "./content-type-badge";
import { TagChip } from "./tag-chip";

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function proxyUrl(url: string | null): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

interface ContentCardProps {
  content: ContentWithRelations;
  onClick: (content: ContentWithRelations) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function ContentCard({
  content,
  onClick,
  isFavorited,
  onToggleFavorite,
  isSelected,
  onToggleSelect,
}: ContentCardProps) {
  const platform = (content.platform ?? content.creators?.platform) as Platform;
  const handle = content.creators?.handle ?? "Unknown";
  const tags = content.content_tags?.slice(0, 3) ?? [];
  const isVideo = content.content_type === "reel" || content.content_type === "video";

  return (
    <div
      className="group flex w-full flex-col overflow-hidden text-left transition-all duration-200 ease-out"
      style={{
        border: isSelected ? "2px solid #FF2D2D" : "1px solid #1F1F1F",
        background: "#1A1A1A",
        borderRadius: "12px",
      }}
    >
      {/* Thumbnail - clickable to open detail */}
      <button
        type="button"
        onClick={() => onClick(content)}
        className="relative w-full overflow-hidden rounded-t-lg hover:brightness-110 transition-all duration-200"
        style={{ aspectRatio: "9/16", background: "#0A0A0A" }}
      >
        {content.thumbnail_url ? (
          <img
            src={proxyUrl(content.thumbnail_url)}
            alt={truncate(content.caption, 60)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <PlatformIcon platform={platform} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#555" }}>
              No thumbnail
            </span>
          </div>
        )}

        {/* Play button overlay for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-200 group-hover:bg-black/40">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{ background: "rgba(255, 255, 255, 0.9)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0A0A">
                <polygon points="8,5 20,12 8,19" />
              </svg>
            </div>
          </div>
        )}

        {/* Top-left: platform + type in a row */}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          <PlatformBadge platform={platform} />
          <ContentTypeBadge content_type={content.content_type} carousel_urls={content.carousel_urls} />
        </div>

        {/* Top-right: virality */}
        <div className="absolute right-2 top-2">
          <ViralityBadge score={content.virality_score} />
        </div>

        {/* Metrics overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-2"
          style={{ background: "linear-gradient(transparent, rgba(10, 10, 10, 0.95))" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FF2D2D" }}>
            {formatNumber(content.view_count)} views
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#888" }}>
            {formatNumber(content.like_count)} likes
          </span>
          {content.engagement_ratio !== null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#888" }}>
              {(Number(content.engagement_ratio) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </button>

      {/* Card footer with info + actions */}
      <div className="flex flex-col gap-1.5 p-2.5">
        {/* Creator + action buttons row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "#E0E0E0" }}
          >
            @{handle}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {/* Favorite star */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(content.id);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 hover:bg-[#2A2A2A]"
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? "#FF2D2D" : "none"} stroke={isFavorited ? "#FF2D2D" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
            {/* Select checkbox */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(content.id);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 hover:bg-[#2A2A2A]"
                title={isSelected ? "Deselect" : "Select"}
              >
                <div
                  className="flex h-4 w-4 items-center justify-center rounded"
                  style={{
                    background: isSelected ? "#FF2D2D" : "transparent",
                    border: isSelected ? "1.5px solid #FF2D2D" : "1.5px solid #555",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Caption preview */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888", lineHeight: 1.4 }}>
          {truncate(content.caption, 80) || "No caption"}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <TagChip key={t.id ?? `${t.tag}-${t.category}`} tag={t.tag} category={t.category} />
            ))}
            {(content.content_tags?.length ?? 0) > 3 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#555" }}>
                +{(content.content_tags?.length ?? 0) - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
