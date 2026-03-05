# EYEBALLS.AI Brand Guide

> Adapted from [clawgtm.com](https://www.clawgtm.com/) visual language. Dark-first, editorial, technical-meets-creative.

---

## 1. Typography

### Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Headings** | DM Sans | 500, 600, 700, 800 | H1-H6, hero text, section titles |
| **Body** | DM Sans | 300, 400, 500 | Paragraphs, descriptions, UI text |
| **Mono / Labels** | IBM Plex Mono | 400, 500 | Tags, badges, status labels, code, metadata |
| **Italic Accent** | Playfair Display | 700 italic | Single-word emphasis inside headings (e.g., "your *Brand* DNA") |

### Type Scale

| Element | Size | Weight | Letter-spacing | Line-height |
|---------|------|--------|----------------|-------------|
| Hero H1 | 64px / 4rem | 800 | -0.02em | 1.05 |
| H2 | 40px / 2.5rem | 700 | -0.015em | 1.15 |
| H3 | 28px / 1.75rem | 600 | -0.01em | 1.25 |
| H4 | 20px / 1.25rem | 600 | -0.005em | 1.35 |
| Body | 16px / 1rem | 400 | 0 | 1.6 |
| Small / Caption | 14px / 0.875rem | 400 | 0 | 1.5 |
| Tag / Badge | 11-12px | 500 | 0.08em | 1 |
| Mono Label | 12px | 500 | 0.06em | 1 |

### Rules
- Tags and badges: IBM Plex Mono, uppercase, letter-spacing 1-3px
- Playfair Display used ONLY for single italic words inside DM Sans headings
- Never use Playfair for full sentences or body text
- Hero text can use DM Sans weight 800 for maximum impact

---

## 2. Color System

### Dark Mode (Primary)

#### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#080a0c` | Page background |
| `--surface` | `#0e1115` | Cards, panels, nav |
| `--surface-2` | `#141820` | Elevated cards, modals |
| `--surface-3` | `#1a1f28` | Hover states, active surfaces |

#### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text` | `#f0f2f5` | Primary text |
| `--text-secondary` | `#a1a1aa` | Secondary text, descriptions |
| `--text-muted` | `#6b7280` | Disabled, placeholder |

#### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#ff3333` | Primary accent — buttons, links, active states |
| `--accent-hover` | `#ff4747` | Hover state for accent |
| `--accent-glow` | `rgba(255, 51, 51, 0.15)` | Glow effects, ambient orbs |
| `--accent-muted` | `rgba(255, 51, 51, 0.10)` | Subtle backgrounds |
| `--cta` | `#00e87a` | CTA buttons, success states, "Generate" actions |
| `--cta-hover` | `#00ff88` | Hover for CTA |
| `--cta-glow` | `rgba(0, 232, 122, 0.15)` | CTA glow effects |
| `--info` | `#47d4ff` | Info highlights, secondary accent |
| `--info-glow` | `rgba(71, 212, 255, 0.15)` | Info glow |

#### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#00e87a` | Same as CTA — success states |
| `--warning` | `#EAB308` | Warnings |
| `--danger` | `#ff3333` | Same as accent — errors, destructive |

#### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `rgba(255, 255, 255, 0.07)` | Default borders |
| `--border-hover` | `rgba(255, 255, 255, 0.12)` | Hover borders |
| `--border-accent` | `#ff3333` | Active/focused borders |

### Canvas Node Colors (unchanged)
| Node Type | Hex |
|-----------|-----|
| Backstory | `#A855F7` |
| Content | `#3B82F6` |
| Product | `#22C55E` |
| YouTube | `#EF4444` |
| AI Chat | `#ff3333` (was `#6366F1`, now matches accent) |

---

## 3. Spacing & Layout

### Section Spacing
| Context | Padding |
|---------|---------|
| Desktop sections | `72px 200px` (clamp: `72px clamp(20px, 10vw, 200px)`) |
| Mobile sections | `60px 20px` |
| Card padding | `24px` |
| Nav padding | `24px 60px` (desktop), `16px 20px` (mobile) |

### Border Radius
| Element | Radius |
|---------|--------|
| Cards | `16px` |
| Buttons | `8px` |
| Tags/Badges | `999px` (pill) |
| Inputs | `8px` |
| Modals | `16px` |
| Avatars | `50%` |

### Grid
| Context | Columns | Gap |
|---------|---------|-----|
| Feature cards | 3-col | `1px` (border-gap pattern) |
| Content grid | 12-col | `24px` |
| Mobile | 1-col | `16px` |
| Breakpoints | `900px` (tablet), `480px` (mobile) |

---

## 4. Effects & Surfaces

### Glassmorphism
```css
.glass {
  backdrop-filter: blur(24px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.glass-elevated {
  backdrop-filter: blur(40px);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
```

### Noise Texture
SVG fractalNoise overlay, opacity 0.03-0.04, `mix-blend-mode: overlay`, fixed position, `pointer-events: none`.

### Hero Grid Background
60px grid lines with radial fade mask. Subtle white lines at 3-5% opacity.

### Hero Glow
800px radial gradient centered behind hero text using `--accent-glow` color.

### Ambient Orbs
Replace indigo/purple/cyan orbs with:
- **Red orb**: `radial-gradient(circle, rgba(255, 51, 51, 0.12) 0%, transparent 70%)`
- **Green orb**: `radial-gradient(circle, rgba(0, 232, 122, 0.08) 0%, transparent 70%)`
- **Blue orb**: `radial-gradient(circle, rgba(71, 212, 255, 0.06) 0%, transparent 70%)`

### Glow Border (Analysis Screen)
Rotating conic-gradient using CSS `@property --glow-angle`:
- Colors: `#ff3333` (accent) and `#47d4ff` (info) instead of indigo/cyan
- 3s linear infinite rotation
- Blurred duplicate layer at 0.3 opacity

---

## 5. Animation System

### Easing
| Name | Value | Usage |
|------|-------|-------|
| `ease-out-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | **Primary easing** — all transitions |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy entrances (badges, popovers) |

### Scroll-Triggered Animations
```css
.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
.fade-in-left  { transform: translateX(-48px); }
.fade-in-right { transform: translateX(48px); }
```

### Keyframe Animations
| Name | Duration | Usage |
|------|----------|-------|
| `heroFadeUp` | 0.75s | Hero text entrance |
| `badgePop` | 0.6s (spring ease) | Badge/tag pop-in |
| `floatGlow` | 7s | Hero glow floating |
| `labelReveal` | 0.4s | Label clip-path reveal |
| `ticker` | 20s linear | Marquee/ticker scroll |
| `shimmer` | 1.5s | Loading skeleton shimmer |
| `glow-spin` | 3s linear | Rotating border glow |

### Framer Motion Presets
```ts
export const motionConfig = {
  spring: {
    default: { type: "spring", stiffness: 300, damping: 30 },
    gentle: { type: "spring", stiffness: 200, damping: 25 },
    bouncy: { type: "spring", stiffness: 400, damping: 20 },
    stiff: { type: "spring", stiffness: 500, damping: 35 },
  },
  ease: {
    out: [0.22, 1, 0.36, 1],    // Updated to match clawgtm
    inOut: [0.4, 0, 0.2, 1],
  },
  duration: {
    fast: 0.1,
    normal: 0.15,
    slow: 0.2,
    page: 0.3,
  },
  stagger: 0.06,
};
```

### Hover Interactions
- Buttons: `translateY(-2px)` + `box-shadow` on hover
- Cards: `translateY(-1px)` + border-color lighten
- Feature cards: red top-border with `scaleX(0) -> scaleX(1)` on hover
- Links: underline offset animation

---

## 6. Components

### Buttons

#### Primary (Red)
```css
.btn-primary {
  background: var(--accent);
  color: #ffffff;
  padding: 12px 28px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  border: none;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 51, 51, 0.25);
}
```

#### CTA (Green)
```css
.btn-cta {
  background: var(--cta);
  color: #080a0c;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
}
.btn-cta:hover {
  background: var(--cta-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 232, 122, 0.25);
}
```

#### Ghost
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 12px 28px;
  border-radius: 8px;
}
.btn-ghost:hover {
  border-color: var(--border-hover);
  color: var(--text);
}
```

