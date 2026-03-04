"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  forwardRef,
  type ReactNode,
} from "react";
import type {
  BrandProfile,
  Folder,
  Product,
  Platform,
  ScriptStyle,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CanvasConfig {
  folderId: string;
  topic: string;
  platform: Platform;
  scriptStyle: ScriptStyle;
  includeProducts: boolean;
  selectedProductIds: string[];
}

interface GeneratedScript {
  style_label: string;
  pierced_topic?: string;
  hook: string;
  body: string;
  cta: string;
  saved?: boolean;
}

interface Wire {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  fromColor: string;
  toColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BLOCK_COLORS = {
  brand: "#FF2D2D",
  content: "#7B2FBE",
  video: "#00D4D4",
  products: "#F59E0B",
  output: "#22C55E",
};

const PLATFORM_OPTIONS: { value: Platform; label: string; icon: string }[] = [
  { value: "instagram", label: "IG", icon: "IG" },
  { value: "tiktok", label: "TT", icon: "TT" },
  { value: "linkedin", label: "LI", icon: "LI" },
  { value: "twitter", label: "X", icon: "X" },
];

const STYLE_OPTIONS: { value: ScriptStyle; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ---------------------------------------------------------------------------
// Block Shell
// ---------------------------------------------------------------------------

interface BlockShellProps {
  label: string;
  accent: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  children: ReactNode;
  className?: string;
}

const BlockShell = forwardRef<HTMLDivElement, BlockShellProps>(
  function BlockShell(
    { label, accent, hasInput = false, hasOutput = false, children, className = "w-64" },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`${className} shrink-0 rounded-xl relative`}
        style={{
          background: "#111111",
          border: "1px solid #1F1F1F",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 rounded-t-xl"
          style={{
            borderBottom: "1px solid #1F1F1F",
            background: `rgba(${hexToRgb(accent)}, 0.05)`,
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: accent,
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            {label}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">{children}</div>

        {/* Input port */}
        {hasInput && (
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
            style={{ borderColor: accent, background: "#0A0A0A" }}
          />
        )}

        {/* Output port */}
        {hasOutput && (
          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
            style={{ borderColor: accent, background: "#0A0A0A" }}
          />
        )}
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Block 1: Brand Voice (read-only)
// ---------------------------------------------------------------------------

function BrandVoiceContent({ profile }: { profile: BrandProfile | null }) {
  if (!profile) {
    return (
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "#6B6B6B",
        }}
      >
        No brand profile found. Set up your brand voice in Context.
      </p>
    );
  }

  return (
    <>
      {profile.display_name && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Creator
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#FAFAFA",
            }}
          >
            {profile.display_name}
          </p>
        </div>
      )}

      {profile.creator_archetype && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Archetype
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#FAFAFA",
            }}
          >
            {profile.creator_archetype}
          </p>
        </div>
      )}

      {profile.niche && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Niche
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#FAFAFA",
            }}
          >
            {profile.niche}
          </p>
        </div>
      )}

      {profile.tone_descriptors && profile.tone_descriptors.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "4px",
            }}
          >
            Tone
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.tone_descriptors.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded"
                style={{
                  background: "#161616",
                  border: "1px solid #1F1F1F",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "#A1A1A1",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.content_goal && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Goal
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "#A1A1A1",
            }}
          >
            {profile.content_goal}
          </p>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block 2: Content Reference
// ---------------------------------------------------------------------------

