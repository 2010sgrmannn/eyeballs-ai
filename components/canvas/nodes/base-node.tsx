"use client";

import { Handle, Position } from "@xyflow/react";
import { useCanvasStore } from "@/lib/stores/canvas-store";

interface BaseNodeProps {
  id: string;
  accentColor: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function BaseNode({ id, accentColor, title, icon, children }: BaseNodeProps) {
  const removeNode = useCanvasStore((s) => s.removeNode);

  return (
    <div
      className="glass-card group relative animate-node-appear"
      style={{
        borderColor: `${accentColor}33`,
        minWidth: 240,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </span>
        <span
          className="text-sm font-medium flex-1 truncate"
          style={{ color: "#FAFAFA", fontFamily: "var(--font-heading)" }}
        >
          {title}
        </span>
        <button
          onClick={() => removeNode(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20"
          style={{ color: "#EF4444" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">{children}</div>

      {/* Handles — visual size is 12px via CSS, hit area is 24px */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 12, height: 12 }}
      />
    </div>
  );
}
