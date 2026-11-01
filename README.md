# 🏁 FLAG BATTLE ARENA

A complete 3D spectator simulation game built exclusively with **HTML5, CSS3, Vanilla JavaScript (ES6+), and Three.js**. Fully offline, installable as a Progressive Web App (PWA), and prepared for native Android APK packaging via Capacitor.

---

## 🌟 Game Highlights

- **Pure Spectator Simulation**: Sit back and watch AI-controlled country flags compete autonomously in 12 mini-games. No manual player controls needed.
- **100% Offline Capability**: All libraries, sounds, textures, country datasets, and physics algorithms run locally with zero external network requests.
- **Procedural Audio Synthesizer**: Web Audio API sound synthesis produces realistic referee whistles, bounces, cheers, countdown beeps, fanfare, and goal sirens.
- **Autonomous Multi-Personality AI**:
  - 🔴 **Aggressive**: Fierce forward charges, high attack impulses, high risk-taking.
  - 🔵 **Defensive**: Centered positioning, perimeter avoidance, strategic waiting.
  - 🟡 **Balanced**: Calculated advances, threat assessment, steady pacing.
  - 🟣 **Unpredictable**: Erratic feints, sudden flanking, deceptive timing.
- **Dynamic Cinematic Spectator Camera**:
  - **Auto Camera**: Dynamically frames the midpoint and spread of the leading contenders.
  - **Wide View**: High isometric overview of the entire stadium.
  - **Close-up**: Intimate tracking of the leading flags.
  - **Top View**: Tactical bird's-eye camera.
  - **Follow Leader**: Direct lock-on to the 1st place flag or match ball.
  - **Cinematic Slow-Motion**: Automatically triggers dramatic 0.25x slow-mo on eliminations, goal strikes, and photo finishes.
- **Simulation Controls**: Real-time speed multipliers (0.5x, 1x, 2x, 4x), pause, resume, and instant rematch.
- **Country Flag System**: Extensive dataset with 70+ nations across Europe, Americas, Asia, Africa, and Oceania. Procedural 256x128 CanvasTexture generation ensures razor-sharp 3D flag coats.
- **Tournament Engine**: Automatic single-elimination tournament generator for 4, 8, 16, 32, and 64 flags with interactive bracket visualization.
- **Persistent Records & Hall of Fame**: Tracks battle counts, win rates, podium finishes, and match history using offline LocalStorage.

---

## 🎮 The 12 Competition Modes

1. **Sumo Battle** (🤼): Raised circular dohyo ring. Push rivals over the neon border to score ring outs. Last flag inside wins.
2. **Obstacle Race** (🏃): Navigate rotating sweepers, hurdles, and lateral sliders along a straight track to cross the finish line.
3. **Last Flag Standing** (🕳): Floating hexagonal platform grid. Tiles shake, flash red, and collapse into the void. Stay on solid ground!
4. **Tug of War** (🪢): Two teams pull on a physics rope across a mud pit. Coordinated stamina pulses drag the center ribbon to victory.
5. **Rising Lava** (🌋): Molten lava rises from the stadium depths. Climb stepped spiral platforms before the liquid engulfs you.
6. **Bowling Challenge** (🎳): Charge down a polished bowling alley and smash into a 10-pin triangle. Most pin knockdowns wins.
7. **Jump Challenge** (🧗): Leap across ascending floating pillars of varying distances and heights across a canyon.
8. **Downhill Race** (⛷): High-speed gravity slope with banked curves and jump ramps. First to reach the bottom arch wins.
9. **Glass Bridge** (🧊): High-altitude bridge with pairs of tempered and fragile glass tiles. Stepping on fragile glass shatters it!
10. **Spin Battle** (🌀): Hyper-speed spinning bumper flags inside a bowl arena with elastic collision impulses.
11. **Tower Climb** (🗼): Ascend a spiral obstacle tower with rotating sweeper arms. Reach the summit crown platform to win.
12. **Football Battle** (⚽): Autonomous 2-team soccer on a turf pitch with physical ball, goal nets, goalkeepers, and strikers.

---

## 📱 PWA & Android Installation

### 1. Progressive Web App (PWA)
- **Manifest**: `/manifest.json` configured with `display: "standalone"`, `start_url: "/"`, and icons up to 512x512.
- **Offline Cache**: `/service-worker.js` pre-caches the shell and local modules.
- **In-App Prompt**: The "Install App" button appears automatically in compatible browsers (Chromium/Android), with guided instructions for iOS Safari.

### 2. Android APK Packaging via Capacitor

This project is pre-configured with `capacitor.config.json` for Android APK compilation:
- **Application Name**: `Flag Battle Arena`
- **Package Name**: `com.masrur.flagbattlearena`

#### Step-by-Step Instructions to Build Android APK:

```bash
# 1. Build the production web bundle
npm run build

# 2. Install Capacitor CLI and Android platform
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

# 3. Add Android platform
npx cap add android

# 4. Sync web assets (dist/) to Android project
npx cap sync android

# 5. Open in Android Studio to build APK or AAB
npx cap open android
```

In Android Studio:
1. Select **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** for a testing APK.
2. Or select **Build** > **Generate Signed Bundle / APK** for Google Play Store release.

---

## 🛠 Technology Stack

- **Graphics**: Three.js (WebGL 3D rendering with soft shadows, lighting, and particles)
- **Physics**: Custom 3D rigid-body physics engine (colliders, impulses, gravity, friction, restitution)
- **Audio**: Web Audio API Procedural Synthesizer (100% offline)
- **UI / Styling**: Pure HTML5 & CSS3 (modern responsive design, safe-area insets, mobile touch targets)
- **Storage**: Browser LocalStorage & IndexedDB
- **Build Tool**: Vite (bundler for local assets)
