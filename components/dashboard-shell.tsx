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
    <div className="flex h-screen flex-col bg-neutral-950">
      <Header userEmail={userEmail} onMenuToggle={handleMenuToggle} />
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar className="h-full" />
        </div>
        {/* Mobile menu */}
        <MobileMenu isOpen={mobileMenuOpen} onClose={handleMenuClose} />
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
