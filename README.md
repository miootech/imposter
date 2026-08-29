# Imposter — Pass & Play Party Game

A 100% offline, local-first secret-role party game for 3–12 players on a single smartphone. Includes **Chaos Mode** with 5 random modifiers, full statistics tracking, and a polished playful UI inspired by Duolingo/Headspace.

## Tech Stack
- **Next.js 16** with App Router, configured for **static export**
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** with shadcn/ui component library
- **Framer Motion** for animations
- **Zustand** for state management
- **Dexie** (IndexedDB) for persistent storage — replaces Room from the native spec
- **Capacitor 8** for wrapping the web app as a native Android APK

---

## Build the Android APK (Capacitor)

### Prerequisites
- **Node.js 20+** and npm/bun
- **Android Studio** (latest version with Android SDK 14 / API 34+)
- **Java JDK 17** (bundled with Android Studio)

### Step-by-step

#### 1. Install dependencies
```bash
npm install
```

#### 2. Build the web app + sync to Android
```bash
npm run cap:sync
```
This runs `next build` (produces `out/`) and then `npx cap sync android` (copies the web files into the Android project).

#### 3. Open the Android project in Android Studio
```bash
npm run cap:open
```
Android Studio will launch and open the `android/` folder.

#### 4. Build the APK in Android Studio
- In Android Studio, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- Wait for the build to complete (1-3 minutes)
- Click **"locate"** in the notification to find the APK file
- The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 5. (Optional) Generate a signed release APK
For a production-ready APK that can be installed on any device:
- In Android Studio: **Build → Generate Signed Bundle / APK → APK**
- Create a keystore (or use an existing one)
- Select **release** build variant
- The signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Install the APK on your phone
```bash
# Via adb (if ADB installed)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or manually: copy the APK to your phone and tap to install
# (enable "Install from unknown sources" in Android settings)
```

---

## Deploy as Web App (Cloudflare Pages)

If you prefer the web version instead of a native APK:

### Option A: Via Dashboard
1. Push this project to a GitHub/GitLab repository
2. Cloudflare → Pages → "Create a project" → "Connect to Git"
3. Build settings:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
4. Click "Save and Deploy"

### Option B: Via Wrangler CLI
```bash
npm install -g wrangler
npm run build
wrangler pages deploy out --project-name imposter
```

### Option C: Direct Upload
1. Run `npm run build` locally
2. Zip the contents of `out/` and upload via Cloudflare Pages dashboard → "Direct Upload"

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server (port 3000) |
| `npm run build` | Build web app → `out/` directory |
| `npm start` | Serve the built web app locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run 76 unit tests |
| `npm run cap:sync` | Build web app + sync to Android project |
| `npm run cap:open` | Open Android project in Android Studio |
| `npm run cap:assets` | Regenerate Android icons/splash from `assets/icon.png` |
| `npm run cap:clean` | Clean Android build cache |

---

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
- Custom emoji input (type any single emoji as your icon)

### Chaos Mode (optional, 5 random modifiers)
1. **🔄 Spiegel-Voting** — fewest votes eliminated (inverted)
2. **🕵️ Doppelagent** — one player's vote counts as 2 (kept secret)
3. **🎯 Märtyrer** — marked crewmate; if eliminated, traitors get +3 points
4. **💣 Heiße Kartoffel** — hot-potato bomb timer (45-90s)
5. **⚖️ Russisches Verhör** — mid-discussion interrogation event

Each round, a slot-machine animation reveals the active modifier.

### Privacy & Offline
- 100% offline — no Firebase, no cloud, no accounts
- IndexedDB persistence for groups, players, stats
- localStorage/Capacitor Preferences for preferences (theme, sound, haptics, role emojis, username)
- Privacy guard overlay on tab switch / app background
- Active game sessions live in memory only — never persisted

### UX Polish
- Playful & Vibrant design system in Light + Dark mode
- Duolingo-inspired microinteractions (button press, card elevation, count-up)
- Web Audio synthesized SFX (always available) + optional online SFX from Mixkit CDN
- Native haptic feedback via Capacitor Haptics plugin
- Hold-to-reveal for sensitive info (with browser context-menu suppression)
- Donut stats ring with rounded segment caps
- Expandable accordion player cards with Win-Rate percentage banner
- Optional animated gradient timer background
- 🤡 clown-themed app icon and splash screen

