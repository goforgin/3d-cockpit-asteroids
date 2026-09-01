# Implementation Plan (Phased Build for Qwen3-Coder)

Build in order. **Do not start phase N+1 until phase N passes `pnpm build` and its acceptance tests.**

---

## Repository layout (final)

```
3d-asteroids/
├── public/
│   ├── models/
│   │   ├── cockpit.glb
│   │   └── asteroid_large.glb
│   ├── textures/
│   │   ├── cockpit_normal.jpg
│   │   ├── asteroid_rock.jpg
│   │   └── starfield.hdr
│   └── audio/
│       ├── laser.mp3
│       ├── explosion.mp3
│       └── thrust.mp3
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── game/
│   │   ├── constants.ts          # all tunable numbers
│   │   ├── types.ts              # Asteroid, Ship, Laser, Wave
│   │   ├── math.ts               # wrap, distance, random on sphere
│   │   ├── collision.ts          # sphere-sphere tests
│   │   ├── waves.ts              # wave spawn logic
│   │   └── input.ts              # keyboard state singleton
│   ├── store/
│   │   └── gameStore.ts          # Zustand: score, lives, wave, gameState
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── GameCanvas.tsx    # R3F Canvas wrapper, ssr safe mount
│   │   │   ├── Scene.tsx         # lights, starfield, play volume
│   │   │   ├── Ship.tsx          # cockpit + camera rig
│   │   │   ├── AsteroidField.tsx
│   │   │   ├── Asteroid.tsx
│   │   │   ├── LaserBolt.tsx
│   │   │   ├── Explosion.tsx
│   │   │   └── Effects.tsx       # postprocessing
│   │   └── hud/
│   │       ├── HUD.tsx
│   │       ├── Crosshair.tsx
│   │       ├── Radar.tsx
│   │       ├── ScoreBoard.tsx
│   │       └── GameOverlay.tsx   # title, pause, game over
│   └── hooks/
│       ├── useGameLoop.ts        # fixed timestep 60Hz
│       └── useKeyboard.ts
├── docs/                         # this folder
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
└── README.md
```

---

## Phase 0 — Project scaffold

**Prompt goal:** Empty runnable app with black fullscreen canvas.

### Tasks
1. `pnpm create vite . --template react-ts`
2. Add Tailwind, R3F, drei, three, zustand
3. `GameCanvas.tsx` with `<Canvas>` fullscreen, `<color attach="background" args={['#000']} />`
4. `vercel.json` + README with deploy button

### Acceptance
- [ ] `pnpm dev` shows black 3D canvas
- [ ] `pnpm build` succeeds
- [ ] No TypeScript errors

---

## Phase 1 — Starfield & cockpit shell

**Spec refs:** GAME_SPEC §5, §9

### Tasks
1. Add inverted sphere starfield (`<Stars />` from drei or custom shader)
2. Place placeholder cockpit: box geometry dashboard + `<PerspectiveCamera makeDefault />` parented to ship group
3. Subtle interior point lights
4. Load HDR environment (optional) for metal reflections

### Acceptance
- [ ] First-person view from inside simple cockpit
- [ ] Stars visible through "window"
- [ ] 60 FPS

---

## Phase 2 — Ship movement & wrap

**Spec refs:** GAME_SPEC §3, §4

### Tasks
1. `input.ts` + `useKeyboard.ts` — map keys per spec
2. Ship velocity, thrust (Alt), rotation (arrows)
3. `math.wrapPosition()` on 400³ volume
4. `useGameLoop` fixed timestep

### Acceptance
- [ ] Thrust + inertia feels arcade-like
- [ ] Ship wraps at boundaries
- [ ] Arrow keys rotate view smoothly

---

## Phase 3 — Asteroids & collision

**Spec refs:** GAME_SPEC §4, §8

### Tasks
1. `types.ts` — `AsteroidSize`, `Asteroid`, `Laser`
2. Spawn wave per table in `waves.ts`
3. `Asteroid.tsx` — icosphere, random scale/rotation, drift velocity
4. `collision.ts` — laser↔asteroid, ship↔asteroid
5. Split logic: large→2 med, med→2 small

