# 3D Cockpit Asteroids

A browser-based 3D reimagining of classic *Asteroids*, played from inside the ship cockpit with radar, shields, and hyperspace.

## Play locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Controls

| Key | Action |
|-----|--------|
| Enter | Start / Restart |
| Escape | Pause / Resume |
| M | Mute / Unmute |
| Arrow keys | Rotate ship |
| X | Thrust |
| Space | Fire |
| Z | Shield |
| Shift | Hyperspace |

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This project is a static Vite SPA. Connect the GitHub repo in the [Vercel dashboard](https://vercel.com/new):

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

`vercel.json` is included for SPA routing (all paths rewrite to `index.html`).

## Project docs

| Document | Purpose |
|----------|---------|
| [GAME_SPEC.md](./docs/GAME_SPEC.md) | Gameplay, controls, mechanics |
| [TECH_STACK.md](./docs/TECH_STACK.md) | Libraries, tools, Vercel |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | Phased build plan |
| [ASSET_PIPELINE.md](./docs/ASSET_PIPELINE.md) | 3D models, audio, VFX |
| [API_TYPES.md](./docs/API_TYPES.md) | TypeScript interfaces |

## Stack

- Vite + React + TypeScript
- Three.js / React Three Fiber
- Zustand
- Howler.js
- Tailwind CSS

## Optional audio files

Place MP3 files in `public/audio/` to replace synthesized fallback sounds. See [public/audio/README.md](./public/audio/README.md).
