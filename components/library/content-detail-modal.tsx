"use client";

import type { ContentWithRelations, Platform } from "@/types/database";
import { PlatformBadge } from "./platform-icon";
import { ViralityBadge } from "./virality-badge";
import { TagChip } from "./tag-chip";

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ContentDetailModalProps {
  content: ContentWithRelations;
  onClose: () => void;
}

export function ContentDetailModal({
  content,
  onClose,
}: ContentDetailModalProps) {
  const platform = (content.platform ?? content.creators?.platform) as Platform;
  const handle = content.creators?.handle ?? "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Content detail"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <PlatformBadge platform={platform} />
            <span className="font-medium text-neutral-200">@{handle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricBox label="Views" value={formatNumber(content.view_count)} />
            <MetricBox label="Likes" value={formatNumber(content.like_count)} />
            <MetricBox
              label="Comments"
              value={formatNumber(content.comment_count)}
            />
            <MetricBox
              label="Shares"
              value={formatNumber(content.share_count)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricBox
              label="Engagement"
              value={
                content.engagement_ratio !== null
                  ? `${Number(content.engagement_ratio).toFixed(2)}%`
                  : "-"
              }
            />
            <div className="flex flex-col items-center rounded-md border border-neutral-800 bg-neutral-900 p-3">
              <span className="text-xs text-neutral-500">Virality</span>
              <div className="mt-1">
                <ViralityBadge score={content.virality_score} />
              </div>
            </div>
            <MetricBox
              label="Posted"
              value={formatDate(content.posted_at)}
              small
            />
          </div>

          {/* Hook */}
          {content.hook_text && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-neutral-300">
                Hook
              </h3>
              <p className="rounded-md border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-300">
                {content.hook_text}
              </p>
            </div>
          )}

          {/* CTA */}
          {content.cta_text && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-neutral-300">
                Call to Action
              </h3>
              <p className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-blue-300">
                {content.cta_text}
              </p>
            </div>
          )}

          {/* Caption */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-neutral-300">
              Full Caption
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
              {content.caption || "No caption available"}
            </p>
          </div>

          {/* Transcript */}
          {content.transcript && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-neutral-300">
                Transcript
              </h3>
              <p className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm leading-relaxed text-neutral-400">
                {content.transcript}
              </p>
            </div>
          )}

          {/* Tags */}
          {content.content_tags && content.content_tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-300">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {content.content_tags.map((t) => (
                  <TagChip key={t.id ?? `${t.tag}-${t.category}`} tag={t.tag} category={t.category} />
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-1 text-xs text-neutral-500">
            {content.analyzed_at && (
              <p>Analyzed: {formatDate(content.analyzed_at)}</p>
            )}
            {content.external_id && (
              <p>External ID: {content.external_id}</p>
            )}
            {content.media_url && (
              <a
                href={content.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-400 underline hover:no-underline"
              >
                View original post
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-neutral-800 bg-neutral-900 p-3">
      <span className="text-xs text-neutral-500">{label}</span>
      <span
        className={`mt-1 font-semibold text-white ${small ? "text-xs" : "text-sm"}`}
      >
        {value}
      </span>
    </div>
  );
}
