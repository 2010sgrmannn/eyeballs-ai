"use client";

import { useState, useCallback } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useReactFlow } from "@xyflow/react";
import type { CanvasNodeType } from "@/types/database";

const NODE_TYPES: { type: CanvasNodeType; label: string; icon: string }[] = [
  { type: "backstory", label: "Backstory", icon: "👤" },
  { type: "content_folder", label: "Content Folder", icon: "📁" },
  { type: "product", label: "Product", icon: "🛍" },
  { type: "youtube", label: "YouTube Video", icon: "▶" },
  { type: "ai_chat", label: "AI Chat Agent", icon: "🤖" },
];

export function useCanvasContextMenu() {
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number } | null>(null);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setContextPosition(null);
  }, []);

  return { contextPosition, onPaneContextMenu, closeMenu };
}

export function CanvasContextMenu({
  contextPosition,
  closeMenu,
}: {
  contextPosition: { x: number; y: number } | null;
  closeMenu: () => void;
}) {
  const addNode = useCanvasStore((s) => s.addNode);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();

  function handleAddNode(type: CanvasNodeType) {
    if (!contextPosition) return;
    const position = screenToFlowPosition(contextPosition);
    addNode(type, position);
    closeMenu();
  }

  if (!contextPosition) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={closeMenu}
      onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}
    >
      <div
        className="absolute animate-context-menu min-w-[200px] rounded-lg py-1"
        style={{
          top: contextPosition.y,
          left: contextPosition.x,
          background: "rgba(15, 25, 35, 0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add Block submenu - rendered inline */}
        <div className="relative group">
          <button
            className="flex items-center justify-between w-full px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-white/[0.08]"
            style={{ color: "#FAFAFA", fontFamily: "var(--font-body)" }}
          >
            Add Block
            <span style={{ color: "#6B6B6B" }}>▸</span>
          </button>
          <div
            className="absolute left-full top-0 ml-1 min-w-[180px] rounded-lg py-1 hidden group-hover:block"
            style={{
              background: "rgba(15, 25, 35, 0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
          >
            {NODE_TYPES.map((nt) => (
              <button
                key={nt.type}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-white/[0.08]"
                style={{ color: "#FAFAFA", fontFamily: "var(--font-body)" }}
                onClick={() => handleAddNode(nt.type)}
              >
                <span className="w-5 text-center">{nt.icon}</span>
                {nt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="my-1" style={{ height: 1, background: "rgba(255, 255, 255, 0.06)" }} />

        <button
          className="flex items-center justify-between w-full px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-white/[0.08]"
          style={{ color: "#FAFAFA", fontFamily: "var(--font-body)" }}
          onClick={() => { zoomIn(); closeMenu(); }}
        >
          Zoom In
          <span style={{ color: "#6B6B6B", fontSize: 12 }}>⌘+</span>
        </button>
        <button
          className="flex items-center justify-between w-full px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-white/[0.08]"
          style={{ color: "#FAFAFA", fontFamily: "var(--font-body)" }}
          onClick={() => { zoomOut(); closeMenu(); }}
        >
          Zoom Out
          <span style={{ color: "#6B6B6B", fontSize: 12 }}>⌘-</span>
        </button>
        <button
          className="flex items-center justify-between w-full px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-white/[0.08]"
          style={{ color: "#FAFAFA", fontFamily: "var(--font-body)" }}
          onClick={() => { fitView({ padding: 0.2 }); closeMenu(); }}
        >
          Fit View
          <span style={{ color: "#6B6B6B", fontSize: 12 }}>⌘1</span>
        </button>
      </div>
    </div>
  );
}