### Acceptance
- [ ] 4 large asteroids wave 1
- [ ] Collisions split/destroy correctly
- [ ] Ship death removes 1 life, respawn with invuln

---

## Phase 4 — Weapons & scoring

**Spec refs:** GAME_SPEC §3, §8

### Tasks
1. `LaserBolt.tsx` — pool max 4, fire on Space toward crosshair
2. Score increments per spec (20/50/100)
3. `gameStore` — lives, score, wave advance when all asteroids cleared
4. Bonus ship at 10,000 points

### Acceptance
- [ ] Fire rate limit works
- [ ] Score + lives + wave UI correct
- [ ] Extra life at 10k

---

## Phase 5 — HUD, crosshair, radar

**Spec refs:** GAME_SPEC §6, §11

### Tasks
1. `Crosshair.tsx` — fixed center SVG
2. `ScoreBoard.tsx`, lives icons, shield pips
3. `Radar.tsx` — ship-local blips from asteroid positions
4. CRT styling on radar (CSS)

### Acceptance
- [ ] Radar matches asteroid directions
- [ ] HUD readable over bright starfield

---

## Phase 6 — Shields & hyperspace

**Spec refs:** GAME_SPEC §7

### Tasks
1. Shield bubble shader on Z; 3 charges per life
2. Hyperspace random teleport + cooldown + VFX
3. 1% death risk on hyperspace

### Acceptance
- [ ] Shield blocks one hit per charge
- [ ] Hyperspace relocates ship; cooldown enforced

---

## Phase 7 — Graphics polish

**Spec refs:** GAME_SPEC §9

### Tasks
1. Replace placeholder cockpit with `cockpit.glb`
2. Asteroid normal/roughness maps
3. `Effects.tsx` — bloom, vignette, tone mapping
4. Explosion particles on destroy
5. Thrust particles rear-facing
6. Glass canopy with transmission

### Acceptance
- [ ] Visually "indie premium" — emissive lasers bloom, PBR cockpit
- [ ] Still ≥ 55 FPS on target hardware

---

## Phase 8 — Audio & game flow

**Spec refs:** GAME_SPEC §10, §12

### Tasks
1. Howler integration — SFX map
2. Thrust loop modulated by thrust input
3. Title / Pause / Game Over overlays
4. Enter to start/restart

### Acceptance
- [ ] Full loop: title → play → game over → restart
- [ ] Escape pauses

---

## Phase 9 — Deploy & QA

### Tasks
1. `pnpm build` → deploy `dist` to Vercel
2. Test Chrome, Firefox, Safari
3. Compress assets (glb, audio)
4. README: controls + play URL

### Acceptance
- [ ] Production URL loads & plays
- [ ] No console errors
- [ ] Lighthouse performance ≥ 70

---

## Phase 10 (optional) — UFOs & difficulty

**Spec refs:** Original Asteroids UFO behavior

- Spawn UFO after wave 3
- Simple AI: erratic movement, occasional shots
- Distinct radar blip + sound

---

## Testing checklist (manual)

| Test | Expected |
|------|----------|
| Fire at large asteroid | Splits to 2 medium, +20 score |
| Fly into asteroid unshielded | Lose life |
| Shield then hit | Charge -1, no life lost |
| Clear wave | Next wave more asteroids |
| 10,000 points | Extra life |
| Hyperspace on cooldown | Ignored |
| Wrap through edge | Exit opposite side |

---

## Risk mitigations for Qwen3-coder

| Risk | Mitigation |
|------|------------|
| R3F learning curve | Start with drei `Stars`, `useFrame` examples only |
| Scope creep | Stick to phase boundaries |
| Perf regression | InstancedMesh for asteroids if count > 20 |
| Large GLB | Keep cockpit < 5 MB; use Draco |
| Vercel 404 on refresh | `vercel.json` SPA rewrite |
