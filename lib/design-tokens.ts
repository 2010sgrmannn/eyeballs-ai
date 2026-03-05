// Design tokens for use in JS/TS (motion configs, canvas, etc.)

export const colors = {
  background: "#080a0c",
  surface: "#0e1115",
  surfaceCard: "#141820",
  surfaceElevated: "#1a1f28",
  surfaceOverlay: "#212730",

  textPrimary: "#f0f2f5",
  textSecondary: "#a1a1aa",
  textMuted: "#6b7280",

  accent: "#ff3333",
  accentHover: "#ff4747",
  accentMuted: "rgba(255, 51, 51, 0.1)",

  cta: "#00e87a",
  ctaHover: "#00ff88",
  ctaMuted: "rgba(0, 232, 122, 0.1)",

  info: "#47d4ff",
  infoMuted: "rgba(71, 212, 255, 0.1)",

  success: "#00e87a",
  warning: "#EAB308",
  danger: "#ff3333",

  border: "rgba(255, 255, 255, 0.07)",
  borderDefault: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(255, 255, 255, 0.12)",

  // Canvas node accents
  nodeBackstory: "#A855F7",
  nodeContent: "#3B82F6",
  nodeProduct: "#00e87a",
  nodeYoutube: "#ff3333",
  nodeAiChat: "#ff3333",
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
    out: [0.22, 1, 0.36, 1] as [number, number, number, number],
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
