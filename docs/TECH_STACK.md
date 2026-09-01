# Technology Stack & Tooling

## Why this stack

| Requirement | Choice | Reason |
|-------------|--------|--------|
| Vercel deploy | **Vite + React + TypeScript** | Static SPA; zero server WebGL; fastest path for Qwen3-coder |
| 3D | **Three.js** via **React Three Fiber (R3F)** | Declarative scenes; huge docs; model-friendly |
| Helpers | **@react-three/drei** | Camera, stars, GLTF, Html overlay, RenderTexture |
| Post-FX | **@react-three/postprocessing** | Bloom, vignette, chromatic aberration |
| State | **Zustand** | Simple game state without boilerplate |
| Audio | **Howler.js** | Reliable Web Audio loops |
| HUD | **React DOM + Tailwind CSS** | Crosshair, score, radar easier in 2D overlay |
| Physics (v1) | **Custom** (sphere AABB + wrap) | Asteroids is simple; avoid Rapier complexity for v1 |
| Build | **Vite 5** | Fast HMR for local dev |
| Lint/format | **ESLint + Prettier** | Consistent codegen from Qwen3-coder |
| Types | **TypeScript 5.x strict** | Catch errors in generated code |

> **Note:** Next.js works on Vercel too, but adds SSR complexity for WebGL (`dynamic(..., { ssr: false })`). **Vite SPA is recommended** for this project unless you need Next features.

---

## Tool versions (pin in `package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.167.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.111.0",
    "@react-three/postprocessing": "^2.16.0",
    "zustand": "^4.5.5",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "eslint": "^9.9.0",
    "@types/react": "^18.3.3",
    "@types/three": "^0.167.0",
    "@types/howler": "^2.2.11"
  }
}
```

---

## Art & content tools

| Tool | Purpose | Export |
|------|---------|--------|
| **Blender 4.x** | Cockpit mesh, asteroid base shapes | `.glb` → `public/models/` |
| **GIMP / Krita** | Scratch maps, UI textures | `.png` → `public/textures/` |
| **Poly Haven** (free) | HDRIs, rock textures | `.hdr`, `.jpg` |
| **Kenney / Freesound** | Placeholder SFX until final | `.mp3` / `.ogg` |
| **Orbitron** (Google Fonts) | HUD typography | CSS import |

### Blender → GLB settings
- Apply transforms before export
- +Y up, forward -Z (Three.js default after import)
- Draco compression optional (smaller deploy)

---

## Dev environment

```bash
# Prerequisites
node >= 20
pnpm >= 9   # or npm

# Commands
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # dist/
pnpm preview  # test production build locally
```

---

## Vercel deployment

### `vercel.json`
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Considerations
- **All assets static** in `public/` or bundled
- **No Node APIs** at runtime — pure client
- Enable **gzip/brotli** automatically on Vercel
- Keep total `dist/` under ~50 MB for fast cold loads (compress audio/models)
- Set `Cache-Control` for assets in Vite build (hashed filenames = long cache)

### Environment variables
None required for v1. Optional `VITE_ANALYTICS_ID` later.

---

## Qwen3-coder workflow tips

1. **One phase per prompt** — see `IMPLEMENTATION_PLAN.md`
2. Always include: `Read docs/GAME_SPEC.md section X` in prompts
3. Require **TypeScript strict** — no `any`
4. Max **~200 lines per new file**; split if larger
5. After each phase: `pnpm build` must pass
6. Use **acceptance criteria** from spec as prompt exit conditions

### Prompt template
```
You are building 3D Cockpit Asteroids. Read:
- docs/GAME_SPEC.md (sections N-M)
- docs/IMPLEMENTATION_PLAN.md (Phase K)

Implement only Phase K. Do not skip ahead.
Stack: Vite, React, TypeScript, R3F, Zustand, Tailwind.
Match existing file structure. Run pnpm build when done.
```

---

## Optional upgrades (post-MVP)

| Feature | Tool |
|---------|------|
| Better physics | `@react-three/rapier` |
| Procedural asteroids | custom simplex noise on icosphere |
| Score persistence | `localStorage` + Vercel KV (if API added) |
| Analytics | Vercel Analytics |
| CI | GitHub Action: `pnpm build` on push |
