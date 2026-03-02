"use client";

import { LogoutButton } from "@/app/dashboard/logout-button";

interface HeaderProps {
  userEmail: string;
  onMenuToggle?: () => void;
}

export function Header({ userEmail, onMenuToggle }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3 sm:px-6"
      data-testid="header"
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
            aria-label="Toggle menu"
            data-testid="menu-toggle"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        )}
        <span className="text-lg font-semibold tracking-tight" data-testid="logo">
          eyeballs.ai
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-neutral-400 sm:block" data-testid="user-email">
          {userEmail}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
