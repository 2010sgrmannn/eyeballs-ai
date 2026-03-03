"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CanvasBrief } from "@/types/database";

interface WizardMessage {
  role: "user" | "assistant";
  content: string;
}

interface WizardProps {
  displayName: string;
  folders: { id: string; name: string }[];
  products: { id: string; name: string; type: string; description: string | null; price: string | null; url: string | null }[];
  stories: { id: string; title: string; emotion: string | null; category: string | null }[];
  onComplete: (brief: CanvasBrief) => void;
  onClose: () => void;
}

const EMOTION_CHIPS = ["guilt", "pride", "fear", "anger", "relief", "shame"];

// Inline SVG icons
function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CanvasWizard({
  displayName,
  folders,
  products,
  stories,
  onComplete,
  onClose,
}: WizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [brief, setBrief] = useState<Partial<CanvasBrief> | null>(null);

  // Context selection state
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (step === 2) inputRef.current?.focus();
  }, [step]);

  const handleStep1Submit = async () => {
    if (!topic.trim()) return;
    setStep(2);
    setIsLoading(true);

    const userMsg: WizardMessage = { role: "user", content: topic.trim() };
    setMessages([userMsg]);

    try {
      const res = await fetch("/api/canvas/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg], displayName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.ready && data.brief) {
        setBrief(data.brief);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isLoading) return;

    const userMsg: WizardMessage = { role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/canvas/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, displayName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.ready && data.brief) {
        setBrief(data.brief);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCanvas = (
    folderIds: string[] = [],
    productIds: string[] = [],
    storyIds: string[] = [],
  ) => {
    if (!brief) return;
    setIsBuilding(true);
    const finalBrief: CanvasBrief = {
      topic: brief.topic || topic,
      emotion: brief.emotion || "",
      angle: brief.angle || "",
      targetAudience: brief.targetAudience || "",
      selectedFolderIds: folderIds,
      selectedProductIds: productIds,
      selectedStoryIds: storyIds,
      conversationHistory: messages,
    };
    onComplete(finalBrief);
  };

  const handleBuildClick = () => {
    if (!brief) return;
    // Skip context selection if there's nothing to select
    const hasContext = folders.length > 0 || products.length > 0 || stories.length > 0;
    if (hasContext) {
      setStep(3);
    } else {
      buildCanvas();
    }
  };

  const handleFinalBuild = () => {
    buildCanvas(selectedFolderIds, selectedProductIds, selectedStoryIds);
  };

  const toggleSelection = (id: string, list: string[], setter: (ids: string[]) => void) => {
    setter(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <AnimatePresence mode="wait">
        {/* Step 1 — Welcome */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-lg rounded-2xl p-8"
            style={{
              background: "rgba(15, 25, 35, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            >
              <span className="text-[#6B6B6B]"><IconX /></span>
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366F1]/10">
                <span className="text-[#6366F1]"><IconSparkles /></span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#FAFAFA]">
                  Hey {displayName || "there"}, what are we working on today?
                </h2>
                <p className="text-sm text-[#6B6B6B]">Describe your content idea</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                autoFocus
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep1Submit()}
                placeholder="e.g. Why hustle culture is making you broke..."
                className="flex-1 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#6B6B6B] outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              />
              <button
                onClick={handleStep1Submit}
                disabled={!topic.trim()}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-[#6366F1] text-white transition-opacity disabled:opacity-40"
              >
                <IconSend />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Guided Chat */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl"
            style={{
              background: "rgba(15, 25, 35, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              maxHeight: "70vh",
            }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-[#6366F1]"><IconSparkles /></span>
                <span className="text-sm font-medium text-[#FAFAFA]">Sharpening your idea</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              >
                <span className="text-[#6B6B6B]"><IconX /></span>
              </button>
            </div>

            <div className="mx-4 h-px bg-white/[0.06]" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm"
                    style={{
                      background:
                        msg.role === "user"
                          ? "rgba(99, 102, 241, 0.15)"
                          : "rgba(255, 255, 255, 0.04)",
                      color: msg.role === "user" ? "#C7D2FE" : "#FAFAFA",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="flex gap-1 rounded-xl px-4 py-3"
                    style={{ background: "rgba(255, 255, 255, 0.04)" }}
                  >
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6B6B6B]" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6B6B6B]" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#6B6B6B]" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Brief ready action */}
            {brief && (
              <div className="mx-4 mb-2">
                <button
                  onClick={handleBuildClick}
                  disabled={isBuilding}
                  className="w-full rounded-xl bg-[#6366F1] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isBuilding ? "Building..." : "Looks good, let\u2019s build \u2192"}
                </button>
              </div>
            )}

            {/* Emotion chips */}
            {!brief && messages.length > 0 && messages.length < 4 && (
              <div className="flex flex-wrap gap-1.5 px-6 pb-2">
                {EMOTION_CHIPS.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => sendMessage(emotion)}
                    className="rounded-full px-3 py-1 text-xs capitalize transition-colors hover:bg-white/10"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#A1A1A1",
                    }}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            {!brief && (
              <div className="px-4 pb-4 pt-2">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response..."
                    disabled={isLoading}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#6B6B6B] outline-none disabled:opacity-50"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#6366F1] text-white transition-opacity disabled:opacity-40"
                  >
                    <IconSend />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3 — Context Selection */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-lg rounded-2xl"
            style={{
              background: "rgba(15, 25, 35, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              maxHeight: "70vh",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h3 className="text-sm font-medium text-[#FAFAFA]">Select context</h3>
                <p className="text-xs text-[#6B6B6B]">Choose what to connect to your canvas</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              >
                <span className="text-[#6B6B6B]"><IconX /></span>
              </button>
            </div>

            <div className="mx-4 h-px bg-white/[0.06]" />

            <div className="max-h-[45vh] overflow-y-auto px-6 py-4 space-y-5">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Folders
                  </h4>
                  <div className="space-y-1">
                    {folders.map((f) => (
                      <CheckboxItem
                        key={f.id}
                        label={f.name}
                        checked={selectedFolderIds.includes(f.id)}
                        onChange={() =>
                          toggleSelection(f.id, selectedFolderIds, setSelectedFolderIds)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {products.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Products
                  </h4>
                  <div className="space-y-1">
                    {products.map((p) => (
                      <CheckboxItem
                        key={p.id}
                        label={`${p.name} (${p.type})`}
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() =>
                          toggleSelection(p.id, selectedProductIds, setSelectedProductIds)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stories */}
              {stories.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Creator Stories
                  </h4>
                  <div className="space-y-1">
                    {stories.map((s) => (
                      <CheckboxItem
                        key={s.id}
                        label={s.title}
                        subtitle={[s.emotion, s.category].filter(Boolean).join(" / ")}
                        checked={selectedStoryIds.includes(s.id)}
                        onChange={() =>
                          toggleSelection(s.id, selectedStoryIds, setSelectedStoryIds)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {folders.length === 0 && products.length === 0 && stories.length === 0 && (
                <p className="text-center text-sm text-[#6B6B6B] py-4">
                  No context available yet. You can add folders, products, and stories later.
                </p>
              )}
            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                onClick={handleFinalBuild}
                disabled={isBuilding}
                className="w-full rounded-xl bg-[#6366F1] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isBuilding ? "Building..." : "Build Canvas"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckboxItem({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
    >
      <div
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
        style={{
          background: checked ? "#6366F1" : "transparent",
          borderColor: checked ? "#6366F1" : "rgba(255, 255, 255, 0.15)",
        }}
      >
        {checked && <span className="text-white"><IconCheck /></span>}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[#FAFAFA]">{label}</span>
        {subtitle && (
          <span className="block truncate text-xs text-[#6B6B6B]">{subtitle}</span>
        )}
      </div>
    </button>
  );
}
