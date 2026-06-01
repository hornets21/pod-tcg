---
name: POD TCG
description: TCG pack-opening simulator with rarity-driven card reveals and collection tracking
colors:
  neon-pulse: "#00d2ff"
  deep-void: "#0f0c29"
  void-mid: "#302b63"
  void-surface: "#24243e"
  surface-glass: "#ffffff1a"
  danger: "#ff4757"
  card-surface: "#fdfdfd"
  text-bright: "#ffffff"
  text-muted: "#b3b3b3"
  text-dim: "#666666"
  rarity-leg: "#ff0000"
  rarity-sec: "#7b00d4"
  rarity-ur: "#6a11cb"
  rarity-ssr: "#ffd700"
  rarity-sr: "#2196f3"
  rarity-r: "#4caf50"
  rarity-c: "#a8a8a8"
typography:
  display:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  title:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  body:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  card-detail:
    fontFamily: "Prompt, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  pill: "50px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.neon-pulse}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.pill}"
    padding: "16px 48px"
  button-primary-hover:
    backgroundColor: "#00f2fe"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.pill}"
    padding: "16px 48px"
  button-ghost:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-slanted:
    backgroundColor: "{colors.neon-pulse}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.xs}"
    padding: "9px 26px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "#ffffffa6"
    rounded: "0px"
    padding: "0 26px"
  nav-link-active:
    backgroundColor: "#00d2ff14"
    textColor: "{colors.text-bright}"
    rounded: "0px"
    padding: "0 26px"
  input-search:
    backgroundColor: "#ffffff0d"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.pill}"
    padding: "14px 24px 14px 48px"
  filter-pill:
    backgroundColor: "{colors.surface-glass}"
    textColor: "#ffffffd9"
    rounded: "{rounded.pill}"
    padding: "6px 19px"
  filter-pill-active:
    backgroundColor: "#00d2ff"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.pill}"
    padding: "6px 19px"
---

# Design System: POD TCG

## 1. Overview

**Creative North Star: "The Arcade Vault"**

A dark, glow-lit space where every surface is engineered to make rare finds feel like a jackpot. Neon on black, reward feedback everywhere, competitive energy. The spectator is a collector standing at a premium machine: dark surroundings, bright accent signals, cards that shimmer and glow to announce their rarity. The dark background is not decoration; it is the vault wall that makes every flash of cyan and gold feel earned.

This system is built around contrast infrastructure: the deep void surfaces exist so that rarity glows, accent borders, and holographic card effects can pop. Every neon stroke is on purpose. The competitive urgency comes from clear hierarchy and explosive rarity feedback, not from clutter or noise. Thai typography drives every line-height, weight, and spacing decision. The three font families each hold a distinct role and never compete.

This system explicitly rejects the flat, template-like gacha simulator aesthetic: no sterile card grids with no atmosphere, no bare probability sliders, no collection pages that feel like spreadsheets. The Arena Vault has weight, glow, and ceremony.

**Key Characteristics:**
- Dark surfaces as contrast infrastructure, not decoration
- Neon accent (cyan) used surgically on interactive and rare elements only
- Rarity effects that escalate with tier: Common is quiet, Legendary is explosive
- Glass and blur for overlays and modals, never as default card treatment
- Three-font system with Thai as the primary language driver
- Tactile state feedback on every interactive element

## 2. Colors

The palette is a deep purple-navy vault with a single cyan neon pulse. The rarity spectrum runs from quiet gray (Common) through warm metals (SSR gold, SR blue) to vivid spectral (UR violet, SEC purple-cyan, LEG rainbow). Each rarity tier earns a more saturated, more animated border and glow.

