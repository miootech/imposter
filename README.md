# Secret Role — Pass & Play Party Game

A 100% offline, local-first secret-role party game for 3–12 players on a single smartphone.

## Tech Stack
- **Next.js 16** with App Router, configured for **static export**
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** with shadcn/ui component library
- **Framer Motion** for animations
- **Zustand** for state management
- **Dexie** (IndexedDB) for persistent storage — replaces Room from the native spec
- **localStorage** for preferences — replaces DataStore from the native spec

## Deploy to Cloudflare Pages

### Option A: Via Dashboard (no CLI)

1. Push this project to a GitHub/GitLab repository
2. Log in to Cloudflare → Pages → "Create a project" → "Connect to Git"
3. Select your repo
4. Configure build settings:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. Click "Save and Deploy" — Cloudflare runs the build and serves the static files from the `out/` directory

### Option B: Via Wrangler CLI

```bash
npm install -g wrangler
wrangler login

# Build the static export first
npm run build

# Deploy the out/ directory
wrangler pages deploy out --project-name secret-role
```

### Option C: Manual upload

1. Run `npm run build` locally
2. The `out/` directory contains the full static site
3. Zip the contents of `out/` and upload via Cloudflare Pages dashboard → "Direct Upload"

## Build

```bash
npm install
npm run build       # produces /out directory
npm run dev         # local dev server
npm run lint        # eslint
npm test            # unit tests (76 tests, all green)
```

## Features

### Core Game
- 3–12 players, single smartphone pass-and-play
- 5 roles: Crewmate, Detective, Impostor, Accomplice, Jester
- NORMAL and HARD difficulty modes
- Faction-aware role validation: Crew faction (Crewmate + Detective) > Traitor faction (Impostor + Accomplice)
- Timer matrix per spec §47 with 10-second countdown escalation
- Voting with tie handling, self-voting allowed
- Score engine with all bonus rules per spec §69-73
- 25 default categories × 5 words each, fully data-driven and extensible

### Chaos Mode (optional)
5 random modifiers that activate at the start of each round when enabled:
1. **🔄 Spiegel-Voting** — fewest votes eliminated (inverted)
2. **🕵️ Doppelagent** — one player's vote counts as 2 (kept secret)
3. **🎯 Märtyrer** — marked crewmate; if eliminated, traitors get +3 points
4. **💣 Heiße Kartoffel** — hot-potato bomb timer (45-90s)
5. **⚖️ Russisches Verhör** — mid-discussion interrogation event

### Privacy & Offline
- 100% offline — no Firebase, no cloud, no accounts
- IndexedDB persistence for groups, players, stats
- localStorage for preferences (theme, sound, haptics, role emojis, username)
- Privacy guard overlay on tab switch / app background
- Active game sessions live in memory only — never persisted

### UX Polish
- Playful & Vibrant design system in Light + Dark mode
- Duolingo-inspired microinteractions (button press, card elevation, count-up)
- Web Audio synthesized SFX (always available)
- Optional online SFX from Mixkit CDN (lazy-loaded, falls back to synth)
- Haptic feedback via navigator.vibrate
- Hold-to-reveal for sensitive info (with browser context-menu suppression)
- Donut stats ring with rounded segment caps
- Expandable accordion player cards
- Win-rate percentage banner in stats modals

## File Structure

```
app/                           # Next.js app router
  layout.tsx                   # Root layout
  page.tsx                     # Single-page app entry (all screens routed via Zustand)
  globals.css                  # Tailwind + theme tokens (light & dark)

src/lib/game/                  # Framework-agnostic game logic
  models.ts                    # All data types + constants
  content/catalog.ts           # 25 categories × 5 words
  rules/GameRules.ts           # Validation + role composition
  engines/                     # Pure-function engines
    RoleAssignmentEngine.ts
    WordSelectionEngine.ts
    HintEngine.ts
    StartPlayerEngine.ts
    TimerEngine.ts
    VotingEngine.ts
    WinConditionEngine.ts
    ScoreEngine.ts
    ChaosEngine.ts             # 5 chaos modifiers
  services/
    GameSessionManager.ts      # Orchestrates game state
    haptics.ts
    sound.ts                   # Hybrid: synth + optional online SFX

src/lib/db/localDb.ts          # Dexie/IndexedDB schema
src/lib/preferences/preferences.ts
src/lib/repositories/groupRepository.ts

src/stores/                    # Zustand stores
  gameStore.ts
  preferencesStore.ts

src/components/                # React components
  game/                        # Reusable game UI (GameButton, RoleBadge, TimerRing, DonutStatsRing, ChaosBanner, ...)
  home/, groups/, settings/, setup/, reveal/, discussion/, voting/, results/

tests/unit/gameEngines.test.ts # 76 unit tests

public/
  _headers                     # Cloudflare Pages security headers
  _redirects                   # SPA fallback routing
```

## License
MIT — built as a learning project. All CC0 sound effects loaded from Mixkit/Pixabay CDNs.
