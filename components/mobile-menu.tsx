"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Close menu on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
        data-testid="mobile-menu-backdrop"
      />
      {/* Sidebar panel */}
      <div className="fixed inset-y-0 left-0 w-64 z-50">
        <Sidebar className="h-full" />
      </div>
    </div>
  );
}
