"use client";

import type { ContentWithRelations, Platform } from "@/types/database";
import { PlatformBadge, PlatformIcon } from "./platform-icon";
import { ViralityBadge } from "./virality-badge";
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

interface ContentCardProps {
  content: ContentWithRelations;
  onClick: (content: ContentWithRelations) => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const platform = (content.platform ?? content.creators?.platform) as Platform;
  const handle = content.creators?.handle ?? "Unknown";
  const tags = content.content_tags?.slice(0, 4) ?? [];

  return (
    <button
      type="button"
      onClick={() => onClick(content)}
      className="flex w-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-800/50"
    >
      {/* Thumbnail or fallback */}
      <div className="relative flex h-40 items-center justify-center bg-neutral-800">
        {content.thumbnail_url ? (
          <img
            src={content.thumbnail_url}
            alt={truncate(content.caption, 60)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <PlatformIcon platform={platform} />
            <span className="text-xs text-neutral-500">No thumbnail</span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <ViralityBadge score={content.virality_score} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Creator + platform */}
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} />
          <span className="truncate text-sm font-medium text-neutral-200">
            @{handle}
          </span>
        </div>

        {/* Caption preview */}
        <p className="text-xs leading-relaxed text-neutral-400">
          {truncate(content.caption, 120) || "No caption"}
        </p>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span title="Views">{formatNumber(content.view_count)} views</span>
          <span title="Likes">{formatNumber(content.like_count)} likes</span>
          {content.engagement_ratio !== null && (
            <span title="Engagement ratio">
              {Number(content.engagement_ratio).toFixed(2)}% eng
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <TagChip key={t.id ?? `${t.tag}-${t.category}`} tag={t.tag} category={t.category} />
            ))}
            {(content.content_tags?.length ?? 0) > 4 && (
              <span className="text-[11px] text-neutral-500">
                +{(content.content_tags?.length ?? 0) - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
