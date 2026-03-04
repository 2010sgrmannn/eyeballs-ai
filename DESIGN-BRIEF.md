# Eyeballs AI -- Design Brief

> Brand DNA: "The friend who roasts your Instagram strategy over drinks -- then pulls out a spreadsheet and fixes it."
> Archetype: Outlaw (65%) + Sage (35%). Direct, witty, data-forward.

---

## 1. Color Palette

### Background Hierarchy (darkest to lightest)

| Token               | Hex       | Usage                                        |
|---------------------|-----------|----------------------------------------------|
| `bg-base`           | `#0A0A0A` | Page background, app shell                   |
| `bg-raised`         | `#111111` | Sidebar, secondary panels                    |
| `bg-card`           | `#1A1A1A` | Cards, modals, dropdown menus                |
| `bg-elevated`       | `#242424` | Hover states on cards, active sidebar items  |
| `bg-overlay`        | `#2E2E2E` | Tooltip backgrounds, popovers               |

Rationale: Pure black (#000000) causes halation on OLED screens. The brand's Void Black (#0A0A0A) is already ideal -- dark enough to feel "void" without the eye-strain of true black. Each step adds ~6-8% white overlay following Material elevation principles.

### Text Hierarchy

| Token               | Hex       | Usage                                        |
|---------------------|-----------|----------------------------------------------|
| `text-primary`      | `#FAFAFA` | Headlines, primary content, important data   |
| `text-secondary`    | `#A1A1A1` | Body text, descriptions, labels              |
| `text-muted`        | `#6B6B6B` | Timestamps, metadata, placeholder text       |
| `text-disabled`     | `#484848` | Disabled states, inactive elements           |

Rationale: Uses the brand's Pure White (#FAFAFA) and Smoke (#6B6B6B) directly. `text-secondary` is interpolated to hit WCAG AA contrast (4.5:1) against `bg-card`.

### Accent Colors

| Token               | Hex       | Usage                                        |
|---------------------|-----------|----------------------------------------------|
| `accent-primary`    | `#FF2D2D` | Primary CTAs, active states, key metrics     |
| `accent-primary-hover` | `#E62828` | Hover on primary buttons                  |
| `accent-primary-muted` | `#FF2D2D1A` | Red tint backgrounds (10% opacity)     |
| `accent-secondary`  | `#7B2FBE` | Secondary actions, tags, category badges     |
| `accent-secondary-muted` | `#7B2FBE1A` | Purple tint backgrounds (10% opacity)|
| `accent-cyan`       | `#00D4D4` | Desaturated from brand neon cyan; data viz, links, info states |
| `success`           | `#34D399` | Success states, positive metrics, growth     |
| `warning`           | `#FBBF24` | Warnings, medium-risk indicators             |
| `danger`            | `#F87171` | Errors, negative metrics, decline            |

#### Brand Color Mapping

| Brand Guide Color   | Decision                                         |
|---------------------|--------------------------------------------------|
| Void Black #0A0A0A  | KEEP as-is -- perfect base background            |
| Pure White #FAFAFA  | KEEP as-is -- primary text                       |
| Charcoal #1A1A1A    | KEEP as-is -- card surface                       |
| Smoke #6B6B6B       | KEEP as-is -- muted text                         |
| Signal Red #FF2D2D  | KEEP as-is -- primary accent, CTA color          |
| Soft Purple #7B2FBE | KEEP -- secondary accent for tags/badges         |
| Neon Magenta #FF00FF| DROP in UI -- too aggressive; reserve for marketing only |
| Neon Cyan #00FFFF   | SOFTEN to #00D4D4 -- desaturated for readability |
| Neon Green #39FF14  | DROP in UI -- replace with success green #34D399 |
| Neon Yellow #FFFF00 | DROP in UI -- replace with warning amber #FBBF24 |
| Deep Navy #0D0D2B   | DROP -- conflicts with pure dark aesthetic       |

### Borders & Dividers

| Token               | Hex       | Usage                                        |
|---------------------|-----------|----------------------------------------------|
| `border-subtle`     | `#1F1F1F` | Card borders, section dividers               |
| `border-default`    | `#2A2A2A` | Input borders, more prominent divisions      |
| `border-focus`      | `#FF2D2D` | Focus rings on interactive elements          |

---

## 2. Typography

### Font Stack

| Purpose        | Font            | Fallback               | Weight  |
|----------------|-----------------|------------------------|---------|
| Headlines      | Space Grotesk   | system-ui, sans-serif  | 700     |
| Body           | Inter           | system-ui, sans-serif  | 400, 500|
| Data / Mono    | JetBrains Mono  | ui-monospace, monospace| 500     |

Do NOT use Press Start 2P or VT323 in the app UI. These are reserved for marketing/landing pages only. The arcade aesthetic does not belong in a productivity dashboard.

### Size Scale (rem)

| Token     | Size    | Line Height | Usage                         |
|-----------|---------|-------------|-------------------------------|
| `text-xs` | 0.75rem | 1.0rem      | Badges, fine print            |
| `text-sm` | 0.875rem| 1.25rem     | Labels, metadata, table cells |
| `text-base`| 1rem   | 1.5rem      | Body text, descriptions       |
| `text-lg` | 1.125rem| 1.75rem     | Emphasized body, subheadings  |
| `text-xl` | 1.25rem | 1.75rem     | Section headers               |
| `text-2xl`| 1.5rem  | 2rem        | Page titles                   |
| `text-3xl`| 1.875rem| 2.25rem     | Dashboard hero metrics        |
| `text-4xl`| 2.25rem | 2.5rem      | Large data displays           |

### Weight Usage

- **400 (Regular):** Body text, descriptions
- **500 (Medium):** Labels, table headers, emphasized body
- **700 (Bold):** Headlines only (Space Grotesk). Never bold Inter body text -- use Medium instead.

### Letter Spacing

- Headlines (Space Grotesk): `-0.025em` (tight, brand-consistent)
- Body (Inter): `0` (default)
- Mono data (JetBrains Mono): `0.02em` (slightly expanded for readability)

---

## 3. Spacing & Border Radius

### Spacing Rhythm

Base unit: **4px**. All spacing should be multiples of 4.

| Token     | Value  | Usage                                       |
|-----------|--------|---------------------------------------------|
| `space-1` | 4px    | Inline icon gaps, tight padding             |
| `space-2` | 8px    | Badge padding, compact elements             |
| `space-3` | 12px   | Input padding, small gaps                   |
| `space-4` | 16px   | Card padding, standard gap between elements |
| `space-5` | 20px   | Section padding inside cards                |
| `space-6` | 24px   | Gap between cards, section margins          |
| `space-8` | 32px   | Page section separation                     |
| `space-10`| 40px   | Major layout gaps                           |
| `space-12`| 48px   | Page top/bottom padding                     |

### Border Radius Philosophy

**Mixed-radius approach**: Slightly rounded, never pill-shaped, never sharp.

| Token         | Value | Usage                                      |
|---------------|-------|--------------------------------------------|
| `radius-sm`   | 4px   | Badges, small tags                         |
| `radius-md`   | 8px   | Buttons, inputs, dropdowns                 |
| `radius-lg`   | 12px  | Cards, modals, panels                      |
| `radius-xl`   | 16px  | Large feature cards, hero elements         |
| `radius-full` | 9999px| Avatars, status dots only                  |

This gives a modern but controlled feel -- Linear/Vercel territory. Not playful (iOS pill shapes), not corporate (sharp corners).

---

## 4. Animations & Micro-interactions

### What Should Animate

| Element                 | Animation               | Duration | Easing                    |
|-------------------------|-------------------------|----------|---------------------------|
| Button hover            | Background color shift  | 150ms    | `ease-out`                |
| Button press            | Scale to 0.97           | 100ms    | `ease-in-out`             |
| Card hover              | Border brightens, subtle lift (translateY -1px) | 200ms | `ease-out` |
| Modal open              | Fade in + scale from 0.95| 200ms   | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal close             | Fade out + scale to 0.95 | 150ms   | `ease-in`                 |
| Dropdown open           | Fade in + translateY -4px| 150ms   | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Page transitions        | Fade, 150ms             | 150ms    | `ease-out`                |
| Sidebar item hover      | Background color shift  | 120ms    | `ease-out`                |
| Toast notification      | Slide in from right     | 250ms    | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Skeleton loaders        | Shimmer pulse           | 1500ms   | `ease-in-out`, infinite   |
| Number counters (scores)| Count up animation      | 600ms    | `ease-out`                |
| Progress bars           | Width expansion         | 400ms    | `ease-out`                |

### Timing Principles

- **Instant feedback** (hover, press): 100-150ms
- **Enter transitions** (modals, dropdowns): 150-250ms
- **Exit transitions**: Always 25-50ms shorter than enter (feels snappier)
- **Data animations** (counters, charts): 400-800ms
- **Never exceed 500ms** for UI transitions (feels sluggish)

### Easing

Primary easing curve: `cubic-bezier(0.16, 1, 0.3, 1)` -- fast start, gentle land. This is the "Linear/Vercel" feel. Never use `linear` easing for UI elements (feels robotic).

### What Should NOT Animate

- Text content changes (swap instantly)
- Table row reordering (instant unless drag-and-drop)
- Filter/sort results (instant swap, no fade)
- Scroll position (native browser behavior only)
- Navigation between pages (minimal fade only, no slide)
- Background colors on the page shell
- Any animation that loops infinitely (except skeleton loaders)

### Reduced Motion

Respect `prefers-reduced-motion: reduce`. When active, disable all motion except opacity fades and instant state changes.

---

## 5. Visual Identity -- What Makes Eyeballs AI FEEL Different

### The Emotional Target

The app should feel like a **weapon** -- precise, fast, slightly dangerous. Not friendly. Not playful. Not corporate. Think: a content creator's war room.

Emotional response on first load: "This tool means business."

### Differentiators from Generic Dark SaaS

1. **Signal Red as a scalpel, not a paintbrush.** Red appears only on the most important element on screen -- the primary CTA, the key metric, the critical alert. Everything else is grayscale. This creates immediate visual hierarchy through restraint.

2. **Data is the hero, not the chrome.** Metrics and numbers should be the largest, most prominent elements. The UI around them should disappear. JetBrains Mono at large sizes for key data points.

3. **Monochrome confidence.** Most SaaS apps use blue or gradient accents. Eyeballs uses only grayscale + red. This feels deliberate and opinionated, matching the brand's "Outlaw" archetype.

4. **CRT/scanline texture -- but subtle.** A barely-visible noise texture (2-3% opacity) on the base background gives the surface depth without being gimmicky. This nods to the brand's arcade aesthetic without compromising usability.

5. **Typography with attitude.** Space Grotesk headlines with tight tracking feel bold and confrontational. Not the safe Inter/Geist that every other SaaS uses for headers.

### Reference Apps to Emulate

1. **Linear** -- Layout structure, spacing rhythm, dark mode execution, minimal color usage
2. **Raycast** -- Command-palette UX, keyboard-first feel, monochrome with single bold accent
3. **Vercel Dashboard** -- Data display patterns, sidebar navigation, card layouts
4. **Superhuman** -- Speed perception, keyboard shortcuts, premium feel through performance
5. **Arc Browser** -- Bold typography, personality in a productivity tool, controlled use of color

---

## 6. Component Guidance

### Cards (Content Thumbnails)

```
Background:     #1A1A1A (bg-card)
Border:         1px solid #1F1F1F (border-subtle)
Border radius:  12px (radius-lg)
Padding:        16px (space-4)
Hover:          border shifts to #2A2A2A, translateY(-1px), 200ms ease-out
```

- Thumbnail image: 16:9 aspect ratio, `radius-md` (8px) corners, `object-fit: cover`
- Title: `text-base`, `text-primary`, `font-medium` (Inter 500)
- Metadata row: `text-sm`, `text-muted`, flex row with `space-2` gaps
- Virality score: `text-lg`, JetBrains Mono 500, `accent-primary` (#FF2D2D) when high (>70), `text-secondary` when mid, `text-muted` when low
- Tags/topics: Inline badges with `radius-sm`, `bg-elevated` background, `text-sm`, `text-secondary`

### Data Displays (Metrics & Scores)

```
Large metric:   text-4xl, JetBrains Mono 500, text-primary
Label:          text-sm, Inter 500, text-muted, uppercase, letter-spacing 0.05em
Trend arrow:    success (#34D399) for up, danger (#F87171) for down
Container:      bg-card, radius-lg, padding space-5
```

- Virality scores: Display as large numbers, not charts. The number IS the visualization.
- Percentage changes: Small text next to metric, colored by direction (green up / red down)
- Sparkline charts: If used, single color (#FF2D2D stroke, no fill, or 10% fill). Thin lines (1.5px).
- Score rings/donuts: Stroke color = `accent-primary`, track color = `bg-elevated`, stroke-width 3-4px

### Forms and Inputs

```
Background:     #111111 (bg-raised)
Border:         1px solid #2A2A2A (border-default)
Border radius:  8px (radius-md)
Padding:        12px horizontal, 10px vertical
Font:           Inter 400, text-base, text-primary
Placeholder:    text-muted (#6B6B6B)
Focus:          border-color #FF2D2D, box-shadow 0 0 0 3px #FF2D2D1A
```

- Labels: `text-sm`, Inter 500, `text-secondary`, placed above input with `space-2` gap
- Error state: border-color `danger`, error text below in `text-sm` `danger`
- Select dropdowns: Same style as inputs. Dropdown menu = `bg-card`, `radius-md`, `shadow-lg`
- Buttons:
  - **Primary:** `bg accent-primary`, white text, `radius-md`, `font-medium`
  - **Secondary:** `bg-elevated`, `text-primary`, `border-default`, `radius-md`
  - **Ghost:** transparent bg, `text-secondary`, hover `bg-elevated`
  - **Danger:** `bg danger`, white text (use sparingly)
  - All buttons: `text-sm`, `padding: 8px 16px`, min-height 36px

### Navigation

**Sidebar (primary nav):**
```
Width:          240px (collapsible to 48px icon-only)
Background:     #111111 (bg-raised)
Border-right:   1px solid #1F1F1F
Item padding:   8px 12px
Item radius:    6px
Active item:    bg-elevated (#242424), text-primary, accent-primary left border (2px)
Hover item:     bg-elevated at 50% opacity
Icon size:      18px, text-muted color, text-primary when active
Label:          text-sm, Inter 500
Section label:  text-xs, text-muted, uppercase, letter-spacing 0.05em, margin-top space-6
```

**Top bar:**
```
Height:         56px
Background:     #0A0A0A (bg-base)
Border-bottom:  1px solid #1F1F1F
Content:        Logo left, search center (optional), user avatar right
```

### Modals

```
Overlay:        #0A0A0A at 80% opacity
Container:      bg-card (#1A1A1A), radius-lg (12px), max-width 520px
Padding:        24px (space-6)
Header:         text-xl, Space Grotesk 700, text-primary, margin-bottom space-4
Close button:   Top right, ghost style, 32x32, text-muted
Footer:         border-top #1F1F1F, padding-top space-4, flex justify-end, gap space-3
Animation:      Fade in overlay 200ms, scale container from 0.95 200ms
```

### Tables

```
Header row:     text-xs, Inter 500, text-muted, uppercase, letter-spacing 0.05em
Header bg:      bg-raised (#111111)
Body row:       text-sm, text-secondary
Row border:     border-bottom 1px #1F1F1F
Row hover:      bg-elevated at 50% opacity
Row padding:    12px 16px
Selected row:   bg-elevated, left border 2px accent-primary
```

### Badges & Tags

```
Default:        bg-elevated (#242424), text-secondary, text-xs, radius-sm, padding 2px 8px
Red (hot):      bg #FF2D2D1A, text #FF2D2D
Purple (topic): bg #7B2FBE1A, text #9B5FD4 (lightened purple for readability)
Cyan (info):    bg #00D4D41A, text #00D4D4
Green (success):bg #34D3991A, text #34D399
```

### Shadows

Use shadows sparingly. In dark mode, shadows are nearly invisible against dark backgrounds. Instead, rely on background color elevation and borders for depth.

```
shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.3)     -- subtle, for dropdowns
shadow-md:      0 4px 12px rgba(0, 0, 0, 0.4)     -- modals
shadow-lg:      0 8px 24px rgba(0, 0, 0, 0.5)     -- popovers, command palette
```

### Scrollbars

```
Track:          transparent
Thumb:          #2A2A2A, radius-full
Thumb hover:    #3A3A3A
Width:          6px
```

---

## 7. Noise Texture

Apply a barely-visible noise/grain texture over `bg-base` to add surface depth:

```css
background-image: url('/noise.svg'); /* or generated via CSS */
opacity: 0.03;
mix-blend-mode: overlay;
pointer-events: none;
```

This creates a subtle CRT/film grain effect that ties back to the brand's arcade DNA without being distracting. It should be imperceptible at a glance but give the background a "living" quality compared to flat color.

---

## 8. Dark Mode Only

This app is dark mode ONLY. There is no light mode toggle. The brand is dark-mode-first and the monochrome identity depends on it. Removing the complexity of theme switching keeps the implementation cleaner and the visual identity stronger.

---

## Summary of Key Principles

1. **Monochrome + Signal Red.** Gray scale is the canvas, red is the scalpel.
2. **Data first.** Numbers are the largest elements. UI chrome disappears.
3. **Restrained motion.** Everything animates, but nothing bounces or overshoots.
4. **Elevation through surface, not shadow.** Lighter backgrounds = higher in z-stack.
5. **Typography with opinion.** Space Grotesk for attitude, Inter for clarity, JetBrains Mono for data.
6. **No decoration for decoration's sake.** Every pixel earns its place.
