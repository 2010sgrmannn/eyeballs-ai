"use client";

import { useState } from "react";
import { BrandProfileForm } from "@/components/brand-profile-form";
import type { BrandProfileFormData } from "@/types/brand-profile";

interface ProfileViewProps {
  profile: BrandProfileFormData;
  updatedAt?: string;
}

const CREATOR_TYPE_LABELS: Record<string, string> = {
  solo_creator: "Solo Creator",
  brand: "Brand",
  agency: "Agency",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📷",
  tiktok: "🎵",
  youtube: "▶️",
  twitter: "𝕏",
  linkedin: "in",
  facebook: "f",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2"
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "12px",
        color: "#6b7280",
        fontWeight: 500,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function PurpleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-lg"
      style={{
        border: "1px solid rgba(123, 47, 190, 0.3)",
        background: "rgba(123, 47, 190, 0.08)",
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "#7B2FBE",
      }}
    >
      {children}
    </span>
  );
}

function TealChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-lg"
      style={{
        border: "1px solid rgba(0, 212, 212, 0.3)",
        background: "rgba(0, 212, 212, 0.08)",
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "#00D4D4",
      }}
    >
      {children}
    </span>
  );
}

function NeutralChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-lg"
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-default)",
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "#f0f2f5",
      }}
    >
      {children}
    </span>
  );
}

function HandleBadge({ handle }: { handle: string }) {
  const clean = handle.startsWith("@") ? handle : `@${handle}`;
  return (
    <span
      className="inline-block px-3 py-1 rounded-lg"
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-default)",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "#f0f2f5",
      }}
    >
      {clean}
    </span>
  );
}

function TextBlock({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="whitespace-pre-wrap p-4 rounded-lg"
      style={{
        border: "1px solid var(--color-border-default)",
        background: "var(--color-background)",
        fontFamily: "var(--font-body)",
        fontSize: "14px",
        color: "#f0f2f5",
      }}
    >
      {children}
    </p>
  );
}

function ToneSlider({
  leftLabel,
  rightLabel,
  value,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
}) {
  // value is 1-5, map to percentage (1=0%, 5=100%)
  const pct = ((value - 1) / 4) * 100;
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-28 text-right shrink-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "#888888",
        }}
      >
        {leftLabel}
      </span>
      <div
        className="flex-1 relative rounded-full"
        style={{ height: "6px", background: "var(--color-surface-elevated)" }}
      >
        <div
          className="absolute top-1/2 rounded-full"
          style={{
            width: "12px",
            height: "12px",
            background: "#00D4D4",
            border: "2px solid var(--color-background)",
            transform: "translate(-50%, -50%)",
            left: `${pct}%`,
          }}
        />
        <div
          className="absolute top-0 left-0 rounded-full"
          style={{
            height: "6px",
            width: `${pct}%`,
            background: "linear-gradient(90deg, rgba(0,212,212,0.3), rgba(0,212,212,0.15))",
          }}
        />
      </div>
      <span
        className="w-28 shrink-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "#888888",
        }}
      >
        {rightLabel}
      </span>
    </div>
  );
}

function SectionDivider() {
  return <div className="my-6" style={{ borderTop: "1px solid var(--color-border)" }} />;
}

