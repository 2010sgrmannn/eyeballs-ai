"use client";

import { LogoutButton } from "@/app/dashboard/logout-button";

interface HeaderProps {
  userEmail: string;
  onMenuToggle?: () => void;
}

export function Header({ userEmail, onMenuToggle }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 sm:px-6"
      style={{
        background: "rgba(9, 17, 26, 0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--color-border)",
      }}
      data-testid="header"
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 lg:hidden text-[#888] hover:text-white transition-colors duration-150"
            aria-label="Toggle menu"
            data-testid="menu-toggle"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        )}
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "15px",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "-0.025em",
          }}
          data-testid="logo"
        >
          EYEBALLS.AI
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden text-xs sm:block"
          style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#888888" }}
          data-testid="user-email"
        >
          {userEmail}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
