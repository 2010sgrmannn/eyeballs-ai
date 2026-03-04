"use client";

import { useState, useCallback } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./mobile-menu";

interface DashboardShellProps {
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <Header userEmail={userEmail} onMenuToggle={handleMenuToggle} />
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar className="h-full" />
        </div>
        {/* Mobile menu */}
        <MobileMenu isOpen={mobileMenuOpen} onClose={handleMenuClose} />
        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto p-6 z-10 h-full" data-testid="main-content">
          {/* Ambient orbs */}
          <div className="ambient-orb ambient-orb-indigo" />
          <div className="ambient-orb ambient-orb-purple" />
          <div className="ambient-orb ambient-orb-cyan" />

          {children}
        </main>
      </div>
    </div>
  );
}
