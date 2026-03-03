"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { BrandProfile, Product, ProductType, CreatorStory, StoryEmotion, StoryCategory } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<ProductType, string> = {
  product: "#FF2D2D",
  course: "#7B2FBE",
  guide: "#00D4D4",
  freebie: "#22C55E",
  coaching: "#F59E0B",
  service: "#3B82F6",
  other: "#888888",
};

const TYPE_LABELS: Record<ProductType, string> = {
  product: "Product",
  course: "Course",
  guide: "Guide",
  freebie: "Freebie",
  coaching: "Coaching",
  service: "Service",
  other: "Other",
};

const ALL_PRODUCT_TYPES: ProductType[] = [
  "product", "guide", "freebie", "course", "coaching", "service", "other",
];

const CATEGORY_COLORS: Record<StoryCategory, string> = {
  struggle: "#FF2D2D",
  achievement: "#22C55E",
  childhood: "#F59E0B",
  relationship: "#EC4899",
  career: "#3B82F6",
  turning_point: "#7B2FBE",
  funny: "#00D4D4",
  lesson: "#F97316",
};

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  struggle: "Struggle",
  achievement: "Achievement",
  childhood: "Childhood",
  relationship: "Relationship",
  career: "Career",
  turning_point: "Turning Point",
  funny: "Funny",
  lesson: "Lesson",
};

const EMOTION_LABELS: Record<StoryEmotion, string> = {
  shame: "Shame",
  pride: "Pride",
  fear: "Fear",
  relief: "Relief",
  anger: "Anger",
  joy: "Joy",
  surprise: "Surprise",
  frustration: "Frustration",
};

const ALL_EMOTIONS: StoryEmotion[] = ["shame", "pride", "fear", "relief", "anger", "joy", "surprise", "frustration"];
const ALL_CATEGORIES: StoryCategory[] = ["struggle", "achievement", "childhood", "relationship", "career", "turning_point", "funny", "lesson"];

