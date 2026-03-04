// Design tokens for use in JS/TS (motion configs, canvas, etc.)

export const colors = {
  background: "#09111A",
  surface: "#0F1923",
  surfaceCard: "#162030",
  surfaceElevated: "#1C2840",
  surfaceOverlay: "#223050",

  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1A1",
  textMuted: "#6B6B6B",

  accent: "#6366F1",
  accentHover: "#818CF8",
  accentMuted: "rgba(99, 102, 241, 0.1)",

  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",

  border: "rgba(255, 255, 255, 0.06)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(255, 255, 255, 0.12)",

  // Canvas node accents
  nodeBackstory: "#A855F7",
  nodeContent: "#3B82F6",
  nodeProduct: "#22C55E",
  nodeYoutube: "#EF4444",
  nodeAiChat: "#6366F1",
} as const;

export const motionConfig = {
  // Spring presets
  spring: {
    default: { type: "spring" as const, stiffness: 300, damping: 30 },
    gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
    bouncy: { type: "spring" as const, stiffness: 400, damping: 20 },
    stiff: { type: "spring" as const, stiffness: 500, damping: 35 },
  },

  // Easing presets
  ease: {
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],
    inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },

  // Duration presets (in seconds)
  duration: {
    fast: 0.1,
    normal: 0.15,
    slow: 0.2,
    page: 0.3,
  },

  // Stagger delay (in seconds)
  stagger: 0.06,
} as const;

export const canvasConfig = {
  // Grid
  gridSize: 24,
  gridColor: "rgba(255, 255, 255, 0.03)",

  // Node defaults
  defaultNodeWidth: 280,
  defaultNodeHeight: 200,
  aiChatNodeWidth: 420,
  aiChatNodeHeight: 520,

  // Edge animation
  particleDuration: "2.5s",
  particleRadius: 4,

  // Auto-save debounce (ms)
  autoSaveDelay: 1500,

  // Zoom
  minZoom: 0.1,
  maxZoom: 2,
  defaultZoom: 1,
} as const;
