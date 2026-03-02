import type { BrandProfile, Content, Platform, ScriptStyle } from "@/types/database";

const PLATFORM_GUIDANCE: Record<Platform, string> = {
  instagram:
    "Format for Instagram Reels. Use punchy hooks in the first 3 seconds. Keep sentences short. Include a strong call-to-action for engagement (save, share, comment). Visual cues are important.",
  tiktok:
    "Format for TikTok. Start with an irresistible hook that stops the scroll. Use conversational, casual tone. Trends and relatability drive engagement. End with a question or challenge.",
  linkedin:
    "Format for LinkedIn. Open with a bold statement or contrarian take. Use line breaks for readability. Share a lesson or insight. End with a thought-provoking question. Professional but authentic tone.",
  twitter:
    "Format for Twitter/X. Be concise and punchy. Lead with the most compelling point. Use thread-friendly structure if needed. End with a clear takeaway or CTA.",
};

const STYLE_GUIDANCE: Record<ScriptStyle, string> = {
  short:
    "Short-form script (under 60 seconds). Be extremely concise. Every word must earn its place. Aim for 100-150 words total.",
  medium:
    "Medium-length script (1-3 minutes). Allow for more detail and storytelling. Aim for 200-400 words total.",
  long: "Long-form script (3+ minutes). Deep dive into the topic. Include multiple examples and transitions. Aim for 500-800 words total.",
};

export function buildScriptPrompt(options: {
  topic: string;
  platform: Platform;
  scriptStyle: ScriptStyle;
  brandProfile: BrandProfile | null;
  topContent: Content[];
}): string {
  const { topic, platform, scriptStyle, brandProfile, topContent } = options;

  const brandSection = brandProfile
    ? `
## Brand Voice
- Voice: ${brandProfile.brand_voice || "Not specified"}
- Values: ${brandProfile.values?.join(", ") || "Not specified"}
- Target Audience: ${brandProfile.target_audience || "Not specified"}
- Content Style: ${brandProfile.content_style || "Not specified"}
- Niche: ${brandProfile.niche || "Not specified"}

Ensure the script matches this brand voice and speaks to the target audience.`
    : "";

  const viralContentSection =
    topContent.length > 0
      ? `
## Top-Performing Content Patterns
Here are hooks and CTAs from the user's highest-performing content. Use these patterns as inspiration:

${topContent
  .map(
    (c, i) =>
      `${i + 1}. ${c.hook_text ? `Hook: "${c.hook_text}"` : ""} ${c.cta_text ? `| CTA: "${c.cta_text}"` : ""} ${c.caption ? `| Caption excerpt: "${c.caption.slice(0, 150)}"` : ""} (Virality: ${c.virality_score ?? "N/A"})`
  )
  .join("\n")}`
      : "";

  return `You are a professional content scriptwriter. Generate a script for the following topic.

## Topic
${topic}

## Platform
${PLATFORM_GUIDANCE[platform]}

## Script Length
${STYLE_GUIDANCE[scriptStyle]}
${brandSection}
${viralContentSection}

## Output Format
Return ONLY a JSON object with exactly three keys: "hook", "body", and "cta". Each value should be a string.
- "hook": The opening hook that grabs attention (1-3 sentences)
- "body": The main content/story/value (adapt length to script style)
- "cta": The closing call-to-action (1-2 sentences)

Do not include any text outside the JSON object. Do not wrap in markdown code blocks.`;
}
