import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";

interface WizardMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages: WizardMessage[]; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, displayName } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  const exchangeCount = messages.filter((m) => m.role === "user").length;

  const systemPrompt = `You help creators sharpen content ideas. You are blunt, direct, no fluff. Never reference any framework by name. Never say "piercing the cloth" or any methodology name. Just do the work.

Your goal: take a vague idea and make it specific enough to write. Ask ONE short follow-up question at a time. Max 2-3 questions total. Be direct — no cheerleading, no "That's a spicy topic!", no "I love this!". Just ask what you need to know.

Focus on:
- What emotion does this target? (guilt, pride, fear, anger, relief, shame)
- Who exactly is this for? (specific, not "entrepreneurs" or "women")
- What's the angle that makes someone stop scrolling?

Keep responses under 2 sentences. Sound like a sharp creative director, not a hype coach.

${exchangeCount >= 3 ? "IMPORTANT: You have enough information now. You MUST include a <brief> block in your response." : exchangeCount >= 2 ? "You likely have enough to work with. If the idea is clear, include a <brief> block. Otherwise ask ONE final question." : ""}

When ready, include a JSON block in <brief> tags:

<brief>
{
  "topic": "Why most fitness advice is destroying your metabolism",
  "emotion": "fear",
  "angle": "Counter-intuitive take on calorie counting",
  "targetAudience": "Women 25-35 who've tried every diet and feel broken",
  "ready": true
}
</brief>

Include <brief> tags ONLY when done. The conversational text before the tags is shown to the user.`;

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
        // Extract the conversational part (before the brief tags)
        const conversationalText = text.replace(/<brief>[\s\S]*<\/brief>/, "").trim();
        return NextResponse.json({
          message: conversationalText || "Looks good — let's build this!",
          ready: true,
          brief,
        });
      } catch {
        // If JSON parse fails, treat as regular message
      }
    }

    return NextResponse.json({ message: text, ready: false });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Wizard failed";
    return NextResponse.json(
      { error: `Failed to generate: ${errMsg}` },
      { status: 502 }
    );
  }
}
