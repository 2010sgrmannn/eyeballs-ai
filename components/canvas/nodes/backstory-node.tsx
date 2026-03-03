"use client";

import type { NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { colors } from "@/lib/design-tokens";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";

export function BackstoryNode({ id, data }: NodeProps<Node<CanvasNodeData>>) {
  const bio = (data.personal_bio as string) || "No backstory set yet";
  const struggle = data.biggest_struggle as string | undefined;
  const moment = data.defining_moment as string | undefined;

  return (
    <BaseNode
      id={id}
      accentColor={colors.nodeBackstory}
      title={data.label || "Backstory"}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      }
    >
      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#A1A1A1" }}>
        {bio}
      </p>
      {struggle && (
        <div className="mt-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
            Core Struggle
          </span>
          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "#A1A1A1" }}>
            {struggle}
          </p>
        </div>
      )}
      {moment && (
        <div className="mt-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
            Defining Moment
          </span>
          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "#A1A1A1" }}>
            {moment}
          </p>
        </div>
      )}
    </BaseNode>
  );
}
