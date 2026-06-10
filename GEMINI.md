# POD TCG - Next.js Migration Context

## Project Overview
POD TCG Pack Opening Simulator - A Next.js (TypeScript) web app that simulates TCG card pack opening with rarity system, God Pack chance, collection tracking, and Discord OAuth integration.

## Tech Stack
- **Next.js 16** (App Router)
- **TypeScript**
- **React 19**
- **Node.js 22** (LTS)
- **Tailwind CSS 4**
- **LocalStorage** for client-side persistence
- **Discord OAuth2** for authentication
- **Backend**: `https://pod-tcg-backend-production.up.railway.app`

## Project Structure
```
pod-tcg/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── [season]/       # Dynamic route for Season 1 & 2
│   │   └── auth/           # Discord OAuth callback
│   ├── components/         # Shared React components (Card, Header, Modals)
│   ├── data/               # Card data (Season 1 & 2)
│   ├── hooks/              # Custom React hooks (useGacha, useAuth, useLocalStorage)
│   └── globals.css         # Main styles (Glassmorphism, Animations)
├── public/                 # Static assets
└── next.config.ts          # Next.js configuration (Static Export)
```

## Rarity Hierarchy & Rates
1. **LEG** (Legendary) - 0.1%
2. **SEC** (Secret Rare) - 0.4%
3. **UR** (Ultra Rare) - 1.0%
4. **SSR** (Super Super Rare) - 6.5%
5. **SR** (Super Rare) - 12.0%
6. **R** (Rare) - 30.0%
7. **C** (Common) - 50.0%

- **God Pack Chance**: 1% (All 5 cards are SR+ with boosted rates for high rarity)

## Key Systems

### Pack Opening
- 5 cards per pack, unique within the pack.
- `isGacha='N'` cards are excluded from the pool.
- One-by-one reveal animation with rarity-based suspense timings.

#### Special Card Logic
- **Role ID `1356458345812459611` (ลูกหาบ พี่ว่าน)**: 
  - Magnificent "Rainbow Aura & Sparkles" reveal effect (soft pulsing, not rotating).
  - Fake random rarity (C to LEG) assigned visually upon reveal.
  - Must NOT be changed or reverted unless explicitly requested.

## Collection System
- Persistent via `localStorage`.
- Logged in: Uses Discord roles (synced with backend).
- Guest mode: Uses `pod_collection` in `localStorage`.

### Lot Management
- Selection of 1-10 cards to create a custom lot.
- Cards are shuffled and revealed one by one.
- Persists in `localStorage`.

## Development Commands
```bash
# Run dev server
npm run dev

# Build project (Static Export)
npm run build
```

## Audio Standards
- **BGM (Background Music)**: Default `0.02`.
- **SFX (Sound Effects)**: Default `0.15`. 
- **Cutscenes/Impacts**: Max `0.2 - 0.25` for heavy hits.
- Always prefer conservative volume levels to avoid user annoyance.

## Styling
- Mix of **Tailwind CSS 4** and **Custom CSS** in `globals.css`.
- **Glassmorphism**: Backdrop blur and semi-transparent layers.
- **Card Effects**: 3D Tilt (via JS-driven CSS variables), Holo overlays, Gloss shine.
- **Cutscenes**: 
  - Prefer high-quality transparent PNG/WebP images (Standard Web 1x) over complex CSS shapes for key visual assets.
  - **Visual Artifacts**: Avoid initial thick white borders or static line indicators (like in PodDrop shockwaves or FoilRip center lines). Always ensure animations start from an invisible or minimal state to prevent "flashing" artifacts.

## Important Notes
- Project is configured for **Static Export** (`output: "export"`).
- Card images are hosted at `https://img.lucky-pod.fun/`.
- Discord OAuth requires configuration of `NEXT_PUBLIC_DISCORD_REDIRECT_URI`.
