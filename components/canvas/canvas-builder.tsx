"use client";

import { useEffect, useCallback, useMemo } from "react";
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

import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";
import type { CanvasNode, CanvasEdge } from "@/types/database";
import { canvasConfig, colors } from "@/lib/design-tokens";

import { BackstoryNode } from "./nodes/backstory-node";
import { ContentFolderNode } from "./nodes/content-folder-node";
import { ProductNode } from "./nodes/product-node";
import { YoutubeNode } from "./nodes/youtube-node";
import { AiChatNode } from "./nodes/ai-chat-node";
import { AnimatedEdge } from "./edges/animated-edge";
import { CanvasContextMenu, useCanvasContextMenu } from "./canvas-context-menu";

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
}

export function CanvasBuilder({
  initialNodes,
  initialEdges,
  brandProfile,
  folders,
  products,
}: CanvasBuilderProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadCanvas,
    isSaving,
    addNode,
  } = useCanvasStore();

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

  // Load initial data and inject shared data into nodes
  useEffect(() => {
    // Inject brand profile data into backstory nodes
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Override addNode to inject available data into new nodes
  const handleAddNodeWithData = useCallback(
    (type: string, position: { x: number; y: number }) => {
      // We call addNode and then update data
      addNode(type as CanvasNode["node_type"], position);

      // After adding, update the last node with contextual data
      setTimeout(() => {
        const state = useCanvasStore.getState();
        const lastNode = state.nodes[state.nodes.length - 1];
        if (!lastNode) return;

        if (type === "backstory" && brandProfile) {
          state.updateNodeData(lastNode.id, {
            personal_bio: brandProfile.personal_bio,
            biggest_struggle: brandProfile.biggest_struggle,
            defining_moment: brandProfile.defining_moment,
            fun_facts: brandProfile.fun_facts,
            display_name: brandProfile.display_name,
            label: brandProfile.display_name || "Backstory",
          });
        } else if (type === "content_folder") {
          state.updateNodeData(lastNode.id, {
            availableFolders: folders,
            label: "Content Folder",
          });
        } else if (type === "product") {
          state.updateNodeData(lastNode.id, {
            availableProducts: products,
            label: "Product",
          });
        } else if (type === "youtube") {
          state.updateNodeData(lastNode.id, { label: "YouTube Video" });
        } else if (type === "ai_chat") {
          state.updateNodeData(lastNode.id, { label: "AI Chat Agent" });
        }
      }, 0);
    },
    [addNode, brandProfile, folders, products]
  );

  // Override the store's addNode with our enriched version
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

  return (
    <ReactFlowProvider>
    <div className="w-full h-full relative">
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
        <Controls
          showInteractive={false}
        />
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
      <CanvasContextMenu contextPosition={contextPosition} closeMenu={closeMenu} />
    </div>
    </ReactFlowProvider>
  );
}
