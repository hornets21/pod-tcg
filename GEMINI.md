# POD TCG - Agent Skill & Project Context

## Project Overview
POD TCG Pack Opening Simulator - A vanilla JS web app that simulates TCG card pack opening with rarity system, God Pack chance, collection tracking, and Discord OAuth integration.

## Tech Stack
- **Vanilla JavaScript** (no frameworks)
- **CSS3** with animations, gradients, glassmorphism
- **HTML5**
- **LocalStorage** for client-side persistence
- **Discord OAuth2** for authentication
- **Backend**: `https://pod-tcg-backend-production.up.railway.app`

## Project Structure
```
pod-tcg/
├── index.html          # Main HTML with all sections and modals
├── script.js           # All game logic, UI, auth, lot management
├── style.css           # Complete styling with animations
├── version_update.js   # Cache busting script (npm version hook)
├── package.json        # NPM config (dev: servor, version: cache buster)
├── data/
│   └── cards.js        # Card data array (CARDS constant)
├── .agents/
│   └── rules/
│       ├── tcg-instruction.md         # Original TCG spec
│       └── migrate-card-tempate.md    # Card template migration guide
└── scratch/            # Test scripts
```

## Card Data Structure
```js
{
  role_id: "discord_role_id",  // Unique identifier
  name: "Card Name",
  rarity: "LEG|SEC|UR|SSR|SR|R|C",
  image: "https://url.to/image.png",
  ability: "Card description",
  isGacha: "Y|N"  // Y = eligible for gacha pool, N = not obtainable via packs
}
```

## Rarity Hierarchy (highest to lowest)
1. **LEG** (Legendary) - 0.1%
2. **SEC** (Secret Rare) - 0.4%
3. **UR** (Ultra Rare) - 1.0%
4. **SSR** (Super Super Rare) - 6.5%
5. **SR** (Super Rare) - 12.0%
6. **R** (Rare) - 30.0%
7. **C** (Common) - 50.0%

## Gacha Rates
```js
const RATE = {
    LEG: 0.1,
    SEC: 0.4,
    UR: 1.0,
    SSR: 6.5,
    SR: 12.0,
    R: 30.0,
    C: 50.0
};
const GOD_PACK_CHANCE = 1; // 1%
```

## Key Systems

### Pack Opening
- 1 pack = 5 cards
- Cards are unique within a pack
- God Pack (1% chance): All 5 cards are SR+, with boosted rates for LEG/SEC/UR/SSR
- Pack shuffle uses Fisher-Yates algorithm
- Cards with `isGacha='N'` are excluded from gacha pool

### God Pack Rates
```js
function getHighRarity() {
    if (rand < 5) return "LEG";
    if (rand < 15) return "SEC";
    if (rand < 45) return "UR";
    return "SSR";
}
```

### Collection System
- **Guest mode**: Uses localStorage (`pod_collection`)
- **Logged in**: Uses Discord roles from backend
- Collection persists via localStorage

### Lot Management
- Select 1-10 cards to create a custom lot
- Cards are shuffled when lot starts
- Each card is revealed one at a time
- Lot state persists in localStorage

### Authentication
- Discord OAuth2 flow
- Backend: `https://pod-tcg-backend-production.up.railway.app`
- User data stored in localStorage (`pod_user`, `pod_token`)
- Guest collection cleared on login

## Key Functions
| Function | Purpose |
|----------|---------|
| `openPack()` | Generate a pack of 5 cards |
| `rollRarity()` | Roll for rarity based on rates |
| `getHighRarity()` | Roll for God Pack rarity |
| `isGodPack()` | Check if pack is God Pack |
| `getRandomCardByRarity(rarity)` | Get random card by rarity (gacha only) |
| `startOpening()` | UI flow for pack opening |
| `revealCard(card, index)` | Animate card reveal |
| `addToCollection(card)` | Add card to collection |
| `updateCollectionUI(filter, search)` | Render collection grid |
| `showSection(sectionId)` | Navigate between sections |
| `checkAuth()` | Handle Discord OAuth |

## UI Sections
- `opening` - Pack opening animation
- `collection` - Card collection/browser
- `lot` - Lot management (selection + opening)

## CSS Variables
```css
:root {
    --bg-dark: #0f0c29;
    --bg-gradient: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    --accent: #00d2ff;
    --accent-glow: rgba(0, 210, 255, 0.5);
    --glass: rgba(255, 255, 255, 0.1);
    /* Rarity gradients: --ssssr-color, --sssr-color, --ssr-color, --sr-color, --r-color, --c-color */
}
```

## LocalStorage Keys
- `pod_collection` - Guest collection (array of cards)
- `pod_user` - Discord user data
- `pod_token` - Discord auth token
- `pod_lot_selection` - Selected card IDs for lot
- `pod_active_lot` - Current active lot
- `pod_lot_index` - Current card index in lot

## Development Commands
```bash
# Run dev server
npx serve -p 8080
# or
npm run dev  # uses servor with reload

# Update cache versions
npm run version  # runs version_update.js
```

## Card Effects
- **3D Tilt**: Mouse tracking via `--mx` and `--my` CSS variables
- **Holo**: Rarity-specific holographic overlays
- **Gloss**: Shine animation on hover
- **Reveal**: Card flip animation with rarity-based suspense delays
- **God Pack**: Full-screen golden glow effect

## Important Notes
- Only use Vanilla JS - no frameworks
- Separate data (`data/cards.js`) from logic (`script.js`) from UI (`index.html`)
- All card images are hosted externally (`https://img.lucky-pod.fun/`)
- Console must be error-free
- Rates are cumulative in `rollRarity()` function
- Fisher-Yates shuffle is used for randomness
- `isGacha='N'` cards cannot be obtained through packs
