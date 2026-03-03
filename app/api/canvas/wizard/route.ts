import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";

interface WizardMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserContext {
  stories?: { title: string; emotion: string | null; category: string | null }[];
  products?: { name: string; type: string; description: string | null }[];
  folders?: { name: string }[];
  brandProfile?: {
    personal_bio?: string | null;
    biggest_struggle?: string | null;
    defining_moment?: string | null;
    content_pillars?: string[] | null;
    target_audience?: string | null;
    niche?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages: WizardMessage[]; displayName?: string; userContext?: UserContext };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, displayName, userContext } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  const exchangeCount = messages.filter((m) => m.role === "user").length;

  // Build context summary from user data
  const contextParts: string[] = [];
  if (userContext?.brandProfile?.personal_bio) {
    contextParts.push(`Creator bio: ${userContext.brandProfile.personal_bio}`);
  }
  if (userContext?.brandProfile?.biggest_struggle) {
    contextParts.push(`Their core struggle: ${userContext.brandProfile.biggest_struggle}`);
  }
  if (userContext?.brandProfile?.defining_moment) {
    contextParts.push(`Defining moment: ${userContext.brandProfile.defining_moment}`);
  }
  if (userContext?.brandProfile?.content_pillars?.length) {
    contextParts.push(`Content pillars: ${userContext.brandProfile.content_pillars.join(", ")}`);
  }
  if (userContext?.brandProfile?.target_audience) {
    contextParts.push(`Target audience: ${userContext.brandProfile.target_audience}`);
  }
  if (userContext?.brandProfile?.niche) {
    contextParts.push(`Niche: ${userContext.brandProfile.niche}`);
  }
  if (userContext?.stories?.length) {
    contextParts.push(`Their stories: ${userContext.stories.map((s) => `"${s.title}" (${[s.emotion, s.category].filter(Boolean).join(", ")})`).join("; ")}`);
  }
  if (userContext?.products?.length) {
    contextParts.push(`Their products: ${userContext.products.map((p) => `${p.name} (${p.type})`).join(", ")}`);
  }

  const contextSection = contextParts.length
    ? `\n\nHere is what you know about this creator:\n${contextParts.join("\n")}\n\nUse this to generate RELEVANT, PERSONALIZED options. Reference their actual stories, struggles, products, and audience.`
    : "";

  const systemPrompt = `You help creators sharpen content ideas. You are blunt, direct, no fluff. Never reference any framework by name. Just do the work.

Your goal: take a vague idea and make it specific enough to write. Ask ONE short follow-up question at a time. Max 2-3 questions total. Be direct — no cheerleading, no hype. Just ask what you need to know.

Focus on:
- What emotion does this target? (guilt, pride, fear, anger, relief, shame)
- Who exactly is this for? (specific, not "entrepreneurs" or "women")
- What's the angle that makes someone stop scrolling?

Keep your question under 2 sentences. Sound like a sharp creative director, not a hype coach.
${contextSection}

CRITICAL: After EVERY question, you MUST include 3-5 clickable options in <options> tags. These should be specific, personalized answers based on what you know about the creator. Always make them concrete and relevant to the creator's world — pull from their stories, struggles, products, and audience.

Format:
<options>
["Option one text", "Option two text", "Option three text", "Option four text"]
</options>

${exchangeCount >= 3 ? "IMPORTANT: You have enough information now. You MUST include a <brief> block in your response. Do NOT include <options> when you include a <brief>." : exchangeCount >= 2 ? "You likely have enough to work with. If the idea is clear, include a <brief> block. Otherwise ask ONE final question with <options>." : ""}

When ready, include a JSON block in <brief> tags (no <options> when brief is included):

<brief>
{
  "topic": "Why most fitness advice is destroying your metabolism",
  "emotion": "fear",
  "angle": "Counter-intuitive take on calorie counting",
  "targetAudience": "Women 25-35 who've tried every diet and feel broken",
  "ready": true
}
</brief>

The conversational text before any tags is shown to the user.`;

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 1.0,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response");
    }

    const text = textBlock.text;

    // Check if the response contains a structured brief
    const briefMatch = text.match(/<brief>\s*([\s\S]*?)\s*<\/brief>/);
    if (briefMatch) {
      try {
        const brief = JSON.parse(briefMatch[1]);
        const conversationalText = text.replace(/<brief>[\s\S]*<\/brief>/, "").replace(/<options>[\s\S]*<\/options>/, "").trim();
        return NextResponse.json({
          message: conversationalText || "Got it \u2014 let\u2019s build.",
          ready: true,
          brief,
        });
      } catch {
        // If JSON parse fails, treat as regular message
      }
    }

    // Extract options if present
    let options: string[] | null = null;
    const optionsMatch = text.match(/<options>\s*([\s\S]*?)\s*<\/options>/);
    if (optionsMatch) {
      try {
        options = JSON.parse(optionsMatch[1]);
      } catch {
        // Ignore malformed options
      }
    }

    const conversationalText = text
      .replace(/<options>[\s\S]*<\/options>/, "")
      .replace(/<brief>[\s\S]*<\/brief>/, "")
      .trim();

    return NextResponse.json({
      message: conversationalText,
      ready: false,
      ...(options ? { options } : {}),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Wizard failed";
    return NextResponse.json(
      { error: `Failed to generate: ${errMsg}` },
      { status: 502 }
    );
  }
}