const FUN_FACT_SUGGESTIONS = [
  "Former athlete", "Self-taught", "Immigrant story", "College dropout",
  "Single parent", "Military veteran", "Career changer", "Multilingual",
  "Small town roots", "First generation",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContextViewProps {
  initialProfile: BrandProfile | null;
  initialStories: CreatorStory[];
  initialProducts: Product[];
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2
          className="text-lg font-semibold mb-0.5"
          style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}
        >
          {title}
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B6B6B" }}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Edit Field
// ---------------------------------------------------------------------------

function InlineField({
  label,
  value,
  onSave,
  type = "text",
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: "text" | "number";
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const committedRef = useRef(false);

  // Sync draft when parent value changes (e.g. after API save)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function commit() {
    if (committedRef.current) return; // prevent double-fire from Enter + blur
    committedRef.current = true;
    setEditing(false);
    if (draft !== value) onSave(draft);
    setTimeout(() => { committedRef.current = false; }, 0);
  }

  if (editing) {
    const inputStyle = {
      background: "var(--color-background)",
      border: "1px solid var(--color-border-default)",
      color: "#FAFAFA",
      fontFamily: "var(--font-body)",
      fontSize: "14px",
    };

    return (
      <div className="space-y-1">
        <label style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#6B6B6B", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
          {label}
        </label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
            rows={3}
            autoFocus
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={inputStyle}
          />
        ) : (
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            autoFocus
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer rounded-lg px-3 py-2 -mx-3 transition-all duration-200"
      onClick={() => { setDraft(value); setEditing(true); }}
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#6B6B6B", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
        {label}
      </span>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: value ? "#FAFAFA" : "#555", marginTop: "2px" }}>
        {value || placeholder || "Click to add..."}
      </p>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#555" }}>
        Click to edit
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag Editor (for fun_facts, languages)
// ---------------------------------------------------------------------------

function TagEditor({
  label,
  tags,
  onSave,
  suggestions = [],
  placeholder = "Add...",
}: {
  label: string;
  tags: string[];
  onSave: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onSave([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onSave(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <label style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#6B6B6B", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1"
            style={{ background: "rgba(0, 212, 212, 0.12)", border: "1px solid rgba(0, 212, 212, 0.3)", color: "#00D4D4", fontFamily: "var(--font-body)", fontSize: "13px" }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:opacity-70"
              style={{ background: "none", border: "none", color: "#00D4D4", cursor: "pointer", fontSize: "14px", lineHeight: 1 }}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !tags.includes(s)).slice(0, 6).map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="rounded-full px-2.5 py-0.5 text-xs transition-all duration-200"
              style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-default)", color: "#888888", fontFamily: "var(--font-body)", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00D4D4"; e.currentTarget.style.color = "#00D4D4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; e.currentTarget.style.color = "#888888"; }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ContextView({ initialProfile, initialStories, initialProducts }: ContextViewProps) {
  const [profile, setProfile] = useState<BrandProfile | null>(initialProfile);
  const [stories, setStories] = useState<CreatorStory[]>(initialStories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState<CreatorStory | null>(null);
  const [storyForm, setStoryForm] = useState({ title: "", content: "", emotion: "" as string, category: "" as string, time_period: "" });
  const [savingStory, setSavingStory] = useState(false);
  const [showStoryDeleteConfirm, setShowStoryDeleteConfirm] = useState<string | null>(null);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", type: "product" as ProductType, description: "", price: "", url: "" });
  const [savingProduct, setSavingProduct] = useState(false);
  const [showProductDeleteConfirm, setShowProductDeleteConfirm] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Profile update helper
  // ---------------------------------------------------------------------------

  const updateProfile = useCallback(async (fields: Record<string, unknown>) => {
    // Optimistic update — apply immediately so the UI doesn't flash back
    setProfile((prev) => prev ? { ...prev, ...fields } as BrandProfile : { user_id: "", id: "", created_at: "", updated_at: "", ...fields } as unknown as BrandProfile);

    try {
      const res = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      } else {
        // Revert on failure
        const errBody = await res.json().catch(() => ({}));
        console.error("Profile save failed:", res.status, errBody);
        setProfile(initialProfile);
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  // ---------------------------------------------------------------------------
  // Story CRUD
  // ---------------------------------------------------------------------------

  function openCreateStory() {
    setEditingStory(null);
    setStoryForm({ title: "", content: "", emotion: "", category: "", time_period: "" });
    setShowStoryModal(true);
  }

  function openEditStory(story: CreatorStory) {
    setEditingStory(story);
    setStoryForm({
      title: story.title,
      content: story.content,
      emotion: story.emotion ?? "",
      category: story.category ?? "",
      time_period: story.time_period ?? "",
    });
    setShowStoryModal(true);
  }

  async function handleSaveStory() {
    if (!storyForm.title.trim() || !storyForm.content.trim()) return;
    setSavingStory(true);

    try {
      const payload = {
        ...(editingStory ? { id: editingStory.id } : {}),
        title: storyForm.title.trim(),
        content: storyForm.content.trim(),
        emotion: storyForm.emotion || null,
        category: storyForm.category || null,
        time_period: storyForm.time_period.trim() || null,
      };

      const res = await fetch("/api/creator-stories", {
        method: editingStory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingStory) {
          setStories((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        } else {
          setStories((prev) => [...prev, saved]);
        }
        setShowStoryModal(false);
      }
    } finally {
      setSavingStory(false);
    }
  }

  async function handleDeleteStory(id: string) {
    const toDelete = stories.find((s) => s.id === id);
    if (!toDelete) return;
    setStories((prev) => prev.filter((s) => s.id !== id));
    setShowStoryDeleteConfirm(null);

    const res = await fetch(`/api/creator-stories?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setStories((prev) => [...prev, toDelete].sort((a, b) => a.sort_order - b.sort_order));
    }
  }

  // ---------------------------------------------------------------------------
  // Product CRUD
  // ---------------------------------------------------------------------------

  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm({ name: "", type: "product", description: "", price: "", url: "" });
    setShowProductModal(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      type: product.type,
      description: product.description ?? "",
      price: product.price ?? "",
      url: product.url ?? "",
    });
    setShowProductModal(true);
  }

  async function handleSaveProduct() {
    if (!productForm.name.trim()) return;
    setSavingProduct(true);

    try {
      const payload = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name: productForm.name.trim(),
        type: productForm.type,
        description: productForm.description.trim() || null,
        price: productForm.price.trim() || null,
        url: productForm.url.trim() || null,
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingProduct) {
          setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          setProducts((prev) => [saved, ...prev]);
        }
        setShowProductModal(false);
      }
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    const toDelete = products.find((p) => p.id === id);
    if (!toDelete) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setShowProductDeleteConfirm(null);

    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setProducts((prev) => {
        const restored = [...prev, toDelete];
        restored.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return restored;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
      {/* Page header */}
      <div className="mb-10">
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}
        >
          Creator Profile
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1", maxWidth: "520px" }}>
          Your personal identity, stories, and offerings. This powers the emotional specificity in your scripts.
        </p>
      </div>

      <div className="space-y-10">
        {/* ----------------------------------------------------------------- */}
        {/* Section 1: Personal Info */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="rounded-xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-default)" }}
        >
          <SectionHeader title="Personal Info" subtitle="Quick facts about you" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <InlineField
              label="Birth Year"
              value={profile?.birth_year?.toString() ?? ""}
              onSave={(v) => updateProfile({ birth_year: v ? parseInt(v) : null })}
              type="number"
              placeholder="e.g. 1995"
            />
            <InlineField
              label="Location"
              value={profile?.location ?? ""}
              onSave={(v) => updateProfile({ location: v || null })}
              placeholder="e.g. Austin, TX"
            />
          </div>
          <div className="mt-3">
            <TagEditor
              label="Languages"
              tags={profile?.languages ?? []}
              onSave={(tags) => updateProfile({ languages: tags })}
              suggestions={["English", "Spanish", "Portuguese", "French", "German", "Arabic", "Hindi", "Mandarin"]}
              placeholder="Add a language..."
            />
          </div>
          <div className="mt-3">
            <TagEditor
              label="Fun Facts"
              tags={profile?.fun_facts ?? []}
              onSave={(tags) => updateProfile({ fun_facts: tags })}
              suggestions={FUN_FACT_SUGGESTIONS}
              placeholder="Add a fun fact..."
            />
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Section 2: My Story */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="rounded-xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-default)" }}
        >
          <SectionHeader title="My Story" subtitle="Your backstory, struggles, and defining moments" />
          <div className="space-y-1">
            <InlineField
              label="Your Backstory"
              value={profile?.personal_bio ?? ""}
              onSave={(v) => updateProfile({ personal_bio: v || null })}
              multiline
              placeholder="In 2-4 sentences, who are you really?"
            />
            <InlineField
              label="Early Life"
              value={profile?.early_life ?? ""}
              onSave={(v) => updateProfile({ early_life: v || null })}
              multiline
              placeholder="Where did you grow up? What was your family like?"
            />
            <InlineField
              label="Biggest Struggle"
              value={profile?.biggest_struggle ?? ""}
              onSave={(v) => updateProfile({ biggest_struggle: v || null })}
              multiline
              placeholder="The hard thing you overcame..."
            />
            <InlineField
              label="Defining Moment"
              value={profile?.defining_moment ?? ""}
              onSave={(v) => updateProfile({ defining_moment: v || null })}
              multiline
              placeholder="The pivot that changed everything..."
            />
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Section 3: Key Moments & Anecdotes */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="rounded-xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-default)" }}
        >
          <SectionHeader
            title="Key Moments & Anecdotes"
            subtitle="Individual stories for emotionally specific scripts"
            action={
              <button
                onClick={openCreateStory}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: "#FF2D2D", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E02626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FF2D2D"; }}
              >
                + Add story
              </button>
            }
          />

          {stories.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-lg"
              style={{ border: "1px dashed var(--color-border-default)" }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888888", marginBottom: "12px" }}>
                No stories yet
              </p>
              <button
                onClick={openCreateStory}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: "#FF2D2D", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
              >
                + Add your first story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="group relative rounded-lg p-4 transition-all duration-200"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
                >
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {story.category && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: `${CATEGORY_COLORS[story.category as StoryCategory]}18`,
                          color: CATEGORY_COLORS[story.category as StoryCategory],
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                        }}
                      >
                        {CATEGORY_LABELS[story.category as StoryCategory]}
                      </span>
                    )}
                    {story.emotion && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#A1A1A1", fontFamily: "var(--font-body)", fontSize: "11px" }}
                      >
                        {EMOTION_LABELS[story.emotion as StoryEmotion]}
                      </span>
                    )}
                    {story.time_period && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#555" }}>
                        {story.time_period}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4
                    className="font-medium mb-1"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "#FAFAFA" }}
                  >
                    {story.title}
                  </h4>

                  {/* Content (2-line clamp) */}
                  <p
                    className="line-clamp-2"
                    style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1", lineHeight: "1.5" }}
                  >
                    {story.content}
                  </p>

                  {/* Hover actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEditStory(story)}
                      className="p-1.5 rounded-md"
                      style={{ color: "#888888", background: "transparent", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowStoryDeleteConfirm(story.id)}
                      className="p-1.5 rounded-md"
                      style={{ color: "#888888", background: "transparent", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#FF2D2D"; e.currentTarget.style.background = "rgba(255,45,45,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Section 4: Products & Offerings */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="rounded-xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-default)" }}
        >
          <SectionHeader
            title="Products & Offerings"
            subtitle="Your products, courses, and services for script promotions"
            action={
              <button
                onClick={openCreateProduct}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: "#FF2D2D", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E02626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FF2D2D"; }}
              >
                + Add offering
              </button>
            }
          />

          {products.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-lg"
              style={{ border: "1px dashed var(--color-border-default)" }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888888", marginBottom: "12px" }}>
                No offerings yet
              </p>
              <button
                onClick={openCreateProduct}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: "#FF2D2D", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
              >
                + Add your first offering
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative rounded-lg p-5 transition-all duration-200"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: `${TYPE_COLORS[product.type]}18`,
                        color: TYPE_COLORS[product.type],
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {TYPE_LABELS[product.type]}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="p-1.5 rounded-md"
                        style={{ color: "#888888", background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowProductDeleteConfirm(product.id)}
                        className="p-1.5 rounded-md"
                        style={{ color: "#888888", background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#FF2D2D"; e.currentTarget.style.background = "rgba(255,45,45,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3
                    className="font-medium mb-1"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "15px", color: "#FAFAFA" }}
                  >
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="line-clamp-3 mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1", lineHeight: "1.5" }}>
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-auto">
                    {product.price && (
                      <span className="inline-block px-2 py-0.5 rounded" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#FAFAFA", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-default)" }}>
                        {product.price}
                      </span>
                    )}
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate"
                        style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#00D4D4", maxWidth: "200px", display: "inline-block", textDecoration: "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                      >
                        {product.url.replace(/^https?:\/\//, "").slice(0, 40)}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Story Modal */}
      {/* ----------------------------------------------------------------- */}
      {showStoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowStoryModal(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}
            >
              {editingStory ? "Edit story" : "Add story"}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Title <span style={{ color: "#FF2D2D" }}>*</span>
              </label>
              <input
                type="text"
                value={storyForm.title}
                onChange={(e) => setStoryForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. When I failed publicly"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Story <span style={{ color: "#FF2D2D" }}>*</span>
              </label>
              <textarea
                value={storyForm.content}
                onChange={(e) => setStoryForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Tell the story in your own words..."
                rows={4}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
              />
            </div>

            {/* Category chips */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((c) => {
                  const selected = storyForm.category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStoryForm((f) => ({ ...f, category: f.category === c ? "" : c }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: selected ? `${CATEGORY_COLORS[c]}18` : "#161616",
                        border: selected ? `1px solid ${CATEGORY_COLORS[c]}50` : "1px solid var(--color-border-default)",
                        color: selected ? CATEGORY_COLORS[c] : "#888888",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                      }}
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emotion chips */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Core Emotion
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_EMOTIONS.map((em) => {
                  const selected = storyForm.emotion === em;
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setStoryForm((f) => ({ ...f, emotion: f.emotion === em ? "" : em }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: selected ? "rgba(0, 212, 212, 0.15)" : "#161616",
                        border: selected ? "1px solid rgba(0, 212, 212, 0.5)" : "1px solid var(--color-border-default)",
                        color: selected ? "#00D4D4" : "#888888",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                      }}
                    >
                      {EMOTION_LABELS[em]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time period */}
            <div className="mb-6">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Time Period
              </label>
              <input
                type="text"
                value={storyForm.time_period}
                onChange={(e) => setStoryForm((f) => ({ ...f, time_period: e.target.value }))}
                placeholder='e.g. "age 23", "2019", "college"'
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStoryModal(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ fontFamily: "var(--font-body)", color: "#888888", background: "transparent", border: "1px solid var(--color-border-default)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStory}
                disabled={!storyForm.title.trim() || !storyForm.content.trim() || savingStory}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  fontFamily: "var(--font-body)",
                  background: (!storyForm.title.trim() || !storyForm.content.trim() || savingStory) ? "#661212" : "#FF2D2D",
                  color: "#fff",
                  border: "none",
                  cursor: (!storyForm.title.trim() || !storyForm.content.trim() || savingStory) ? "not-allowed" : "pointer",
                  opacity: (!storyForm.title.trim() || !storyForm.content.trim() || savingStory) ? 0.5 : 1,
                }}
              >
                {savingStory ? "Saving..." : editingStory ? "Save changes" : "Add story"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story delete confirmation */}
      {showStoryDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowStoryDeleteConfirm(null)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-sm"
            style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-medium mb-2" style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}>
              Delete story?
            </h3>
            <p className="mb-5" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1" }}>
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStoryDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ fontFamily: "var(--font-body)", color: "#888888", background: "transparent", border: "1px solid var(--color-border-default)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStory(showStoryDeleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ fontFamily: "var(--font-body)", background: "#FF2D2D", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Product Modal */}
      {/* ----------------------------------------------------------------- */}
      {showProductModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-lg"
            style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}
            >
              {editingProduct ? "Edit offering" : "Add offering"}
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Name <span style={{ color: "#FF2D2D" }}>*</span>
              </label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Instagram Growth Guide"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
              />
            </div>

            {/* Type chips */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_PRODUCT_TYPES.map((t) => {
                  const selected = productForm.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setProductForm((f) => ({ ...f, type: t }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: selected ? `${TYPE_COLORS[t]}18` : "#161616",
                        border: selected ? `1px solid ${TYPE_COLORS[t]}50` : "1px solid var(--color-border-default)",
                        color: selected ? TYPE_COLORS[t] : "#888888",
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                      }}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                Description
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                rows={3}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
              />
            </div>

            {/* Price + URL */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                  Price
                </label>
                <input
                  type="text"
                  value={productForm.price}
                  onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. $49"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-mono)" }}
                />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                  URL
                </label>
                <input
                  type="text"
                  value={productForm.url}
                  onChange={(e) => setProductForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)", color: "#FAFAFA", fontFamily: "var(--font-body)" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ fontFamily: "var(--font-body)", color: "#888888", background: "transparent", border: "1px solid var(--color-border-default)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={!productForm.name.trim() || savingProduct}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  fontFamily: "var(--font-body)",
                  background: (!productForm.name.trim() || savingProduct) ? "#661212" : "#FF2D2D",
                  color: "#fff",
                  border: "none",
                  cursor: (!productForm.name.trim() || savingProduct) ? "not-allowed" : "pointer",
                  opacity: (!productForm.name.trim() || savingProduct) ? 0.5 : 1,
                }}
              >
                {savingProduct ? "Saving..." : editingProduct ? "Save changes" : "Add offering"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product delete confirmation */}
      {showProductDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowProductDeleteConfirm(null)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-sm"
            style={{ background: "var(--color-background)", border: "1px solid var(--color-border-default)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-medium mb-2" style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}>
              Delete offering?
            </h3>
            <p className="mb-5" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1" }}>
              This action cannot be undone. The offering will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowProductDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ fontFamily: "var(--font-body)", color: "#888888", background: "transparent", border: "1px solid var(--color-border-default)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showProductDeleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ fontFamily: "var(--font-body)", background: "#FF2D2D", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
