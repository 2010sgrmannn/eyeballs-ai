"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  description: string;
}

const navItems: NavItem[] = [
  { label: "Scraper", href: "/dashboard/scraper", description: "Add creators, trigger scrapes" },
  { label: "Library", href: "/dashboard/library", description: "Browse all scraped content" },
  { label: "Scripts", href: "/dashboard/scripts", description: "AI script generation" },
  { label: "Settings", href: "/dashboard/settings", description: "Brand profile, account" },
];

type Platform = "instagram" | "tiktok" | "linkedin" | "twitter";

interface PlatformFilterItem {
  id: Platform;
  label: string;
}

const platforms: PlatformFilterItem[] = [
  { id: "instagram", label: "IG" },
  { id: "tiktok", label: "TT" },
  { id: "linkedin", label: "LI" },
  { id: "twitter", label: "X" },
];

function InstagramIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#E1306C" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill={active ? "#E1306C" : "currentColor"} stroke="none" />
    </svg>
  );
}

function TikTokIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#00F2EA" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function LinkedInIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#0A66C2" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
      <path d="M8 11v5M8 8v.01M12 16v-5c0-1.1.9-2 2-2s2 .9 2 2v5" />
    </svg>
  );
}

function TwitterIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#1DA1F2" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.7 16h4.3M4 20l6.8-9.3M20 4h-4.3l-5 6.8" />
    </svg>
  );
}

const platformIcons: Record<Platform, (props: { active: boolean }) => React.ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
};

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set());

  function togglePlatform(platform: Platform) {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`flex flex-col bg-neutral-900 border-r border-neutral-800 w-64 min-h-0 ${className ?? ""}`}
      data-testid="sidebar"
    >
      <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            }`}
            data-testid={`nav-item-${item.label.toLowerCase()}`}
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-xs text-neutral-500 mt-0.5">{item.description}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-800">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-3 mb-2">
          Platforms
        </p>
        <div className="flex items-center gap-2 px-3" data-testid="platform-filters">
          {platforms.map((platform) => {
            const isActive = activePlatforms.has(platform.id);
            const Icon = platformIcons[platform.id];
            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-neutral-800 ring-1 ring-neutral-700"
                    : "text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
                }`}
                aria-label={`${platform.label} filter`}
                aria-pressed={isActive}
                data-testid={`platform-filter-${platform.id}`}
              >
                <Icon active={isActive} />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