export function ProfileView({ profile, updatedAt }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);

  const sectionLabelStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 500 as const,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  };

  if (editing) {
    return (
      <div className="p-6 rounded-xl glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 style={sectionLabelStyle}>Edit brand profile</h2>
          <button
            onClick={() => setEditing(false)}
            className="transition-colors hover:text-[#FAFAFA]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#A1A1A1",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
        </div>
        <BrandProfileForm mode="edit" initialData={profile} />
      </div>
    );
  }

  // Determine which sections have data
  const hasIdentity =
    profile.display_name || profile.creator_type || profile.primary_platform;

  const hasSocialHandles =
    (profile.social_handles &&
      Object.values(profile.social_handles).some((v) => v)) ||
    (profile.inspiration_handles && profile.inspiration_handles.length > 0);

  const hasVoiceStyle =
    profile.niche ||
    (profile.tone_descriptors && profile.tone_descriptors.length > 0) ||
    profile.tone_formality !== 3 ||
    profile.tone_humor !== 3 ||
    profile.tone_authority !== 3 ||
    profile.creator_archetype ||
    profile.brand_voice ||
    profile.sample_content;

  const hasContentStrategy =
    (profile.content_pillars && profile.content_pillars.length > 0) ||
    profile.content_goal ||
    (profile.content_formats && profile.content_formats.length > 0) ||
    (profile.preferred_cta && profile.preferred_cta.length > 0);

  const hasAudience =
    (profile.audience_age_ranges && profile.audience_age_ranges.length > 0) ||
    profile.audience_gender ||
    profile.audience_problem ||
    profile.unique_value_prop ||
    (profile.values && profile.values.length > 0) ||
    profile.target_audience;

  const hasToneSliders =
    profile.tone_formality !== undefined ||
    profile.tone_humor !== undefined ||
    profile.tone_authority !== undefined;

  const socialEntries = profile.social_handles
    ? Object.entries(profile.social_handles).filter(([, v]) => v)
    : [];

  let renderedSections = 0;

  return (
    <div className="p-6 rounded-xl glass-card">
      <div className="flex items-center justify-between mb-6">
        <h2 style={sectionLabelStyle}>Brand profile</h2>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-1.5 rounded-lg transition-all"
          style={{
            border: "1px solid var(--color-border-hover)",
            color: "#A1A1A1",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Edit profile
        </button>
      </div>

      <div>
        {/* Section 1: Identity */}
        {hasIdentity && (
          <div>
            {renderedSections++ > 0 && <SectionDivider />}
            <SectionLabel>Identity</SectionLabel>
            <div className="space-y-3">
              {profile.display_name && (
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                    }}
                  >
                    {profile.display_name}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {profile.creator_type && (
                  <span
                    className="inline-block px-3 py-1 rounded-lg"
                    style={{
                      border: "1px solid rgba(255, 45, 45, 0.3)",
                      background: "rgba(255, 45, 45, 0.08)",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "#ff3333",
                    }}
                  >
                    {CREATOR_TYPE_LABELS[profile.creator_type] ||
                      profile.creator_type}
                  </span>
                )}
                {profile.primary_platform && (
                  <NeutralChip>
                    <span className="mr-1.5">
                      {PLATFORM_ICONS[profile.primary_platform.toLowerCase()] ||
                        ""}
                    </span>
                    {profile.primary_platform}
                  </NeutralChip>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Social Accounts */}
        {hasSocialHandles && (
          <div>
            {renderedSections++ > 0 && <SectionDivider />}
            <SectionLabel>Social accounts</SectionLabel>
            <div className="space-y-3">
              {socialEntries.length > 0 && (
                <div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Your handles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialEntries.map(([platform, handle]) => (
                      <div key={platform} className="flex items-center gap-1.5">
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            color: "#6b7280",
                            textTransform: "capitalize",
                          }}
                        >
                          {platform}
                        </span>
                        <HandleBadge handle={handle} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profile.inspiration_handles &&
                profile.inspiration_handles.length > 0 && (
                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "#888888",
                      }}
                    >
                      Inspiration
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.inspiration_handles.map((handle) => (
                        <HandleBadge key={handle} handle={handle} />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Section 3: Voice & Style */}
        {hasVoiceStyle && (
          <div>
            {renderedSections++ > 0 && <SectionDivider />}
            <SectionLabel>Voice &amp; style</SectionLabel>
            <div className="space-y-4">
              {/* Niche */}
              {profile.niche && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Niche
                  </p>
                  <PurpleBadge>{profile.niche}</PurpleBadge>
                </div>
              )}

              {/* Tone descriptors */}
              {profile.tone_descriptors &&
                profile.tone_descriptors.length > 0 && (
                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "#888888",
                      }}
                    >
                      Tone
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.tone_descriptors.map((t) => (
                        <TealChip key={t}>{t}</TealChip>
                      ))}
                    </div>
                  </div>
                )}

              {/* Tone sliders */}
              {hasToneSliders && (
                <div className="space-y-2.5">
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Tone balance
                  </p>
                  <ToneSlider
                    leftLabel="Formal"
                    rightLabel="Casual"
                    value={profile.tone_formality ?? 3}
                  />
                  <ToneSlider
                    leftLabel="Serious"
                    rightLabel="Playful"
                    value={profile.tone_humor ?? 3}
                  />
                  <ToneSlider
                    leftLabel="Authoritative"
                    rightLabel="Approachable"
                    value={profile.tone_authority ?? 3}
                  />
                </div>
              )}

              {/* Creator archetype */}
              {profile.creator_archetype && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Creator archetype
                  </p>
                  <span
                    className="inline-block px-3 py-1 rounded-lg"
                    style={{
                      border: "1px solid rgba(255, 45, 45, 0.3)",
                      background: "rgba(255, 45, 45, 0.08)",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "#ff3333",
                    }}
                  >
                    {profile.creator_archetype}
                  </span>
                </div>
              )}

              {/* Brand voice */}
              {profile.brand_voice && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Brand voice
                  </p>
                  <TextBlock>{profile.brand_voice}</TextBlock>
                </div>
              )}

              {/* Sample content */}
              {profile.sample_content && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Sample content
                  </p>
                  <TextBlock>{profile.sample_content}</TextBlock>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Content Strategy */}
        {hasContentStrategy && (
          <div>
            {renderedSections++ > 0 && <SectionDivider />}
            <SectionLabel>Content strategy</SectionLabel>
            <div className="space-y-4">
              {/* Content pillars */}
              {profile.content_pillars &&
                profile.content_pillars.length > 0 && (
                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "#888888",
                      }}
                    >
                      Content pillars
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.content_pillars.map((p) => (
                        <NeutralChip key={p}>{p}</NeutralChip>
                      ))}
                    </div>
                  </div>
                )}

              {/* Content goal */}
              {profile.content_goal && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Goal
                  </p>
                  <TealChip>{profile.content_goal}</TealChip>
                </div>
              )}

              {/* Content formats */}
              {profile.content_formats &&
                profile.content_formats.length > 0 && (
                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "#888888",
                      }}
                    >
                      Formats
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.content_formats.map((f) => (
                        <NeutralChip key={f}>{f}</NeutralChip>
                      ))}
                    </div>
                  </div>
                )}

              {/* Preferred CTAs */}
              {profile.preferred_cta && profile.preferred_cta.length > 0 && (
                <div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Preferred CTAs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_cta.map((c) => (
                      <NeutralChip key={c}>{c}</NeutralChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Audience */}
        {hasAudience && (
          <div>
            {renderedSections++ > 0 && <SectionDivider />}
            <SectionLabel>Audience</SectionLabel>
            <div className="space-y-4">
              {/* Age ranges */}
              {profile.audience_age_ranges &&
                profile.audience_age_ranges.length > 0 && (
                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "#888888",
                      }}
                    >
                      Age ranges
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.audience_age_ranges.map((a) => (
                        <NeutralChip key={a}>{a}</NeutralChip>
                      ))}
                    </div>
                  </div>
                )}

              {/* Gender focus */}
              {profile.audience_gender && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Gender focus
                  </p>
                  <NeutralChip>{profile.audience_gender}</NeutralChip>
                </div>
              )}

              {/* Audience problem */}
              {profile.audience_problem && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Audience problem
                  </p>
                  <TextBlock>{profile.audience_problem}</TextBlock>
                </div>
              )}

              {/* What makes you different */}
              {profile.unique_value_prop && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    What makes you different
                  </p>
                  <TextBlock>{profile.unique_value_prop}</TextBlock>
                </div>
              )}

              {/* Core values */}
              {profile.values && profile.values.length > 0 && (
                <div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Core values
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.values.map((value) => (
                      <PurpleBadge key={value}>{value}</PurpleBadge>
                    ))}
                  </div>
                </div>
              )}

              {/* Target audience */}
              {profile.target_audience && (
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "#888888",
                    }}
                  >
                    Target audience
                  </p>
                  <TextBlock>{profile.target_audience}</TextBlock>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Style (legacy) */}
        {profile.content_style && (
          <div>
            <SectionDivider />
            <SectionLabel>Content style</SectionLabel>
            <TextBlock>{profile.content_style}</TextBlock>
          </div>
        )}
      </div>

      {/* Last updated */}
      {updatedAt && (
        <p
          className="mt-6 pt-4"
          style={{
            borderTop: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Last updated{" "}
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
