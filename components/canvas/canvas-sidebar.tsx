"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { Canvas } from "@/types/database";

interface CanvasSidebarProps {
  onNewCanvas: () => void;
  onSwitchCanvas: (id: string) => void;
}

const COLLAPSED_KEY = "canvas-sidebar-collapsed";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export function CanvasSidebar({ onNewCanvas, onSwitchCanvas }: CanvasSidebarProps) {
  const { canvases, activeCanvasId, deleteCanvas, renameCanvas } = useCanvasStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  const startRename = (canvas: Canvas) => {
    setEditingId(canvas.id);
    setEditValue(canvas.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameCanvas(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (canvases.length <= 1) return;
    await deleteCanvas(id);
  };

  return (
    <AnimatePresence mode="wait">
      {collapsed ? (
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          onClick={toggleCollapsed}
          className="absolute left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: "rgba(15, 25, 35, 0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <IconChevronRight className="text-[#A1A1A1]" />
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, x: -260 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -260 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute left-0 top-0 z-40 flex h-full w-[260px] flex-col"
          style={{
            background: "rgba(15, 25, 35, 0.85)",
            backdropFilter: "blur(16px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-[#f0f2f5]">Canvases</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewCanvas}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
              >
                <IconPlus className="text-[#A1A1A1]" />
              </button>
              <button
                onClick={toggleCollapsed}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
              >
                <IconChevronLeft className="text-[#A1A1A1]" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 h-px bg-white/[0.06]" />

          {/* Canvas list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {canvases.map((canvas) => {
              const isActive = canvas.id === activeCanvasId;
              const isEditing = canvas.id === editingId;

              return (
                <div
                  key={canvas.id}
                  onClick={() => {
                    if (!isEditing) onSwitchCanvas(canvas.id);
                  }}
                  onDoubleClick={() => startRename(canvas)}
                  onMouseEnter={() => setHoveredId(canvas.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative mb-0.5 flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{
                    background: isActive ? "rgba(255, 51, 51, 0.1)" : "transparent",
                    borderLeft: isActive ? "2px solid #ff3333" : "2px solid transparent",
                    color: isActive ? "#f0f2f5" : "#A1A1A1",
                  }}
                >
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full bg-transparent text-sm text-[#f0f2f5] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate">{canvas.name}</span>
                  )}

                  {hoveredId === canvas.id && !isEditing && canvases.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, canvas.id)}
                      className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                    >
                      <IconTrash className="text-[#6B6B6B]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