### Primary
- **Neon Pulse** (#00d2ff): The singular accent. Used for active navigation, primary buttons, search focus rings, card borders on hover/selected, icon glows. Never applied to more than 10% of any screen.

### Secondary
- **Danger Red** (#ff4757): Destructive actions (logout, cancel confirmations). Used only when the user needs to pause and confirm.

### Tertiary
- **Rarity Gold** (#ffd700): SSR-tier borders and tag backgrounds. A warm metal that bridges the common tiers and the spectral tiers.
- **Rarity Violet** (#6a11cb): UR-tier borders and glows. The first spectral tier where the border begins to animate.

### Neutral
- **Deep Void** (#0f0c29): The darkest background. Used as the base gradient start and the header collapsed state.
- **Void Mid** (#302b63): The middle gradient step. The dominant surface where most content sits.
- **Void Surface** (#24243e): The lighter gradient end and modal surface.
- **Surface Glass** (#ffffff1a): 10% white. The universal glass overlay for pill buttons, dropdown backgrounds, and panel surfaces. Not a backdrop-filter substitute; a tinted fill.
- **Card Surface** (#fdfdfd): Near-white. The inner content area of standard TCG cards. Never used on outer surfaces.
- **Text Bright** (#ffffff): Primary copy on dark backgrounds. Headings, body, labels, interactive text.
- **Text Muted** (#b3b3b3, 70% opacity): Secondary information, descriptions, placeholder text. Always retains 4.5:1 contrast against Deep Void surfaces.
- **Text Dim** (#666666): Tertiary text on light surfaces only (card body text). Never used on dark backgrounds.

**The One Accent Rule.** Neon Pulse is used on ≤10% of any given screen. Its rarity is the point. A screen where everything glows cyan has lost the vault; a screen where nothing glows has lost the pulse. The accent appears on: active tab indicators, focus rings, primary buttons, the logo, and hover states. Rarity colors and Danger Red are separate systems that override Neon Pulse within their domain.

## 3. Typography

**Display Font:** Chakra Petch (sans-serif, Thai + Latin)
**Body Font:** Kanit (sans-serif, Thai + Latin)
**Detail Font:** Prompt (sans-serif, Thai + Latin)

**Character:** Three geometric sans-serifs, each with a distinct role. Chakra Petch carries identity: card names on Full Art cards and the most prominent display moments. Kanit is the workhorse: navigation, headings, body, buttons, labels. Prompt handles the fine print: ability text, card footers, small detail copy where tighter character fitting helps readability. They share a Thai-first character set, so Thai ligatures and line breaks are native, not adapted.

### Hierarchy
- **Display** (Chakra Petch, 700-900 weight, clamp(2rem, 5vw, 3rem), line-height 1, letter-spacing -0.04em): God Pack announcement, card names on Full Art cards. Never used more than once per view.
- **Headline** (Kanit, 600-700 weight, 1.8rem, line-height 1.2, letter-spacing 0.05em): Section titles (collection header, modal titles). Uppercase is used for nav labels only.
- **Title** (Kanit, 600 weight, 1.2rem, line-height 1.3, letter-spacing 0.05em): Navigation links, dropdown items, subsection headings.
- **Body** (Kanit, 400 weight, 1rem, line-height 1.6): Descriptions, policy text, dialog messages. Capped at 65-75ch for prose sections.
- **Label** (Kanit, 600 weight, 0.8rem, line-height 1.4, letter-spacing 0.05em): Rarity tags, footer text, badges, timestamp/version info.
- **Card Detail** (Prompt, 400 weight, 0.85rem, line-height 1.5): Ability text on Season 2 Full Art cards. Tighter fitting for dense card surfaces.

**The Thai-First Rule.** Every typography decision is made for Thai readability first. Line height minimum 1.4 for body text (Thai script needs room for vowel marks and tone marks above and below). Letter-spacing above 0 is for labels and navigation only. Display headings use negative tracking to create impact, never below -0.04em.

## 4. Elevation

This system uses glow and glass, not traditional shadow depth. Three mechanisms convey hierarchy:

1. **Glass overlays** (backdrop-filter: blur) for modals, dropdowns, and the header when collapsed. The header uses `rgba(15, 12, 41, 0.8)` with `blur(20px)`. Modals use `rgba(15, 12, 41, 0.75)` with `blur(20px)`.

2. **Neon glow** for rarity, focus, and active states. Box-shadow with colored spread, not generic drop shadows. Rarity glow intensifies by tier: SR gets a subtle aura, LEG gets a 40px spread with multiple shadow layers.

3. **Card shadows** (`0 15px 35px rgba(0,0,0,0.5)`) for physical card depth. Modal card shadows escalate to `0 25px 60px rgba(0,0,0,0.6)` with an additional `0 0 30px rgba(0,210,255,0.1)` cyan tint for detail view.

No surface uses a generic box-shadow for "elevation" alone. If a shadow is present, it either attaches to a rarity tier or serves a clear physical metaphor (a card hovering above a table).

### Shadow Vocabulary
- **Card Rest** (`0 15px 35px rgba(0,0,0,0.5)`): Default card state in grid and collection.
- **Card Detail** (`0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,210,255,0.1)`): Card inside the detail modal. The cyan tint signals focus.
- **Card Selected** (`0 0 30px rgba(0,210,255,0.5)`): Selection glow for lot management.
- **Modal Surface** (`0 25px 50px rgba(0,0,0,0.6)`): All modal and dialog containers.
- **Dropdown** (`0 15px 35px rgba(0,0,0,0.5), 0 0 15px rgba(0,210,255,0.1)`): Navigation dropdown menus.

### Named Rules
**The Glow-Not-Shadow Rule.** Box-shadow is reserved for cards and modals. All other elevation uses backdrop-filter blur and tinted fills. A generic `0 2px 4px rgba(0,0,0,0.1)` on a button or chip means the system is leaking SaaS defaults.

## 5. Components

### Buttons
- **Shape:** Pill (50px radius) for primary and secondary, slanted rectangle (4px radius, skewX(-15deg)) for esports/esports-style actions.
- **Primary:** Gradient fill (Neon Pulse to #3a7bd5), white text, pill shape. Box-shadow: `0 5px 15px rgba(0,210,255,0.4)`. Hover brightens filter and deepens shadow.
- **Hover / Focus:** Filter brightness(1.1), shadow deepens to `0 8px 25px rgba(0,210,255,0.6)`. Focus-visible adds a `0 0 0 3px rgba(0,210,255,0.5)` ring. Active scales to `0.95`.
- **Ghost/Secondary:** Surface Glass fill, 1px white/10 border, white text, pill shape. Hover shifts to Neon Pulse tint `rgba(0,210,255,0.2)` and Neon Pulse border.
- **Slanted:** Skewed container (`skewX(-15deg)`) with un-skewed inner span. Gradient fill identical to primary. Hover lifts `translateY(-2px)` and deepens glow. Used for Discord login and esports-themed CTAs only.
- **Danger/Confirm:** Gradient red `#ff416c` to `#ff4b2b`, white text, pill. Used exclusively for destructive confirmations (logout).
- **God Pack CTA:** Gold shimmer gradient (`#ff8800` to `#ffd700`, animated), dark text, pill shape. Reserved for the God Pack dialog only.

### Filter Chips
- **Style:** Surface Glass fill, 1px Neon Pulse/20 border, white/85 text. Pill shape (50px radius).
- **State:** Default is translucent. Hover shifts to Neon Pulse tint. Active/focused fills with gradient (Neon Pulse to #3a7bd5), bold weight, border-transparent, and Neonglow shadow. This is the filter chip, not a button.

### Cards (Standard, Season 1)
- **Corner Style:** 18px radius on card-inner, 18px on card-front and card-back.
- **Background:** Rarity-dependent gradient on `.card-front`. Card content area uses Card Surface (#fdfdfd) as a near-white inset panel.
- **Shadow Strategy:** Card Rest shadow at default. On hover, a subtle glow appears matching rarity color.
- **Border:** 3px solid #666 on card-back (unrevealed state). 10px colored border on Full Art card-front matching rarity tier.
- **Internal Padding:** 12px on card-front. Card-header 10px 12px, card-body 12px, card-footer 8px 12px.
- **Holo/Gloss Overlays:** JS-driven CSS custom properties (--mx, --my) position the highlight. Gloss is a 110deg gradient sweep. Holo uses `mix-blend-mode: color-dodge`. Both are `opacity: 0` at rest, `opacity: 1` on hover, with a 0.4s ease transition.

### Cards (Full Art, Season 2)
- **Corner Style:** 22px radius.
- **Background:** Full-bleed card image with rarity border (10px colored border) and gradient overlay (top fade, bottom heavy fade).
- **Shadow Strategy:** Rarity-specific glow class (`.rarity-glow-UR`, `.rarity-glow-SEC`, etc.) applied on reveal.
- **Border:** 10px solid, color per rarity tier (#ea580c for UR, #ca8a04 for SSR, #6366f1 for SEC, #991b1b for LEG).
- **Scale:** CSS `--card-scale` variable controls the visual size relative to the wrapper. 0.657 at desktop, 0.571 at tablet, 0.457 at mobile, 0.414 at small mobile.

### Navigation (Header)
- **Style:** Sticky header, 75px tall (60px collapsed). Background transitions from transparent to blurred Deep Void on scroll.
- **Desktop:** Tab-style links with 3px bottom border. Active state: Neon Pulse border-bottom, subtle Neon Pulse background gradient, text glow. Inactive: white/65 text, no border, no glow.
- **Mobile:** Full-screen overlay with centered nav links. Glass background with 20px blur. Each link is a pill-shaped block with hover/active states matching the desktop pattern.
- **Season Switcher:** Capsule dropdown (30px radius) with glass fill. Active item fills with gradient.

### Search Input
- **Style:** Pill shape (50px radius), Surface Glass fill, Neon Pulse border at 25% opacity. Magnifying glass emoji prefix.
- **Focus:** Neon Pulse border at 100%, `0 0 20px rgba(0,210,255,0.5)` outer glow, background shifts to `rgba(255,255,255,0.12)`, slight upward lift.

### Modals and Dialogs
- **Overlay:** `rgba(0,0,0,0.8)` with 5px backdrop blur.
- **Panel:** Void Surface gradient (`rgba(15,12,41,0.75)` to `rgba(36,36,62,0.98)`) with 20px blur, 24px radius, 1px white/10 border.
- **Close:** Top-right `×` at 28px, white/40 to white on hover.
- **Special (God Pack):** Full rainbow border effect with gold glow, `0 0 60px rgba(255,215,255,0.3)` shadow, popup animation.

## 6. Do's and Don'ts

### Do:
- **Do** use Neon Pulse (#00d2ff) as the single accent color. It appears on ≤10% of any screen: active nav, primary buttons, focus rings, selection glows. Every other surface is a void neutral or a rarity-specific color.
- **Do** escalate visual treatment with rarity tier. Common cards are quiet. SSR gets a gold border. UR gets a glow. SEC gets an animated purple-cyan border. LEG gets a full rainbow shimmer with gold shadow. The gap between tiers must feel earned.
- **Do** use Surface Glass (`#ffffff1a`) for secondary buttons, dropdown backgrounds, and filter chip fills. It is the system's translucent layer, not a backdrop-filter substitute.
- **Do** test all text contrast against Void Mid and Void Surface. White text on these backgrounds must hit ≥4.5:1. Muted text (#b3b3b3) is acceptable at ≥3:1 for large text (≥18px or bold ≥14px), but body copy must use #ffffff or a tint that clears 4.5:1.
- **Do** use Chakra Petch for the single most prominent text element on a card (the name on Full Art), Kanit for everything else in the UI, and Prompt only for ability/detail text on card surfaces.
- **Do** use Thai as the primary language for all UI copy. Navigation labels, button text, and help text are in Thai. English is reserved for the brand name "POD TCG", rarity abbreviations (C, R, SR, SSR, UR, SEC, LEG), and "GOD PACK".
- **Do** ensure all interactive elements meet 44px minimum touch targets on mobile. The primary "open pack" button, filter chips, and nav links must all be comfortably tappable.
- **Do** provide `@media (prefers-reduced-motion: reduce)` alternatives for all animations. Card flips become crossfades. Pack shakes become instant reveals. God Pack celebration becomes a static overlay.

### Don't:
- **Don't** use gradient text (`background-clip: text` with a gradient). The current God Pack title and header title use this technique, but it violates accessible contrast and is decorative rather than meaningful. Use a single solid color with weight contrast instead. Replace the God Pack title gradient with solid gold (#ffd700) at bold weight. Replace the header title gradient with solid white or Neon Pulse.
- **Don't** use glassmorphism (backdrop-filter: blur) on regular card containers, list items, or inline elements. Glass is reserved for overlays, modals, dropdowns, and the collapsed header. Cards use solid rarity gradients, not glass fills.
- **Don't** apply boxed shadow (`0 Xpx Ypx rgba(0,0,0,Z)`) to buttons, chips, links, or labels at rest. Shadows are for cards and modals only. Buttons express state through fill, border, glow, and lift, not generic shadows.
- **Don't** use generic gacha simulator layouts: flat card grids with no atmosphere, bare probability sliders, collection pages that look like spreadsheets. Every collection view retains the dark vault aesthetic with rarity-appropriate glows.
- **Don't** place more than one neon accent element in the same visual plane. If the active nav tab glows, the primary button in that view should use the gradient fill (which reads as solid cyan, not glow). Glow accumulates; reserve it.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or callouts. Rarity is expressed through border (full), background, and shadow, never through a side stripe.
- **Don't** use uppercase tracking eyebrows above every section. Nav labels use uppercase with 0.05em tracking as a deliberate system for one context. Section headings use normal case.