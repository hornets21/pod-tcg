# POD TCG - Next.js Migration Context

## Project Overview
POD TCG Pack Opening Simulator - A Next.js (TypeScript) web app that simulates TCG card pack opening with rarity system, God Pack chance, collection tracking, and Discord OAuth integration.

## Tech Stack
- **Next.js 16** (App Router)
- **TypeScript**
- **React 19**
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

### Collection System
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

## Styling
- Mix of **Tailwind CSS 4** and **Custom CSS** in `globals.css`.
- **Glassmorphism**: Backdrop blur and semi-transparent layers.
- **Card Effects**: 3D Tilt (via JS-driven CSS variables), Holo overlays, Gloss shine.

## Important Notes
- Project is configured for **Static Export** (`output: "export"`).
- Card images are hosted at `https://img.lucky-pod.fun/`.
- Discord OAuth requires configuration of `NEXT_PUBLIC_DISCORD_REDIRECT_URI`.