### Tags / Badges
```css
.tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}
.tag-accent {
  border-color: rgba(255, 51, 51, 0.3);
  color: var(--accent);
}
.tag-cta {
  border-color: rgba(0, 232, 122, 0.3);
  color: var(--cta);
}
```

### Cards
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.card:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}
```

### Feature Card Grid (clawgtm pattern)
3-column grid with 1px gap borders. Each card has a `::before` pseudo-element for red top-border animation:
```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);  /* gap color */
  border-radius: 16px;
  overflow: hidden;
}
.feature-card {
  background: var(--surface);
  padding: 32px;
  position: relative;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.feature-card:hover::before {
  transform: scaleX(1);
}
```

### Nav
```css
.nav {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: rgba(8, 10, 12, 0.8);
  border-bottom: 1px solid var(--border);
  padding: 16px 60px;
}
```

### Toasts
```css
/* Sonner toast overrides */
background: var(--surface);
border: 1px solid var(--border);
color: var(--text);
font-family: 'DM Sans', sans-serif;
border-radius: 12px;
```

---

## 7. Selection & Focus

```css
::selection {
  background: rgba(255, 51, 51, 0.3);
  color: #ffffff;
}

.focus-ring:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-muted);
}
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | > 900px | Full grid layouts, horizontal nav |
| Tablet | 480-900px | 2-col grids, condensed spacing |
| Mobile | < 480px | 1-col stacked, hamburger nav, 20px padding |

