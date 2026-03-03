"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";

import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";
import type { Canvas, CanvasNode, CanvasEdge, CanvasBrief } from "@/types/database";
import { canvasConfig, colors } from "@/lib/design-tokens";

import { BackstoryNode } from "./nodes/backstory-node";
import { ContentFolderNode } from "./nodes/content-folder-node";
import { ProductNode } from "./nodes/product-node";
import { YoutubeNode } from "./nodes/youtube-node";
import { AiChatNode } from "./nodes/ai-chat-node";
import { AnimatedEdge } from "./edges/animated-edge";
import { CanvasContextMenu, useCanvasContextMenu } from "./canvas-context-menu";
import { CanvasSidebar } from "./canvas-sidebar";
import { CanvasWizard } from "./canvas-wizard";

interface CanvasBuilderProps {
  initialNodes: CanvasNode[];
  initialEdges: CanvasEdge[];
  brandProfile: {
    personal_bio: string | null;
    biggest_struggle: string | null;
    defining_moment: string | null;
    fun_facts: string[] | null;
    display_name: string | null;
    birth_year: number | null;
    location: string | null;
  } | null;
  folders: { id: string; name: string }[];
  products: { id: string; name: string; type: string; description: string | null; price: string | null; url: string | null }[];
  canvases: Canvas[];
  activeCanvasId: string | null;
  stories: { id: string; title: string; emotion: string | null; category: string | null }[];
}