---

## File Structure

```
imposter-party-game/
├── capacitor.config.ts        # Capacitor configuration
├── next.config.ts             # Next.js static export config
├── package.json               # Scripts + dependencies
├── assets/                    # Source assets for icon generation
│   ├── icon.png               # 1024×1024 source icon (🤡 clown)
│   └── splash.png             # 1024×1024 source splash
├── android/                   # Native Android project (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── assets/public/     # Built web app (synced via cap:sync)
│   │   │   ├── java/com/imposter/partygame/MainActivity.java
│   │   │   └── res/              # Generated icons, splash, strings
│   │   └── build.gradle
│   └── ...
├── public/
│   ├── _headers               # Cloudflare Pages security headers
│   ├── _redirects            # SPA fallback routing
│   ├── favicon.svg            # 🤡 SVG favicon
│   └── logo.svg               # 🤡 large logo for social sharing
├── src/
│   ├── app/                   # Next.js app router (layout, page, globals.css)
│   ├── lib/game/              # Framework-agnostic game logic
│   │   ├── models.ts
│   │   ├── content/catalog.ts
│   │   ├── rules/GameRules.ts
│   │   ├── engines/           # 8 pure-function engines + ChaosEngine
│   │   └── services/          # GameSessionManager, haptics, sound
│   ├── lib/db/localDb.ts      # Dexie/IndexedDB schema
│   ├── lib/preferences/       # localStorage + Capacitor Preferences
│   ├── lib/repositories/      # Group CRUD + stat aggregation
│   ├── stores/                # Zustand stores
│   ├── components/             # All UI components
│   └── hooks/
├── tests/unit/gameEngines.test.ts   # 76 unit tests
└── README.md                  # This file
```

---

## Native Android specifics

### App ID
`com.imposter.partygame`

### Permissions
- `VIBRATE` — for haptic feedback via Capacitor Haptics plugin

That's it — **no INTERNET permission**, no network access, fully offline.

### Orientation
Locked to portrait (`android:screenOrientation="portrait"`) — the game is played on a single phone passed around.

### Backup
Disabled (`android:allowBackup="false"`) — game data lives in IndexedDB inside the WebView and should not be backed up to Google cloud (privacy-first, no secrets).

### Status Bar
Themed to match the app background color (#B8C0EC — Jester-Lila, matches the 🤡 splash).

---

## Background Music (Optional)

The app supports 4 different background music tracks for different game phases:

| File | Phase | Vibe |
|------|-------|------|
| `public/music/idle.mp3` | Home, Groups, Settings | Calming ambient loop |
| `public/music/discussion.mp3` | Discussion timer | Tense / ticking |
| `public/music/voting.mp3` | Voting phase | Suspenseful |
| `public/music/reveal.mp3` | Role reveal | Mysterious / dramatic |

### How to add music
1. Find free music (Pixabay Music, Mixkit, YouTube Audio Library)
2. Save the MP3 files in `public/music/` with the exact filenames above
3. Enable music in Settings → Feedback → „Hintergrundmusik"

If a file is missing, the app silently continues without music for that phase (no errors).

### How to change the App Icon

The app icon is generated from a single source PNG file:

1. Replace `assets/icon.png` with your new 1024×1024 PNG icon
2. Run:
   ```bash
   npm run cap:assets
   ```
   This regenerates all Android density icons (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
3. Run `npm run cap:sync` to copy the new icons to the Android project
4. Rebuild the APK in Android Studio

You can also edit `assets/splash.png` (1024×1024) for the splash screen.

---

## Author

**Ali Malik** — [Instagram @malikali065](https://instagram.com/malikali065) · [Website](https://arche-website.pages.dev)

© 2024 Ali Malik · All rights reserved

Imposter v2.3.1

---

## License
MIT — built as a learning project. All CC0 sound effects loaded from Mixkit/Pixabay CDNs (when online; falls back to synthesized tones offline).
