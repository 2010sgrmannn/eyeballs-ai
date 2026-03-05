"use client";

import type { NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { colors } from "@/lib/design-tokens";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";

export function ContentFolderNode({ id, data }: NodeProps<Node<CanvasNodeData>>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const folderName = (data.folder_name as string) || "No folder selected";
  const folderId = data.folder_id as string | undefined;
  const folders = (data.availableFolders as { id: string; name: string }[]) || [];

  return (
    <BaseNode
      id={id}
      accentColor={colors.nodeContent}
      title={data.label || "Content Folder"}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      }
    >
      {folders.length > 0 ? (
        <select
          value={folderId || ""}
          onChange={(e) => {
            const selected = folders.find((f) => f.id === e.target.value);
            updateNodeData(id, {
              folder_id: e.target.value || undefined,
              folder_name: selected?.name || undefined,
            });
          }}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-white/5 border border-white/[0.08] text-[#FAFAFA] focus:outline-none focus:border-[#ff3333]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <option value="">Select a folder...</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-xs" style={{ color: "#6B6B6B" }}>
          {folderName}
        </p>
      )}
      {folderId && (
        <p className="text-[10px] mt-2" style={{ color: "#6B6B6B" }}>
          Content from this folder will be used as reference for script generation.
        </p>
      )}
    </BaseNode>
  );
}
