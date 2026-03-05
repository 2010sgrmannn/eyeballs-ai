"use client";

import { useState, useRef, useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { colors } from "@/lib/design-tokens";
import type { CanvasNodeData } from "@/lib/stores/canvas-store";

const AI_MODELS = [
  { id: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-opus-4", label: "Claude Opus 4", provider: "anthropic" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "o3", label: "OpenAI o3", provider: "openai" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google" },
] as const;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatNode({ id, data }: NodeProps<Node<CanvasNodeData>>) {
  const removeNode = useCanvasStore((s) => s.removeNode);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const { getEdges, getNodes } = useReactFlow();
  const [model, setModel] = useState((data.model as string) || "claude-sonnet-4");
  const [messages, setMessages] = useState<Message[]>((data.messages as Message[]) || []);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  function getConnectedContext(): Record<string, unknown> {
    const edges = getEdges();
    const allNodes = getNodes();
    const incomingEdges = edges.filter((e) => e.target === id);
    const connectedNodes = incomingEdges
      .map((e) => allNodes.find((n) => n.id === e.source))
      .filter(Boolean);

    const context: Record<string, unknown> = {};
    const backstories: unknown[] = [];
    const folders: unknown[] = [];
    const products: unknown[] = [];
    const youtubes: unknown[] = [];

    for (const node of connectedNodes) {
      if (!node) continue;
      const d = node.data as CanvasNodeData;
      switch (d.nodeType) {
        case "backstory":
          backstories.push({
            personal_bio: d.personal_bio,
            biggest_struggle: d.biggest_struggle,
            defining_moment: d.defining_moment,
            fun_facts: d.fun_facts,
          });
          break;
        case "content_folder":
          if (d.folder_id) folders.push({ folder_id: d.folder_id, folder_name: d.folder_name });
          break;
        case "product":
          if (d.product_id) products.push({ product_id: d.product_id, product_name: d.product_name });
          break;
        case "youtube":
          if (d.youtube_url) youtubes.push({ url: d.youtube_url, title: d.video_title });
          break;
      }
    }

    if (backstories.length) context.backstories = backstories;
    if (folders.length) context.folders = folders;
    if (products.length) context.products = products;
    if (youtubes.length) context.youtubes = youtubes;

    return context;
  }

  async function handleSend() {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const context = getConnectedContext();
      const res = await fetch("/api/canvas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          message: userMessage.content,
          context,
          messages: newMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: result.content,
      };
      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      updateNodeData(id, { messages: updated, model });
    } catch (err) {
      const errorMsg: Message = {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div
      className="glass-card group relative animate-node-appear flex flex-col"
      style={{
        borderColor: `${colors.nodeAiChat}33`,
        width: 420,
        height: 520,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md"
          style={{ background: `${colors.nodeAiChat}20`, color: colors.nodeAiChat }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10a10 10 0 0 1 0-20z" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </span>

        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            updateNodeData(id, { model: e.target.value });
          }}
          className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/[0.08] text-[#f0f2f5] focus:outline-none focus:border-[#ff3333] flex-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => removeNode(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20"
          style={{ color: "#ff3333" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: "#6B6B6B" }}>
            Connect blocks to provide context, then send a message to generate scripts.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed"
              style={{
                background:
                  msg.role === "user"
                    ? "rgba(255, 51, 51, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                color: "#f0f2f5",
                fontFamily: "var(--font-body)",
              }}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && (
                <button
                  onClick={() => navigator.clipboard.writeText(msg.content)}
                  className="mt-1 text-[10px] opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: "#A1A1A1" }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-lg"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3333] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3333] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3333] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="shrink-0 px-4 py-3 flex gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Describe the script you want..."
          className="flex-1 text-xs px-3 py-2 rounded-md bg-white/5 border border-white/[0.08] text-[#f0f2f5] placeholder-[#6B6B6B] focus:outline-none focus:border-[#ff3333]"
          style={{ fontFamily: "var(--font-body)" }}
          disabled={isGenerating}
        />
        <button
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
          className="px-3 py-2 rounded-md text-xs font-medium transition-all"
          style={{
            background: input.trim() ? "#ff3333" : "rgba(255, 51, 51, 0.2)",
            color: input.trim() ? "#FFFFFF" : "#6B6B6B",
            cursor: input.trim() && !isGenerating ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 12, height: 12 }}
      />
    </div>
  );
}
