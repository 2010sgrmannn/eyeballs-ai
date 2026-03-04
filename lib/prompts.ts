import type { BrandProfile, Content, CreatorStory, Platform, Product, ScriptStyle } from "@/types/database";

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

// --- Canvas prompt helpers ---

function toneLabel(value: number | null, low: string, high: string): string {
  const v = value ?? 3;
  if (v <= 2) return low;
  if (v >= 4) return high;
  return "Balanced";
}

export function buildCanvasPrompt(options: {
  topic: string;
  platform: Platform;
  scriptStyle: ScriptStyle;
  brandProfile: BrandProfile | null;
  referenceContent: Content[];
  products: Product[];
  creatorStories?: CreatorStory[];
}): string {
  const { topic, platform, scriptStyle, brandProfile, referenceContent, products, creatorStories = [] } = options;

  const formalityLabel = brandProfile
    ? toneLabel(brandProfile.tone_formality, "Casual", "Formal")
    : "Balanced";
  const humorLabel = brandProfile
    ? toneLabel(brandProfile.tone_humor, "Serious", "Humorous")
    : "Balanced";
  const authorityLabel = brandProfile
    ? toneLabel(brandProfile.tone_authority, "Approachable", "Authoritative")
    : "Balanced";

  const brandSection = brandProfile
    ? `
## Brand Voice & Persona
Name: ${brandProfile.display_name || "Not specified"}
Type: ${brandProfile.creator_type || "Not specified"}
Niche: ${brandProfile.niche || "Not specified"}
Archetype: ${brandProfile.creator_archetype || "Not specified"}
Tone: ${brandProfile.tone_descriptors?.join(", ") || "Not specified"}
Formality: ${formalityLabel} (${brandProfile.tone_formality ?? 3}/5)
Humor: ${humorLabel} (${brandProfile.tone_humor ?? 3}/5)
Approachability: ${authorityLabel} (${brandProfile.tone_authority ?? 3}/5)
Content Goal: ${brandProfile.content_goal || "Not specified"}
Target Audience: ${brandProfile.target_audience || "Not specified"}
Audience Problem: ${brandProfile.audience_problem || "Not specified"}
What Makes Them Different: ${brandProfile.unique_value_prop || "Not specified"}
Values: ${brandProfile.values?.join(", ") || "Not specified"}
Content Pillars: ${brandProfile.content_pillars?.join(", ") || "Not specified"}
Sample Voice: ${brandProfile.sample_content || "Not provided"}
${brandProfile.personal_bio ? `\nCreator Background: ${brandProfile.personal_bio}` : ""}${brandProfile.location ? `\nLocation: ${brandProfile.location}` : ""}${brandProfile.birth_year ? ` | Born: ${brandProfile.birth_year}` : ""}${brandProfile.biggest_struggle ? `\nCore Struggle: ${brandProfile.biggest_struggle}` : ""}${brandProfile.defining_moment ? `\nDefining Moment: ${brandProfile.defining_moment}` : ""}${brandProfile.fun_facts?.length ? `\nFun Facts: ${brandProfile.fun_facts.join(", ")}` : ""}`
    : "";

  const storyBankSection =
    creatorStories.length > 0
      ? `
## Personal Story Bank
Use these real stories for identity-based hooks and emotional specificity.
Match story emotion to the script's emotional nerve.

${creatorStories
  .map(
    (s, i) =>
      `${i + 1}. [${(s.category || "general").toUpperCase()} / ${(s.emotion || "mixed").toUpperCase()}${s.time_period ? ` / ${s.time_period}` : ""}] "${s.title}"
   Story: ${s.content}`
  )
  .join("\n\n")}

When writing Level 4 scripts, reference these stories. Replace generic advice with "When I [specific story]..." framing. Don't force-fit — use the story whose emotion matches the script's nerve.`
      : "";

  const referenceSection =
    referenceContent.length > 0
      ? `
## Reference Content Patterns
Here are hooks and CTAs from the creator's curated content library:

${referenceContent
  .map(
    (c, i) =>
      `${i + 1}. ${c.hook_text ? `Hook: "${c.hook_text}"` : ""} ${c.cta_text ? `| CTA: "${c.cta_text}"` : ""} ${c.caption ? `| Caption excerpt: "${c.caption.slice(0, 150)}"` : ""} (Virality: ${c.virality_score ?? "N/A"})`
  )
  .join("\n")}`
      : "";

  const productSection =
    products.length > 0
      ? `
## Products to Promote (optional)
${products.map((p) => `- ${p.name} (${p.type}): ${p.description || "No description"} | Price: ${p.price || "Not set"} | URL: ${p.url || "Not set"}`).join("\n")}

Naturally weave product mentions into the CTA or body where appropriate. Do not make every script about the product — only 2-3 of the 5 should mention it, and always in a natural, non-salesy way.`
      : `
## Products to Promote (optional)
No products — do not include any product promotion.`;

  return `You are an elite viral content scriptwriter. You use the "Piercing the Cloth" framework to create content that the algorithm pushes because it triggers real emotional responses.

## The Piercing the Cloth Framework

Think of content topics like pushing through a piece of cloth. A broad, generic topic is like a flat metal disc — it pushes against the cloth but never breaks through. A hyper-specific, emotionally charged topic is like a needle — it pierces straight through because all the force is concentrated on one sharp point.

**The rule: The more specific and emotionally charged the topic, the more it pierces — and the more viral it goes.**

### How to sharpen any topic (4 levels):
- Level 1 (Broad): "Morning routine tips" — generic, forgettable, no emotional charge
- Level 2 (Narrowed): "Morning routine for entrepreneurs" — better, but still surface-level
- Level 3 (Specific + Emotional): "The morning routine I built after burning out at 26" — now there's a story, stakes, identity
- Level 4 (Maximum Pierce): "I almost lost everything because I refused to wake up before noon — here's the routine that saved my business" — guilt, identity, fear, transformation, deeply specific

### What makes a topic pierce:
- IDENTITY: "As a man…", "As a young entrepreneur…", "As someone who grew up poor…"
- PERSONAL STAKES: Real consequences, real transformation, real vulnerability
- SINGLE EMOTIONAL NERVE: guilt, pride, anger, fear, relief, shame, defiance — pick ONE and go deep
- CONTROVERSY: Challenge something everyone else accepts. Invite disagreement.
- SPECIFICITY: Replace "people" with a specific person. Replace "things" with one exact thing.

## Your Task

BEFORE writing any script, you MUST internally sharpen the user's topic to Level 4 (Maximum Pierce). Take their topic and ask yourself:
1. Who specifically is this for? (identity)
2. What's the single emotional nerve? (guilt, pride, fear, anger, relief)
3. What are the personal stakes? (what did they almost lose? what changed?)
4. What's the controversial angle? (what will make people comment to agree OR disagree?)

Then write all 5 scripts using the SHARPENED version — never the original broad topic.

## Topic (sharpen this to Level 4 before writing)
${topic}

## Platform
${PLATFORM_GUIDANCE[platform]}

## Script Length
${STYLE_GUIDANCE[scriptStyle]}
${brandSection}
${storyBankSection}
${referenceSection}
${productSection}

## Script Quality Checklist (every script MUST pass all of these):
1. Does it PIERCE? Is it specific enough to hit a single emotional nerve?
2. Does the hook give CONTEXT + create CURIOSITY in the first sentence?
3. Is the language DEAD SIMPLE? Could someone who barely speaks English understand it?
4. Is there a CLEAR EMOTIONAL CORE? (not information — emotion)
5. Does it include a PERSONAL INSIGHT or experience, not generic advice?
6. Is it SHORT ENOUGH? Ruthlessly cut anything that doesn't serve the emotional point.
7. Would someone feel COMPELLED to comment, save, or share?

## Output Format
Return ONLY a JSON array with exactly 5 objects. Each object has these keys:
- "style_label": A short label for the script style (e.g., "Direct & Punchy", "Storytelling", "Educational Deep-Dive", "Provocative/Contrarian", "Conversational & Relatable")
- "pierced_topic": The Level 4 sharpened version of the topic you used for this script (1 sentence)
- "hook": The opening hook — must give CONTEXT and create CURIOSITY (1-2 sentences, dead simple language)
- "body": The main content — emotionally driven, insight-based, not generic advice (length matches script style)
- "cta": The closing call-to-action — make it feel personal, not corporate (1-2 sentences)

Each script should have a distinctly different emotional angle while staying true to the brand voice.
The 5 styles should cover a range: one direct/punchy, one storytelling, one educational, one provocative/contrarian, one conversational/relatable.
Each script should target a DIFFERENT emotional nerve (e.g., one hits guilt, another hits pride, another hits fear, etc.)

Do not include any text outside the JSON array. Do not wrap in markdown code blocks.`;
}