export function CanvasBuilder({
  initialNodes,
  initialEdges,
  brandProfile,
  folders,
  products,
  canvases: initialCanvases,
  activeCanvasId: initialActiveCanvasId,
  stories,
}: CanvasBuilderProps) {
  const router = useRouter();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadCanvas,
    isSaving,
    addNode,
    setActiveCanvas,
    activeCanvasId,
    canvases,
  } = useCanvasStore();

  const [showWizard, setShowWizard] = useState(false);

  // Initialize store with server data
  useEffect(() => {
    useCanvasStore.setState({
      canvases: initialCanvases,
      activeCanvasId: initialActiveCanvasId,
    });

    if (initialActiveCanvasId) {
      const enrichedNodes = initialNodes.map((n) => {
        if (n.node_type === "backstory" && brandProfile) {
          return {
            ...n,
            data: {
              ...n.data,
              personal_bio: brandProfile.personal_bio,
              biggest_struggle: brandProfile.biggest_struggle,
              defining_moment: brandProfile.defining_moment,
              fun_facts: brandProfile.fun_facts,
              display_name: brandProfile.display_name,
            },
          };
        }
        if (n.node_type === "content_folder") {
          return { ...n, data: { ...n.data, availableFolders: folders } };
        }
        if (n.node_type === "product") {
          return { ...n, data: { ...n.data, availableProducts: products } };
        }
        return n;
      });
      loadCanvas(enrichedNodes, initialEdges);
    }

    // Auto-open wizard if no canvases exist
    if (initialCanvases.length === 0) {
      setShowWizard(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      backstory: BackstoryNode,
      content_folder: ContentFolderNode,
      product: ProductNode,
      youtube: YoutubeNode,
      ai_chat: AiChatNode,
    }),
    []
  );

  const { contextPosition, onPaneContextMenu, closeMenu } = useCanvasContextMenu();

  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      animated: AnimatedEdge,
    }),
    []
  );

  // Override addNode to inject available data into new nodes
  useEffect(() => {
    const store = useCanvasStore.getState();
    const originalAddNode = store.addNode;
    useCanvasStore.setState({
      addNode: (type, position) => {
        originalAddNode(type, position);
        setTimeout(() => {
          const state = useCanvasStore.getState();
          const lastNode = state.nodes[state.nodes.length - 1];
          if (!lastNode) return;

          const enrichments: Record<string, unknown> = {};
          if (type === "backstory" && brandProfile) {
            Object.assign(enrichments, {
              personal_bio: brandProfile.personal_bio,
              biggest_struggle: brandProfile.biggest_struggle,
              defining_moment: brandProfile.defining_moment,
              fun_facts: brandProfile.fun_facts,
              display_name: brandProfile.display_name,
              label: brandProfile.display_name || "Backstory",
            });
          } else if (type === "content_folder") {
            Object.assign(enrichments, { availableFolders: folders, label: "Content Folder" });
          } else if (type === "product") {
            Object.assign(enrichments, { availableProducts: products, label: "Product" });
          } else if (type === "youtube") {
            enrichments.label = "YouTube Video";
          } else if (type === "ai_chat") {
            enrichments.label = "AI Chat Agent";
          }

          if (Object.keys(enrichments).length > 0) {
            state.updateNodeData(lastNode.id, enrichments);
          }
        }, 0);
      },
    });

    return () => {
      useCanvasStore.setState({ addNode: originalAddNode });
    };
  }, [brandProfile, folders, products]);

  const handleSwitchCanvas = useCallback(
    (id: string) => {
      if (id === activeCanvasId) return;
      router.push(`/dashboard/canvas?canvas=${id}`);
    },
    [activeCanvasId, router]
  );

  const handleNewCanvas = useCallback(() => {
    setShowWizard(true);
  }, []);

  const handleWizardComplete = useCallback(
    async (brief: CanvasBrief) => {
      setShowWizard(false);

      // Create canvas
      const store = useCanvasStore.getState();
      const canvas = await store.createCanvas(brief.topic || "New Canvas", brief as unknown as Record<string, unknown>);
      if (!canvas) return;

      // Set as active immediately so the ReactFlow viewport renders
      store.setActiveCanvas(canvas.id);
      useCanvasStore.setState({ activeCanvasId: canvas.id });

      // Auto-build and load result directly into the store
      try {
        const res = await fetch("/api/canvas/auto-build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canvasId: canvas.id, brief }),
        });

        if (res.ok) {
          const { nodes: dbNodes, edges: dbEdges } = await res.json();

          // Enrich nodes with brand/folder/product data before loading
          const enrichedNodes = (dbNodes ?? []).map((n: CanvasNode) => {
            if (n.node_type === "backstory" && brandProfile) {
              return {
                ...n,
                data: {
                  ...n.data,
                  personal_bio: brandProfile.personal_bio,
                  biggest_struggle: brandProfile.biggest_struggle,
                  defining_moment: brandProfile.defining_moment,
                  fun_facts: brandProfile.fun_facts,
                  display_name: brandProfile.display_name,
                },
              };
            }
            if (n.node_type === "content_folder") {
              return { ...n, data: { ...n.data, availableFolders: folders } };
            }
            if (n.node_type === "product") {
              return { ...n, data: { ...n.data, availableProducts: products } };
            }
            return n;
          });

          store.loadCanvas(enrichedNodes, dbEdges ?? []);

          // Update URL without full page reload
          window.history.replaceState(null, "", `/dashboard/canvas?canvas=${canvas.id}`);
        }
      } catch (err) {
        console.error("Auto-build failed:", err);
        // Canvas was created but empty — update URL so refresh loads it
        window.history.replaceState(null, "", `/dashboard/canvas?canvas=${canvas.id}`);
      }
    },
    [brandProfile, folders, products]
  );

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative">
        {/* Canvas Sidebar */}
        <CanvasSidebar
          onNewCanvas={handleNewCanvas}
          onSwitchCanvas={handleSwitchCanvas}
        />

        {/* Wizard */}
        {showWizard && (
          <CanvasWizard
            displayName={brandProfile?.display_name || ""}
            folders={folders}
            products={products}
            stories={stories}
            onComplete={handleWizardComplete}
            onClose={() => setShowWizard(false)}
          />
        )}

        {/* Save indicator */}
        {isSaving && (
          <div
            className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: "rgba(15, 25, 35, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#A1A1A1",
              fontFamily: "var(--font-body)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse" />
            Saving...
          </div>
        )}

        {/* Empty state when no active canvas */}
        {!activeCanvasId && canvases.length === 0 && !showWizard && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-sm text-[#6B6B6B]">No canvases yet</p>
              <button
                onClick={handleNewCanvas}
                className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Create your first canvas
              </button>
            </div>
          </div>
        )}

        {activeCanvasId && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: "animated",
              animated: true,
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={canvasConfig.minZoom}
            maxZoom={canvasConfig.maxZoom}
            connectionRadius={30}
            snapToGrid
            snapGrid={[15, 15]}
            proOptions={{ hideAttribution: true }}
            className="canvas-background"
            onPaneContextMenu={onPaneContextMenu}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={canvasConfig.gridSize}
              size={1}
              color="rgba(255, 255, 255, 0.04)"
            />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                const type = (node.data as CanvasNodeData)?.nodeType;
                switch (type) {
                  case "backstory": return colors.nodeBackstory;
                  case "content_folder": return colors.nodeContent;
                  case "product": return colors.nodeProduct;
                  case "youtube": return colors.nodeYoutube;
                  case "ai_chat": return colors.nodeAiChat;
                  default: return colors.accent;
                }
              }}
              style={{
                backgroundColor: colors.surface,
              }}
              maskColor="rgba(9, 17, 26, 0.7)"
            />
          </ReactFlow>
        )}

        <CanvasContextMenu contextPosition={contextPosition} closeMenu={closeMenu} />
      </div>
    </ReactFlowProvider>
  );
}