function ContentRefContent({
  folders,
  folderId,
  onFolderChange,
}: {
  folders: (Folder & { item_count?: number })[];
  folderId: string;
  onFolderChange: (id: string) => void;
}) {
  const selectedFolder = folders.find((f) => f.id === folderId);

  return (
    <>
      <div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          Source
        </p>
        <select
          value={folderId}
          onChange={(e) => onFolderChange(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1"
          style={{
            border: "1px solid #1F1F1F",
            background: "#0A0A0A",
            color: "#FAFAFA",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            outline: "none",
          }}
        >
          <option value="">Top viral content</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: BLOCK_COLORS.content,
        }}
      >
        {folderId && selectedFolder
          ? `${selectedFolder.item_count ?? "?"} videos`
          : "Top 10 by virality"}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Block 3: Video Settings
// ---------------------------------------------------------------------------

function VideoConfigContent({
  topic,
  platform,
  scriptStyle,
  onTopicChange,
  onPlatformChange,
  onStyleChange,
}: {
  topic: string;
  platform: Platform;
  scriptStyle: ScriptStyle;
  onTopicChange: (v: string) => void;
  onPlatformChange: (v: Platform) => void;
  onStyleChange: (v: ScriptStyle) => void;
}) {
  return (
    <>
      <div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          Topic
        </p>
        <textarea
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="What's the video about?"
          rows={3}
          className="w-full px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 resize-none"
          style={{
            border: "1px solid #1F1F1F",
            background: "#0A0A0A",
            color: "#FAFAFA",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
          }}
        />
      </div>

      <div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          Platform
        </p>
        <div className="flex gap-1">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPlatformChange(p.value)}
              className="flex-1 px-2 py-1.5 rounded-lg transition-all text-center"
              style={{
                border: `1px solid ${platform === p.value ? BLOCK_COLORS.video : "#1F1F1F"}`,
                background:
                  platform === p.value
                    ? `rgba(${hexToRgb(BLOCK_COLORS.video)}, 0.1)`
                    : "#0A0A0A",
                color:
                  platform === p.value ? BLOCK_COLORS.video : "#6B6B6B",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {p.icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          Length
        </p>
        <div className="flex gap-1">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onStyleChange(s.value)}
              className="flex-1 px-2 py-1 rounded-lg transition-all text-center"
              style={{
                border: `1px solid ${scriptStyle === s.value ? BLOCK_COLORS.video : "#1F1F1F"}`,
                background:
                  scriptStyle === s.value
                    ? `rgba(${hexToRgb(BLOCK_COLORS.video)}, 0.1)`
                    : "#0A0A0A",
                color:
                  scriptStyle === s.value ? BLOCK_COLORS.video : "#6B6B6B",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 500,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Block 4: Products
// ---------------------------------------------------------------------------

function ProductsContent({
  products,
  includeProducts,
  selectedProductIds,
  onToggle,
  onProductToggle,
}: {
  products: Product[];
  includeProducts: boolean;
  selectedProductIds: string[];
  onToggle: (v: boolean) => void;
  onProductToggle: (id: string) => void;
}) {
  const TYPE_BADGE_COLORS: Record<string, string> = {
    product: "#FF2D2D",
    guide: "#7B2FBE",
    freebie: "#22C55E",
    course: "#00D4D4",
    coaching: "#F59E0B",
    service: "#3B82F6",
    other: "#6B6B6B",
  };

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Include promo
        </p>
        <button
          onClick={() => onToggle(!includeProducts)}
          className="relative w-9 h-5 rounded-full transition-all"
          style={{
            background: includeProducts
              ? BLOCK_COLORS.products
              : "#1F1F1F",
          }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
            style={{
              left: includeProducts ? "18px" : "2px",
              background: "#FAFAFA",
            }}
          />
        </button>
      </div>

      {includeProducts && (
        <>
          {products.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#6B6B6B",
              }}
            >
              No offerings yet — add them in Context
            </p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {products.map((p) => {
                const selected = selectedProductIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => onProductToggle(p.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      border: `1px solid ${selected ? BLOCK_COLORS.products : "#1F1F1F"}`,
                      background: selected
                        ? `rgba(${hexToRgb(BLOCK_COLORS.products)}, 0.08)`
                        : "#0A0A0A",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: selected ? "#FAFAFA" : "#A1A1A1",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: `rgba(${hexToRgb(TYPE_BADGE_COLORS[p.type] || "#6B6B6B")}, 0.15)`,
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        color: TYPE_BADGE_COLORS[p.type] || "#6B6B6B",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {p.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block 5: Output / Generated Scripts
// ---------------------------------------------------------------------------

function OutputContent({
  scripts,
  generating,
  error,
  canGenerate,
  onGenerate,
  onSave,
  onCopy,
}: {
  scripts: GeneratedScript[];
  generating: boolean;
  error: string | null;
  canGenerate: boolean;
  onGenerate: () => void;
  onSave: (index: number) => void;
  onCopy: (index: number) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function handleCopy(i: number) {
    onCopy(i);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <>
      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating || !canGenerate}
        className="w-full py-3 rounded-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          border: `1px solid ${BLOCK_COLORS.output}`,
          background: generating
            ? "transparent"
            : BLOCK_COLORS.output,
          color: generating ? BLOCK_COLORS.output : "#0A0A0A",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate 5 Scripts"
        )}
      </button>

      {error && (
        <div
          className="px-3 py-2 rounded-lg"
          style={{
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#EF4444",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {/* Script cards */}
      {scripts.length > 0 && (
        <div className="space-y-2">
          {scripts.map((s, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <div
                key={i}
                className="rounded-lg overflow-hidden"
                style={{
                  border: "1px solid #1F1F1F",
                  background: "#0A0A0A",
                }}
              >
                {/* Card header */}
                <button
                  onClick={() =>
                    setExpandedIndex(isExpanded ? null : i)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: BLOCK_COLORS.output,
                      }}
                    >
                      {s.style_label}
                    </p>
                    {!isExpanded && (
                      <p
                        className="truncate mt-0.5"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: "#6B6B6B",
                        }}
                      >
                        {s.hook}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      color: "#6B6B6B",
                      fontSize: "10px",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                  >
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className="px-3 pb-3 space-y-2"
                    style={{ borderTop: "1px solid #1F1F1F" }}
                  >
                    {s.pierced_topic && (
                      <div className="pt-2">
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "10px",
                            color: "#F59E0B",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "2px",
                            fontWeight: 500,
                          }}
                        >
                          Pierced Topic
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            color: "#D4D4D4",
                            fontStyle: "italic",
                            lineHeight: 1.4,
                          }}
                        >
                          {s.pierced_topic}
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          color: "#FF2D2D",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "2px",
                          fontWeight: 500,
                        }}
                      >
                        Hook
                      </p>
                      <p
                        className="whitespace-pre-wrap"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "12px",
                          color: "#FAFAFA",
                          lineHeight: 1.5,
                        }}
                      >
                        {s.hook}
                      </p>
                    </div>

                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          color: "#00D4D4",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "2px",
                          fontWeight: 500,
                        }}
                      >
                        Body
                      </p>
                      <p
                        className="whitespace-pre-wrap"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "12px",
                          color: "#FAFAFA",
                          lineHeight: 1.5,
                        }}
                      >
                        {s.body}
                      </p>
                    </div>

                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          color: "#FF2D2D",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "2px",
                          fontWeight: 500,
                        }}
                      >
                        CTA
                      </p>
                      <p
                        className="whitespace-pre-wrap"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "12px",
                          color: "#FAFAFA",
                          lineHeight: 1.5,
                        }}
                      >
                        {s.cta}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex gap-2 pt-2"
                      style={{ borderTop: "1px solid #1F1F1F" }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(i);
                        }}
                        className="px-2.5 py-1 rounded-lg transition-all"
                        style={{
                          border: `1px solid ${copiedIndex === i ? BLOCK_COLORS.output : "#333333"}`,
                          color:
                            copiedIndex === i
                              ? BLOCK_COLORS.output
                              : "#A1A1A1",
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        {copiedIndex === i ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSave(i);
                        }}
                        disabled={s.saved}
                        className="px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                        style={{
                          border: `1px solid ${s.saved ? BLOCK_COLORS.output : "#333333"}`,
                          background: s.saved
                            ? `rgba(${hexToRgb(BLOCK_COLORS.output)}, 0.1)`
                            : "transparent",
                          color: s.saved
                            ? BLOCK_COLORS.output
                            : "#A1A1A1",
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        {s.saved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Wire SVG Layer
// ---------------------------------------------------------------------------

function WireLayer({ wires }: { wires: Wire[] }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        {wires.map((w, i) => (
          <linearGradient
            key={`grad-${i}`}
            id={`wire-grad-${i}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={w.fromColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={w.toColor} stopOpacity={0.6} />
          </linearGradient>
        ))}
        <style>
          {`@keyframes dash { to { stroke-dashoffset: -24; } }`}
        </style>
      </defs>
      {wires.map((w, i) => (
        <path
          key={i}
          d={`M ${w.x1} ${w.y1} C ${w.x1 + w.cx} ${w.y1}, ${w.x2 - w.cx} ${w.y2}, ${w.x2} ${w.y2}`}
          fill="none"
          stroke={`url(#wire-grad-${i})`}
          strokeWidth={2}
          strokeDasharray="8 4"
          style={{ animation: "dash 1.5s linear infinite" }}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------------------------

const BLOCK_ORDER_COLORS = [
  BLOCK_COLORS.brand,
  BLOCK_COLORS.content,
  BLOCK_COLORS.video,
  BLOCK_COLORS.products,
  BLOCK_COLORS.output,
];

export function ScriptCanvas() {
  // State
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [folders, setFolders] = useState<(Folder & { item_count?: number })[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<CanvasConfig>({
    folderId: "",
    topic: "",
    platform: "instagram",
    scriptStyle: "short",
    includeProducts: false,
    selectedProductIds: [],
  });
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wires, setWires] = useState<Wire[]>([]);

  // Refs
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [brandRes, foldersRes, productsRes] = await Promise.all([
          fetch("/api/brand-profile"),
          fetch("/api/folders"),
          fetch("/api/products"),
        ]);

        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrandProfile(data);
        }

        if (foldersRes.ok) {
          const data = await foldersRes.json();
          // folders API may return { folders: [...] } or a flat array
          const folderList = Array.isArray(data) ? data : data.folders ?? [];
          setFolders(folderList);
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data);
        }
      } catch {
        // silently fail — blocks will show empty states
      }
    }

    fetchData();
  }, []);

  // Wire calculation
  const calculateWires = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newWires: Wire[] = [];

    for (let i = 0; i < blockRefs.current.length - 1; i++) {
      const from = blockRefs.current[i];
      const to = blockRefs.current[i + 1];
      if (!from || !to) continue;

      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      const x1 = fromRect.right - canvasRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
      const x2 = toRect.left - canvasRect.left;
      const y2 = toRect.top + toRect.height / 2 - canvasRect.top;

      const cx = (x2 - x1) * 0.4;

      newWires.push({
        x1,
        y1,
        x2,
        y2,
        cx,
        fromColor: BLOCK_ORDER_COLORS[i],
        toColor: BLOCK_ORDER_COLORS[i + 1],
      });
    }

    setWires(newWires);
  }, []);

  useLayoutEffect(() => {
    calculateWires();

    const observer = new ResizeObserver(() => {
      calculateWires();
    });

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    blockRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [calculateWires, brandProfile, scripts]);

  // Recalculate wires when window resizes
  useEffect(() => {
    function onResize() {
      calculateWires();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calculateWires]);

  // Generate handler
  async function handleGenerate() {
    if (!config.topic.trim()) {
      setError("Please enter a topic in Video Config");
      return;
    }

    setError(null);
    setGenerating(true);
    setScripts([]);

    try {
      const res = await fetch("/api/scripts/canvas-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: config.topic.trim(),
          platform: config.platform,
          script_style: config.scriptStyle,
          folder_id: config.folderId || undefined,
          product_ids:
            config.includeProducts && config.selectedProductIds.length > 0
              ? config.selectedProductIds
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate scripts");
      }

      const data = await res.json();
      setScripts(
        data.scripts.map((s: GeneratedScript) => ({ ...s, saved: false }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  }

  // Save handler
  async function handleSave(index: number) {
    const s = scripts[index];
    if (!s || s.saved) return;

    const title =
      config.topic.trim().length > 60
        ? config.topic.trim().slice(0, 57) + "..."
        : config.topic.trim();

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title} (${s.style_label})`,
          topic: config.topic.trim(),
          script_body: JSON.stringify({
            hook: s.hook,
            body: s.body,
            cta: s.cta,
          }),
          platform: config.platform,
          script_style: config.scriptStyle,
        }),
      });

      if (res.ok) {
        setScripts((prev) =>
          prev.map((sc, i) => (i === index ? { ...sc, saved: true } : sc))
        );
      }
    } catch {
      // silently fail
    }
  }

  // Copy handler
  function handleCopy(index: number) {
    const s = scripts[index];
    if (!s) return;
    const text = `HOOK:\n${s.hook}\n\nBODY:\n${s.body}\n\nCTA:\n${s.cta}`;
    navigator.clipboard.writeText(text);
  }

  // Product toggle
  function handleProductToggle(id: string) {
    setConfig((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(id)
        ? prev.selectedProductIds.filter((pid) => pid !== id)
        : [...prev.selectedProductIds, id],
    }));
  }

  const canGenerate = config.topic.trim().length > 0;

  return (
    <div
      ref={canvasRef}
      className="relative overflow-x-auto rounded-xl"
      style={{
        background:
          "radial-gradient(circle, #1A1A1A 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundColor: "#0A0A0A",
        minHeight: "400px",
      }}
    >
      {/* Wire layer */}
      <WireLayer wires={wires} />

      {/* Block layer */}
      <div className="relative z-10 flex items-start gap-8 p-8 min-w-max">
        {/* Block 1: Brand Voice */}
        <BlockShell
          ref={(el) => {
            blockRefs.current[0] = el;
          }}
          label="Brand Voice"
          accent={BLOCK_COLORS.brand}
          hasOutput
        >
          <BrandVoiceContent profile={brandProfile} />
        </BlockShell>

        {/* Block 2: Content Reference */}
        <BlockShell
          ref={(el) => {
            blockRefs.current[1] = el;
          }}
          label="Content Inspiration"
          accent={BLOCK_COLORS.content}
          hasInput
          hasOutput
        >
          <ContentRefContent
            folders={folders}
            folderId={config.folderId}
            onFolderChange={(id) =>
              setConfig((prev) => ({ ...prev, folderId: id }))
            }
          />
        </BlockShell>

        {/* Block 3: Video Config */}
        <BlockShell
          ref={(el) => {
            blockRefs.current[2] = el;
          }}
          label="Video Config"
          accent={BLOCK_COLORS.video}
          hasInput
          hasOutput
        >
          <VideoConfigContent
            topic={config.topic}
            platform={config.platform}
            scriptStyle={config.scriptStyle}
            onTopicChange={(v) =>
              setConfig((prev) => ({ ...prev, topic: v }))
            }
            onPlatformChange={(v) =>
              setConfig((prev) => ({ ...prev, platform: v }))
            }
            onStyleChange={(v) =>
              setConfig((prev) => ({ ...prev, scriptStyle: v }))
            }
          />
        </BlockShell>

        {/* Block 4: Products */}
        <BlockShell
          ref={(el) => {
            blockRefs.current[3] = el;
          }}
          label="Product Promo"
          accent={BLOCK_COLORS.products}
          hasInput
          hasOutput
        >
          <ProductsContent
            products={products}
            includeProducts={config.includeProducts}
            selectedProductIds={config.selectedProductIds}
            onToggle={(v) =>
              setConfig((prev) => ({ ...prev, includeProducts: v }))
            }
            onProductToggle={handleProductToggle}
          />
        </BlockShell>

        {/* Block 5: Output */}
        <BlockShell
          ref={(el) => {
            blockRefs.current[4] = el;
          }}
          label="Output"
          accent={BLOCK_COLORS.output}
          hasInput
          className="w-80"
        >
          <OutputContent
            scripts={scripts}
            generating={generating}
            error={error}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            onSave={handleSave}
            onCopy={handleCopy}
          />
        </BlockShell>
      </div>
    </div>
  );
}