---

## 9. Migration Checklist (Current -> New Brand)

### Fonts
- [ ] Replace `Space Grotesk` -> `DM Sans` (headings)
- [ ] Replace `Inter` -> `DM Sans` (body)
- [ ] Replace `JetBrains Mono` -> `IBM Plex Mono` (mono)
- [ ] Add `Playfair Display` italic 700 for accent words
- [ ] Update Google Fonts import in `globals.css`
- [ ] Update `--font-heading`, `--font-body`, `--font-mono` CSS variables

### Colors
- [ ] Background: `#09111A` -> `#080a0c`
- [ ] Surface: `#0F1923` -> `#0e1115`
- [ ] Accent: `#6366F1` (indigo) -> `#ff3333` (red)
- [ ] Accent hover: `#818CF8` -> `#ff4747`
- [ ] Add `--cta: #00e87a` (green) for CTA buttons
- [ ] Add `--info: #47d4ff` (blue) for info highlights
- [ ] Update all indigo references in components
- [ ] Unify auth page colors with dashboard (remove dual-dialect)

### Design Tokens (`lib/design-tokens.ts`)
- [ ] Update all color values
- [ ] Update easing `ease.out` to `[0.22, 1, 0.36, 1]`

### CSS (`globals.css`)
- [ ] Update `@theme inline` block with new tokens
- [ ] Update ambient orbs (red/green/blue instead of indigo/purple/cyan)
- [ ] Update glow-border colors
- [ ] Update ReactFlow handle/edge colors
- [ ] Add new animation keyframes (heroFadeUp, badgePop, etc.)
- [ ] Update button hover styles

### Components
- [ ] Update hardcoded colors in all components
- [ ] Add feature card grid pattern
- [ ] Update nav styling
- [ ] Update toast styling in layout.tsx
- [ ] Update canvas node AI Chat color

---

## 10. Do's and Don'ts

### Do
- Use red (`#ff3333`) as the primary interactive color
- Use green (`#00e87a`) for positive actions (Generate, Continue, Success)
- Use IBM Plex Mono uppercase for all labels and metadata
- Use `cubic-bezier(0.22, 1, 0.36, 1)` as the default easing
- Keep surfaces dark and let accent colors pop
- Use glassmorphism for overlays and elevated surfaces
- Maintain noise texture overlay on all pages

### Don't
- Don't use indigo/purple as accent colors (old brand)
- Don't mix font families within a single text block (except Playfair italic accents)
- Don't use `ease` or `ease-in-out` — always use the expo easing
- Don't use pure black (`#000000`) — always use `#080a0c`
- Don't use borders heavier than 1px
- Don't skip the hover state on interactive elements
