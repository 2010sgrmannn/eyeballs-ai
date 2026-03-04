"use client";

import { useRef, useState } from "react";
import type { ContentWithRelations, Platform } from "@/types/database";
import { PlatformBadge } from "./platform-icon";
import { TagChip } from "./tag-chip";

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function proxyVideoUrl(url: string | null): string {
  if (!url) return "";
  return `/api/proxy-video?url=${encodeURIComponent(url)}`;
}

function proxyImageUrl(url: string | null): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
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
  const isVideo = content.content_type === "reel" || content.content_type === "video";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselUrls = content.carousel_urls;
  const isCarousel = carouselUrls && carouselUrls.length > 0;

  const allTags = (content.content_tags ?? []).slice(0, 5);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function getViralityColor(score: number | null | undefined): string {
    if (score === null || score === undefined) return "#6B6B6B";
    if (score >= 70) return "#FF2D2D";
    if (score >= 40) return "#A1A1A1";
    return "#6B6B6B";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8 backdrop-blur-sm"
      style={{ background: "rgba(10, 10, 10, 0.8)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Content detail"
    >
      <div
        className="w-full max-w-lg shadow-2xl shadow-black/50 animate-in fade-in duration-200"
        style={{ border: "1px solid #1F1F1F", background: "#1A1A1A", borderRadius: "12px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid #1F1F1F" }}
        >
          <div className="flex items-center gap-3">
            <PlatformBadge platform={platform} />
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "14px", color: "#E0E0E0" }}>
              @{handle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 transition-colors duration-200 hover:bg-[#1F1F1F]"
            style={{ color: "#555" }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Video Player / Image / Carousel */}
        <div
          className="group/media relative w-full"
          style={{ aspectRatio: "9/16", background: "#000" }}
          onClick={isVideo && !isCarousel ? togglePlay : undefined}
        >
          {isVideo && content.media_url ? (
            <>
              <video
                ref={videoRef}
                src={proxyVideoUrl(content.media_url)}
                poster={content.thumbnail_url ? proxyImageUrl(content.thumbnail_url) : undefined}
                className="h-full w-full object-contain"
                playsInline
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                    style={{
                      background: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A0A0A">
                      <polygon points="8,5 20,12 8,19" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          ) : isCarousel ? (
            <>
              <img
                src={proxyImageUrl(carouselUrls[currentSlide])}
                alt={`Slide ${currentSlide + 1}`}
                className="h-full w-full object-contain"
              />

              {/* Left arrow */}
              {currentSlide > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentSlide((s) => s - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(10,10,10,0.7)",
                    border: "1px solid #2A2A2A",
                  }}
                  aria-label="Previous slide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* Right arrow */}
              {currentSlide < carouselUrls.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentSlide((s) => s + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(10,10,10,0.7)",
                    border: "1px solid #2A2A2A",
                  }}
                  aria-label="Next slide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center" style={{ gap: "4px" }}>
                {carouselUrls.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    style={{
                      width: idx === currentSlide ? "8px" : "6px",
                      height: idx === currentSlide ? "8px" : "6px",
                      borderRadius: "50%",
                      background: idx === currentSlide ? "#FF2D2D" : "#484848",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </>
          ) : content.thumbnail_url ? (
            <img
              src={proxyImageUrl(content.thumbnail_url)}
              alt="Content"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "#555" }}>
                No media available
              </span>
            </div>
          )}
        </div>

        {/* Metrics bar */}
        <div
          className="grid grid-cols-3"
          style={{ borderBottom: "1px solid #1F1F1F", borderTop: "1px solid #1F1F1F" }}
        >
          <MetricCell label="Views" value={formatNumber(content.view_count)} color="#00D4D4" />
          <MetricCell label="Likes" value={formatNumber(content.like_count)} color="#E0E0E0" border />
          <MetricCell label="Comments" value={formatNumber(content.comment_count)} color="#E0E0E0" />
        </div>

        {/* Body content */}
        <div className="space-y-4 p-4">
          {/* Transcript */}
          {content.transcript && (
            <div>
              <h3
                className="mb-2"
                style={{ fontFamily: "var(--font-heading)", fontSize: "12px", color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}
              >
                Transcript
              </h3>
              <p
                className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 leading-relaxed"
                style={{
                  border: "1px solid #1F1F1F",
                  background: "#0A0A0A",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "#C0C0C0",
                }}
              >
                {content.transcript}
              </p>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <h3
                className="mb-2"
                style={{ fontFamily: "var(--font-heading)", fontSize: "12px", color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <span key={t.id ?? `${t.tag}-${t.category}`} className="inline-block">
                    <TagChip tag={t.tag} category={t.category} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Virality */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                color: "#555",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Virality
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                fontWeight: 600,
                color: getViralityColor(content.virality_score),
              }}
            >
              {content.virality_score !== null && content.virality_score !== undefined
                ? `${Math.round(content.virality_score)}/100`
                : "-/100"}
            </span>
          </div>

          {/* Caption */}
          <div>
            <h3
              className="mb-2"
              style={{ fontFamily: "var(--font-heading)", fontSize: "12px", color: "#555", letterSpacing: "1px", textTransform: "uppercase" }}
            >
              Caption
            </h3>
            <p
              className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg leading-relaxed"
              style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#C0C0C0" }}
            >
              {content.caption || "No caption available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  color,
  border,
}: {
  label: string;
  value: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center py-3"
      style={{
        borderLeft: border ? "1px solid #1F1F1F" : undefined,
        borderRight: border ? "1px solid #1F1F1F" : undefined,
      }}
    >
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", color: "#555", letterSpacing: "0.5px", textTransform: "uppercase" }}>
        {label}
      </span>
      <span
        className="mt-0.5"
        style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, color }}
      >
        {value}
      </span>
    </div>
  );
}
