// Shared brand profile option arrays used by both the onboarding form and API endpoints.

export const NICHE_OPTIONS = [
  "Fitness", "Business", "Tech", "Lifestyle", "Finance",
  "Health & Wellness", "Education", "Entertainment", "Food & Cooking",
  "Travel", "Beauty", "Real Estate", "Crypto", "Parenting",
  "Gaming", "Fashion", "Sports", "Music", "Comedy", "Motivation",
];

export const TONE_DESCRIPTOR_OPTIONS = [
  "Bold", "Witty", "Warm", "Professional", "Edgy", "Chill",
  "Empowering", "Sarcastic", "Inspirational", "Educational",
  "Raw", "Polished", "Playful", "Provocative", "Nurturing",
];

export const ARCHETYPE_OPTIONS = [
  { id: "educator", label: "The Educator", description: "You teach, share tips, break down complex topics" },
  { id: "storyteller", label: "The Storyteller", description: "You share experiences, get vulnerable, build narrative" },
  { id: "entertainer", label: "The Entertainer", description: "You bring humor, personality, and entertainment" },
  { id: "motivator", label: "The Motivator", description: "You inspire, push people to act, drive transformation" },
  { id: "curator", label: "The Curator", description: "You curate trends, aesthetics, and taste" },
];

export const CONTENT_PILLAR_OPTIONS = [
  "Educational tips", "Personal stories", "Behind the scenes",
  "Product reviews", "Trending topics", "Motivational",
  "Entertainment", "Industry news", "Day in my life",
  "Tutorials", "Q&A", "Collaborations",
];

export const CONTENT_FORMAT_OPTIONS = [
  "Talking head", "Voiceover + B-roll", "Text overlay",
  "Tutorial / Screen share", "Skit / Narrative", "Interview", "Slideshow",
];

export const CTA_OPTIONS = [
  "Follow for more", "Link in bio", "Comment below", "Share this",
  "Save for later", "DM me", "Subscribe", "Custom...",
];

export const VALUE_OPTIONS = [
  "Authenticity", "Growth", "Community", "Creativity", "Impact",
  "Innovation", "Freedom", "Discipline", "Hustle", "Mindfulness",
];

export const AGE_RANGE_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55+"];

export const GENDER_OPTIONS = ["Everyone", "Primarily women", "Primarily men"];

export const CONTENT_GOAL_OPTIONS = [
  { id: "grow_audience", label: "Grow my audience" },
  { id: "drive_sales", label: "Drive sales" },
  { id: "build_community", label: "Build community" },
  { id: "establish_authority", label: "Establish authority" },
  { id: "entertain", label: "Entertain" },
];
