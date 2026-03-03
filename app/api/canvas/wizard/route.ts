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

  const systemPrompt = `You are a creative content strategist helping ${displayName || "a creator"} plan their next piece of viral content. You use the "Piercing the Cloth" framework: the more specific and emotionally charged the topic, the more it pierces — and the more viral it goes.

Your job is to ask 2-4 short, punchy follow-up questions (one at a time) to sharpen the idea. Focus on:
1. What specific emotion should this hit? (guilt, pride, fear, anger, relief, shame, defiance)
2. Who specifically is this for? (not generic audiences)
3. What angle or hot take makes this interesting?
4. What personal experience or insight makes this authentic?

Keep your questions conversational, brief, and direct. Use the creator's name when it feels natural.

IMPORTANT: After you've gathered enough clarity (usually 2-4 exchanges), respond with a JSON block wrapped in <brief> tags containing the structured output. Example:

<brief>
{
  "topic": "Why most fitness advice is destroying your metabolism",
  "emotion": "fear",
  "angle": "Counter-intuitive take on calorie counting",
  "targetAudience": "Women 25-35 who've tried every diet and feel broken",
  "ready": true
}
</brief>

Include the <brief> tags ONLY when you have enough clarity. Otherwise, ask your next question naturally.`;

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
