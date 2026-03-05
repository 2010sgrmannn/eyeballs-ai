import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";

interface ContextBlock {
  backstories?: { personal_bio?: string; biggest_struggle?: string; defining_moment?: string; fun_facts?: string[] }[];
  folders?: { folder_id: string; folder_name?: string }[];
  products?: { product_id: string; product_name?: string }[];
  youtubes?: { url: string; title?: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    model?: string;
    message?: string;
    context?: ContextBlock;
    messages?: ChatMessage[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { model = "claude-sonnet-4", message, context = {}, messages = [] } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Build context section from connected blocks
  const contextParts: string[] = [];

  if (context.backstories?.length) {
    contextParts.push("## Creator Background");
    for (const b of context.backstories) {
      if (b.personal_bio) contextParts.push(`Bio: ${b.personal_bio}`);
      if (b.biggest_struggle) contextParts.push(`Core Struggle: ${b.biggest_struggle}`);
      if (b.defining_moment) contextParts.push(`Defining Moment: ${b.defining_moment}`);
      if (b.fun_facts?.length) contextParts.push(`Fun Facts: ${b.fun_facts.join(", ")}`);
    }
  }

  if (context.folders?.length) {
    // Fetch actual content from folders
    for (const f of context.folders) {
      const { data: folderItems } = await supabase
        .from("folder_items")
        .select("content_id")
        .eq("folder_id", f.folder_id);

      if (folderItems?.length) {
        const { data: content } = await supabase
          .from("content")
          .select("hook_text, cta_text, caption, virality_score")
          .in("id", folderItems.map((fi) => fi.content_id))
          .eq("user_id", user.id)
          .order("virality_score", { ascending: false, nullsFirst: false })
          .limit(5);

        if (content?.length) {
          contextParts.push(`\n## Content Reference: ${f.folder_name || "Folder"}`);
          for (const c of content) {
            const parts = [];
            if (c.hook_text) parts.push(`Hook: "${c.hook_text}"`);
            if (c.cta_text) parts.push(`CTA: "${c.cta_text}"`);
            if (c.caption) parts.push(`Caption: "${c.caption.slice(0, 150)}"`);
            parts.push(`Virality: ${c.virality_score ?? "N/A"}`);
            contextParts.push(`- ${parts.join(" | ")}`);
          }
        }
      }
    }
  }

  if (context.products?.length) {
    const productIds = context.products.map((p) => p.product_id);
    const { data: productData } = await supabase
      .from("products")
      .select("name, type, description, price, url")
      .in("id", productIds)
      .eq("user_id", user.id);

    if (productData?.length) {
      contextParts.push("\n## Products");
      for (const p of productData) {
        contextParts.push(
          `- ${p.name} (${p.type}): ${p.description || "No description"} | Price: ${p.price || "N/A"} | URL: ${p.url || "N/A"}`
        );
      }
    }
  }

  if (context.youtubes?.length) {
    contextParts.push("\n## YouTube References");
    for (const y of context.youtubes) {
      contextParts.push(`- ${y.title || "Video"}: ${y.url}`);
    }
  }

  const contextSection = contextParts.length
    ? `\n\nHere is the context from the creator's connected blocks:\n\n${contextParts.join("\n")}\n\nUse this context to create more specific, personal, and emotionally resonant content.`
    : "";

  const systemPrompt = `You are an elite viral content scriptwriter. You use the "Piercing the Cloth" framework to create content that triggers real emotional responses.

The rule: The more specific and emotionally charged the topic, the more it pierces — and the more viral it goes.

When writing scripts, always:
1. Sharpen the topic to maximum specificity
2. Hit a single emotional nerve (guilt, pride, fear, anger, relief, shame, defiance)
3. Use dead simple language
4. Include personal insight, not generic advice
5. Make it compelling enough that people feel forced to comment, save, or share${contextSection}`;

  // Build conversation messages
  const chatMessages = messages
    .filter((m) => m.role && m.content)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // For now, only support Claude models (others can be added later)
  if (model.startsWith("claude")) {
    try {
      const anthropic = getAnthropicClient();
      const modelId = model === "claude-opus-4" ? "claude-opus-4-20250514" : "claude-sonnet-4-20250514";

      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: 4096,
        temperature: 1.0,
        system: systemPrompt,
        messages: chatMessages.length > 0
          ? chatMessages
          : [{ role: "user", content: message }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response");
      }

      return NextResponse.json({ content: textBlock.text });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Generation failed";
      return NextResponse.json(
        { error: `Failed to generate: ${errMsg}` },
        { status: 502 }
      );
    }
  }

  // Stub response for non-Claude models
  return NextResponse.json({
    content: `[${model}] Support for this model is coming soon. For now, please use Claude Sonnet 4 or Claude Opus 4.`,
  });
}
