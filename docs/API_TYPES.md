# Core TypeScript Interfaces

Copy into `src/game/types.ts` during Phase 0/3. Qwen3-coder should not deviate without updating this doc.

```ts
import type { Vector3Tuple } from 'three';

export type GameState = 'title' | 'playing' | 'paused' | 'game_over';

export type AsteroidSize = 'large' | 'medium' | 'small';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShipState {
  position: Vec3;
  velocity: Vec3;
  rotation: Vec3; // euler radians: pitch, yaw, roll
  invulnerableUntil: number; // timestamp ms
  shieldCharges: number;
  shieldActiveUntil: number;
  hyperspaceCooldownUntil: number;
}

export interface AsteroidState {
  id: string;
  size: AsteroidSize;
  position: Vec3;
  velocity: Vec3;
  rotation: Vec3;
  angularVelocity: Vec3;
  radius: number;
}

export interface LaserState {
  id: string;
  position: Vec3;
  velocity: Vec3;
  spawnedAt: number;
}

export interface GameStore {
  gameState: GameState;
  score: number;
  lives: number;
  wave: number;
  ship: ShipState;
  asteroids: AsteroidState[];
  lasers: LaserState[];
  explosions: { id: string; position: Vec3; startedAt: number }[];

  // actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  advanceWave: () => void;
  setShip: (partial: Partial<ShipState>) => void;
  setAsteroids: (asteroids: AsteroidState[]) => void;
  addLaser: (laser: LaserState) => void;
  removeLaser: (id: string) => void;
  spawnExplosion: (position: Vec3) => void;
}

export const ASTEROID_RADIUS: Record<AsteroidSize, number> = {
  large: 8,
  medium: 4,
  small: 2,
};

export const ASTEROID_POINTS: Record<AsteroidSize, number> = {
  large: 20,
  medium: 50,
  small: 100,
};

export const PLAY_VOLUME = {
  min: -200,
  max: 200,
  size: 400,
} as const;
```

---

## Zustand store skeleton

```ts
import { create } from 'zustand';
import type { GameStore } from '../game/types';

const initialShip = (): GameStore['ship'] => ({
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  invulnerableUntil: 0,
  shieldCharges: 3,
  shieldActiveUntil: 0,
  hyperspaceCooldownUntil: 0,
});

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'title',
  score: 0,
  lives: 3,
  wave: 1,
  ship: initialShip(),
  asteroids: [],
  lasers: [],
  explosions: [],

  startGame: () =>
    set({
      gameState: 'playing',
      score: 0,
      lives: 3,
      wave: 1,
      ship: initialShip(),
      asteroids: [],
      lasers: [],
      explosions: [],
    }),

  pauseGame: () => set({ gameState: 'paused' }),
  resumeGame: () => set({ gameState: 'playing' }),
  gameOver: () => set({ gameState: 'game_over' }),

  addScore: (points) => {
    const next = get().score + points;
    const bonusLives = Math.floor(next / 10000) - Math.floor(get().score / 10000);
    set({
      score: next,
      lives: bonusLives > 0 ? get().lives + bonusLives : get().lives,
    });
  },

  loseLife: () => {
    const lives = get().lives - 1;
    if (lives <= 0) {
      set({ lives: 0, gameState: 'game_over' });
    } else {
      set({
        lives,
        ship: { ...initialShip(), invulnerableUntil: Date.now() + 3000 },
      });
    }
  },

  advanceWave: () => set((s) => ({ wave: s.wave + 1 })),
  setShip: (partial) => set((s) => ({ ship: { ...s.ship, ...partial } })),
  setAsteroids: (asteroids) => set({ asteroids }),
  addLaser: (laser) =>
    set((s) => ({ lasers: [...s.lasers, laser].slice(-4) })),
  removeLaser: (id) =>
    set((s) => ({ lasers: s.lasers.filter((l) => l.id !== id) })),
  spawnExplosion: (position) =>
    set((s) => ({
      explosions: [
        ...s.explosions,
        { id: crypto.randomUUID(), position, startedAt: Date.now() },
      ],
    })),
}));
```
