"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

function CanvasIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function ScraperIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CollectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ContextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ScriptsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}
    >
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Canvas", href: "/dashboard/canvas", description: "Visual script builder", icon: <CanvasIcon /> },
  { label: "Scraper", href: "/dashboard/scraper", description: "Add creators, trigger scrapes", icon: <ScraperIcon /> },
  { label: "Library", href: "/dashboard/library", description: "Browse all scraped content", icon: <LibraryIcon /> },
  { label: "Collections", href: "/dashboard/collections", description: "Favorites & custom lists", icon: <CollectionsIcon /> },
  { label: "Context", href: "/dashboard/context", description: "Products, courses & services", icon: <ContextIcon /> },
  { label: "Scripts", href: "/dashboard/scripts", description: "AI script generation", icon: <ScriptsIcon /> },
  { label: "Settings", href: "/dashboard/settings", description: "Brand profile, account", icon: <SettingsIcon /> },
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#ff3333" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill={active ? "#ff3333" : "currentColor"} stroke="none" />
    </svg>
  );
}

function TikTokIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#00D4D4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function LinkedInIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#7B2FBE" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
      <path d="M8 11v5M8 8v.01M12 16v-5c0-1.1.9-2 2-2s2 .9 2 2v5" />
    </svg>
  );
}

function TwitterIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#00D4D4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const STORAGE_KEY = "eyeballs-sidebar-collapsed";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

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
      className={`flex flex-col min-h-0 transition-[width] duration-200 ease-out ${className ?? ""}`}
      style={{
        width: collapsed ? "60px" : "256px",
        background: "var(--color-surface)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid var(--color-border)",
      }}
      data-testid="sidebar"
    >
      <nav className="flex-1 px-2 py-4 space-y-0.5" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg transition-all duration-[120ms] ${
                active
                  ? "bg-[var(--color-accent-muted)] border-l-2 border-[var(--color-accent)] text-white"
                  : "border-l-2 border-transparent text-[#888] hover:bg-white/[0.08] hover:text-[#E0E0E0]"
              }`}
              style={{
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              title={collapsed ? item.label : undefined}
              data-testid={`nav-item-${item.label.toLowerCase()}`}
            >
              <span className="shrink-0 flex items-center justify-center" style={{ width: "18px", height: "18px" }}>
                {item.icon}
              </span>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span
                    className="truncate"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: "13px",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="mt-0.5 truncate"
                    style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#555555" }}
                  >
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Platform filters */}
      {!collapsed && (
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <p
            className="px-3 mb-2"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "#555555",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Platforms
          </p>
          <div className="flex items-center gap-1.5 px-3" data-testid="platform-filters">
            {platforms.map((platform) => {
              const active = activePlatforms.has(platform.id);
              const Icon = platformIcons[platform.id];
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-2 rounded-lg transition-all duration-[120ms] ${
                    active
                      ? "border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] text-[#E0E0E0]"
                      : "border border-transparent bg-transparent text-[#555] hover:bg-white/[0.08]"
                  }`}
                  aria-label={`${platform.label} filter`}
                  aria-pressed={active}
                  data-testid={`platform-filter-${platform.id}`}
                >
                  <Icon active={active} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div
        className="px-2 py-3 flex justify-center"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg text-[#555] hover:bg-white/[0.08] hover:text-[#E0E0E0] transition-all duration-[120ms]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-testid="sidebar-collapse-toggle"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>
    </aside>
  );
}
