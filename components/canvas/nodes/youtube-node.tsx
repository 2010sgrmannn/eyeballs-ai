"use client";

import { useState } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { colors } from "@/lib/design-tokens";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export function YoutubeNode({ id, data }: NodeProps<Node<CanvasNodeData>>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [urlInput, setUrlInput] = useState((data.youtube_url as string) || "");
  const thumbnail = (data.youtube_url as string)
    ? getYoutubeThumbnail(data.youtube_url as string)
    : null;

  return (
    <BaseNode
      id={id}
      accentColor={colors.nodeYoutube}
      title={data.label || "YouTube Video"}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
        </svg>
      }
    >
      <div className="space-y-2">
        <input
          type="url"
          placeholder="Paste YouTube URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onBlur={() => {
            updateNodeData(id, { youtube_url: urlInput || undefined });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateNodeData(id, { youtube_url: urlInput || undefined });
            }
          }}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-white/5 border border-white/[0.08] text-[#FAFAFA] placeholder-[#6B6B6B] focus:outline-none focus:border-[#ff3333]"
          style={{ fontFamily: "var(--font-body)" }}
        />
        {thumbnail && (
          <div className="rounded-md overflow-hidden">
            <img
              src={thumbnail}
              alt="YouTube thumbnail"
              className="w-full h-auto"
            />
          </div>
        )}
        <input
          type="text"
          placeholder="Video title (optional)"
          value={(data.video_title as string) || ""}
          onChange={(e) => updateNodeData(id, { video_title: e.target.value })}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-white/5 border border-white/[0.08] text-[#FAFAFA] placeholder-[#6B6B6B] focus:outline-none focus:border-[#ff3333]"
          style={{ fontFamily: "var(--font-body)" }}
        />
      </div>
    </BaseNode>
  );
}
