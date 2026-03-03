import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type { Canvas, CanvasNode, CanvasEdge, CanvasNodeType } from "@/types/database";
import { canvasConfig } from "@/lib/design-tokens";

export interface CanvasNodeData extends Record<string, unknown> {
  nodeType: CanvasNodeType;
  label?: string;
  // Type-specific data
  [key: string]: unknown;
}

interface CanvasState {
  // Multi-canvas state
  canvases: Canvas[];
  activeCanvasId: string | null;

  // Current canvas nodes/edges
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  isDirty: boolean;
  isSaving: boolean;

  // Canvas CRUD
  fetchCanvases: () => Promise<void>;
  createCanvas: (name: string, brief?: Record<string, unknown> | null) => Promise<Canvas | null>;
  deleteCanvas: (id: string) => Promise<void>;
  renameCanvas: (id: string, name: string) => Promise<void>;
  setActiveCanvas: (id: string | null) => void;

  // Node/edge actions
  setNodes: (nodes: Node<CanvasNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<Node<CanvasNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: CanvasNodeType, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<CanvasNodeData>) => void;
  saveCanvas: () => Promise<void>;
  loadCanvas: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function dbNodeToFlowNode(n: CanvasNode): Node<CanvasNodeData> {
  return {
    id: n.id,
    type: n.node_type,
    position: { x: n.position_x, y: n.position_y },
    data: {
      ...(n.data as Record<string, unknown>),
      nodeType: n.node_type,
      label: n.label ?? undefined,
    },
    style: {
      width: n.width,
      height: n.height,
    },
  };
}

function dbEdgeToFlowEdge(e: CanvasEdge): Edge {
  return {
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    type: "animated",
    animated: e.animated,
    data: { edgeType: e.edge_type },
  };
}

function getDefaultDimensions(type: CanvasNodeType): { width: number; height: number } {
  if (type === "ai_chat") {
    return { width: canvasConfig.aiChatNodeWidth, height: canvasConfig.aiChatNodeHeight };
  }
  return { width: canvasConfig.defaultNodeWidth, height: canvasConfig.defaultNodeHeight };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvases: [],
  activeCanvasId: null,
  nodes: [],
  edges: [],
  isDirty: false,
  isSaving: false,

  fetchCanvases: async () => {
    try {
      const res = await fetch("/api/canvases");
      if (!res.ok) return;
      const { canvases } = await res.json();
      set({ canvases: canvases ?? [] });
    } catch (err) {
      console.error("Failed to fetch canvases:", err);
    }
  },

  createCanvas: async (name, brief) => {
    try {
      const res = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brief: brief ?? null }),
      });
      if (!res.ok) return null;
      const { canvas } = await res.json();
      set((s) => ({ canvases: [canvas, ...s.canvases] }));
      return canvas;
    } catch (err) {
      console.error("Failed to create canvas:", err);
      return null;
    }
  },

  deleteCanvas: async (id) => {
    try {
      const res = await fetch(`/api/canvases/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      const state = get();
      const remaining = state.canvases.filter((c) => c.id !== id);
      const updates: Partial<CanvasState> = { canvases: remaining };
      if (state.activeCanvasId === id) {
        updates.activeCanvasId = remaining[0]?.id ?? null;
        updates.nodes = [];
        updates.edges = [];
        updates.isDirty = false;
      }
      set(updates as CanvasState);
    } catch (err) {
      console.error("Failed to delete canvas:", err);
    }
  },

  renameCanvas: async (id, name) => {
    try {
      const res = await fetch(`/api/canvases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const { canvas } = await res.json();
      set((s) => ({
        canvases: s.canvases.map((c) => (c.id === id ? canvas : c)),
      }));
    } catch (err) {
      console.error("Failed to rename canvas:", err);
    }
  },

  setActiveCanvas: (id) => {
    // Cancel any pending save from previous canvas
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set({ activeCanvasId: id, nodes: [], edges: [], isDirty: false });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
    debouncedSave(get);
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
    debouncedSave(get);
  },

  onConnect: (connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) return;

    // Prevent duplicate connections
    const existing = get().edges.find(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (existing) return;

    set({
      edges: addEdge(
        { ...connection, type: "animated", animated: true },
        get().edges
      ),
      isDirty: true,
    });
    debouncedSave(get);
  },

  addNode: (type, position) => {
    const dims = getDefaultDimensions(type);
    const newNode: Node<CanvasNodeData> = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { nodeType: type },
      style: { width: dims.width, height: dims.height },
    };
    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    });
    debouncedSave(get);
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      isDirty: true,
    });
    debouncedSave(get);
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    });
    debouncedSave(get);
  },

  saveCanvas: async () => {
    const { nodes, edges, isDirty, activeCanvasId } = get();
    if (!isDirty || !activeCanvasId) return;

    set({ isSaving: true });

    try {
      const payload = {
        canvas_id: activeCanvasId,
        nodes: nodes.map((n) => ({
          id: n.id,
          node_type: n.data.nodeType,
          position_x: n.position.x,
          position_y: n.position.y,
          width: (n.style?.width as number) ?? canvasConfig.defaultNodeWidth,
          height: (n.style?.height as number) ?? canvasConfig.defaultNodeHeight,
          data: Object.fromEntries(
            Object.entries(n.data).filter(([k]) => k !== "nodeType" && k !== "label")
          ),
          label: n.data.label ?? null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source_node_id: e.source,
          target_node_id: e.target,
          edge_type: (e.data as Record<string, unknown>)?.edgeType ?? "default",
          animated: e.animated ?? true,
        })),
      };

      await fetch("/api/canvas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      set({ isDirty: false });
    } catch (err) {
      console.error("Failed to save canvas:", err);
    } finally {
      set({ isSaving: false });
    }
  },

  loadCanvas: (dbNodes, dbEdges) => {
    set({
      nodes: dbNodes.map(dbNodeToFlowNode),
      edges: dbEdges.map(dbEdgeToFlowEdge),
      isDirty: false,
    });
  },
}));

function debouncedSave(get: () => CanvasState) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    get().saveCanvas();
  }, canvasConfig.autoSaveDelay);
}
