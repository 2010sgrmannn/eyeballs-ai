"use client";

import type { NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { colors } from "@/lib/design-tokens";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";

export function ProductNode({ id, data }: NodeProps<Node<CanvasNodeData>>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const productId = data.product_id as string | undefined;
  const products = (data.availableProducts as { id: string; name: string; type: string; description: string | null; price: string | null }[]) || [];
  const selected = products.find((p) => p.id === productId);

  return (
    <BaseNode
      id={id}
      accentColor={colors.nodeProduct}
      title={data.label || "Product"}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      }
    >
      {products.length > 0 ? (
        <select
          value={productId || ""}
          onChange={(e) => {
            const sel = products.find((p) => p.id === e.target.value);
            updateNodeData(id, {
              product_id: e.target.value || undefined,
              product_name: sel?.name || undefined,
              label: sel?.name || "Product",
            });
          }}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-white/5 border border-white/[0.08] text-[#FAFAFA] focus:outline-none focus:border-[#6366F1]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <option value="">Select a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      ) : (
        <p className="text-xs" style={{ color: "#6B6B6B" }}>
          No products available
        </p>
      )}
      {selected && (
        <div className="mt-2 space-y-1">
          {selected.description && (
            <p className="text-xs line-clamp-2" style={{ color: "#A1A1A1" }}>
              {selected.description}
            </p>
          )}
          {selected.price && (
            <p className="text-xs" style={{ color: colors.nodeProduct }}>
              {selected.price}
            </p>
          )}
        </div>
      )}
    </BaseNode>
  );
}
