import * as THREE from "three";

export type Platform = {
  pos: [number, number, number]; // CENTER position
  size: [number, number, number];
  color: string;
  /** moves on X axis between [pos.x - amp, pos.x + amp] over `period` seconds */
  moveX?: { amp: number; period: number };
  /** moves on Z axis */
  moveZ?: { amp: number; period: number };
  /** moves vertically */
  moveY?: { amp: number; period: number };
  checkpoint?: boolean;
  finish?: boolean;
  killer?: boolean; // lava / spikes
  rotateY?: number; // rad/sec
};

/** Compute the current world-space position of a (possibly moving) platform. */
export function platformWorldPos(p: Platform, time: number): THREE.Vector3 {
  const v = new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]);
  if (p.moveX) v.x += Math.sin((time / p.moveX.period) * Math.PI * 2) * p.moveX.amp;
  if (p.moveZ) v.z += Math.sin((time / p.moveZ.period) * Math.PI * 2) * p.moveZ.amp;
  if (p.moveY) v.y += Math.sin((time / p.moveY.period) * Math.PI * 2) * p.moveY.amp;
  return v;
}

const PLAYER_RADIUS = 0.45;
const FOOT_OFFSET = 1.0; // player.pos.y === feet + 1

export type PlatformHit = {
  /** the platform the player is currently standing on */
  standing: Platform | null;
  /** target ground level for player feet */
  groundY: number;
};

/**
 * Check which platform the player is standing on. Returns the highest one
 * whose footprint contains the player and whose top is just below feet.
 */
export function platformGround(
  pos: THREE.Vector3,
  velY: number,
  platforms: Platform[],
  time: number,
): PlatformHit {
  let best: { plat: Platform; top: number } | null = null;
  for (const p of platforms) {
    const wp = platformWorldPos(p, time);
    const halfX = p.size[0] / 2 + PLAYER_RADIUS * 0.5;
    const halfZ = p.size[2] / 2 + PLAYER_RADIUS * 0.5;
    const dx = pos.x - wp.x;
    const dz = pos.z - wp.z;
    if (Math.abs(dx) > halfX || Math.abs(dz) > halfZ) continue;
    const top = wp.y + p.size[1] / 2;
    const playerFeet = pos.y - FOOT_OFFSET;
    // Allow snapping when descending or close to top
    if (playerFeet >= top - 0.4 && playerFeet <= top + 0.6 && velY <= 0.5) {
      if (!best || top > best.top) best = { plat: p, top };
    }
  }
  if (best) return { standing: best.plat, groundY: best.top + FOOT_OFFSET };
  return { standing: null, groundY: -50 };
}

/** Tower of Hell — vertical climb with rings of platforms going up */
export function buildTowerCourse(): Platform[] {
  const out: Platform[] = [];
  // start pad
  out.push({ pos: [0, 0, 0], size: [10, 0.5, 10], color: "#0e7490" });
  out.push({ pos: [0, 0.4, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });

  let y = 1.5;
  const ring = (r: number, count: number, color: string, dy = 1.6) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      out.push({
        pos: [Math.cos(a) * r, y, Math.sin(a) * r],
        size: [1.6, 0.3, 1.6],
        color,
      });
    }
    y += dy;
  };

  // first 3 levels easy
  ring(3.5, 6, "#10b981");
  ring(4.0, 6, "#10b981");
  ring(3.5, 5, "#22c55e");

  // checkpoint
  out.push({ pos: [0, y, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });
  y += 1.8;

  // moving ring
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    out.push({
      pos: [Math.cos(a) * 4, y, Math.sin(a) * 4],
      size: [1.4, 0.3, 1.4],
      color: "#f59e0b",
      moveY: { amp: 0.6, period: 2.5 + i * 0.3 },
    });
  }
  y += 2.0;

  // narrow planks
  ring(3.0, 4, "#fbbf24", 1.4);
  ring(3.5, 4, "#fbbf24", 1.4);

  // killer ring (lava strips around safe spots)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    out.push({
      pos: [Math.cos(a) * 4.5, y - 0.3, Math.sin(a) * 4.5],
      size: [1.3, 0.4, 1.3],
      color: "#dc2626",
      killer: true,
    });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    out.push({
      pos: [Math.cos(a) * 3.0, y, Math.sin(a) * 3.0],
      size: [1.2, 0.3, 1.2],
      color: "#16a34a",
    });
  }
  y += 1.8;

  // checkpoint 3
  out.push({ pos: [0, y, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });
  y += 1.8;

  // spinning bridge of small steps
  for (let i = 0; i < 8; i++) {
    out.push({
      pos: [(i - 4) * 1.2, y, 0],
      size: [0.9, 0.3, 0.9],
      color: "#7c3aed",
      moveY: { amp: 0.4, period: 1.8 + i * 0.2 },
    });
  }
  y += 2.0;

  // final climb
  for (let i = 0; i < 5; i++) {
    out.push({
      pos: [Math.cos(i * 1.3) * 2.5, y + i * 1.2, Math.sin(i * 1.3) * 2.5],
      size: [1.6, 0.3, 1.6],
      color: "#ec4899",
    });
  }
  y += 6.5;

  // finish
  out.push({ pos: [0, y, 0], size: [4, 0.4, 4], color: "#fde047", finish: true });

  return out;
}

/** Lava Escape — dim, fiery dungeon with shrinking platforms over a sea of lava */
export function buildLavaCourse(): Platform[] {
  const out: Platform[] = [];
  // Massive lava floor (kills on contact)
  out.push({ pos: [0, -0.6, -40], size: [60, 0.4, 120], color: "#dc2626", killer: true });

  // Start pad
  out.push({ pos: [0, 0, 0], size: [8, 0.5, 8], color: "#0e7490" });
  out.push({ pos: [0, 0.4, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });

  let z = -6;
  const step = 4;

  // Stepping stones
  for (let i = 0; i < 7; i++) {
    out.push({
      pos: [Math.sin(i * 1.1) * 2.5, 0, z],
      size: [1.8, 0.3, 1.8],
      color: "#7c2d12",
    });
    z -= step;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Pulsing piston platforms (move up/down through lava)
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [(i % 2 === 0 ? 1.8 : -1.8), 0, z],
      size: [1.6, 0.3, 1.6],
      color: "#f97316",
      moveY: { amp: 1.2, period: 1.6 + i * 0.25 },
    });
    z -= step - 0.5;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Fire walls (killer pillars to weave around)
  for (let i = 0; i < 5; i++) {
    out.push({ pos: [(i % 2 === 0 ? -1.8 : 1.8), 1.4, z - 1], size: [1.4, 3, 0.5], color: "#dc2626", killer: true });
    out.push({ pos: [(i % 2 === 0 ? 1.5 : -1.5), 0, z], size: [1.6, 0.3, 1.6], color: "#7c2d12" });
    z -= step;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Sliding bridge over lava
  for (let i = 0; i < 5; i++) {
    out.push({
      pos: [0, 0, z],
      size: [2, 0.3, 2],
      color: "#facc15",
      moveX: { amp: 4.5, period: 2 + i * 0.3 },
    });
    z -= step;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Final ascent — narrow steps climbing over a wall of fire
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [Math.cos(i * 0.7) * 2, i * 1.0, z - i * 1.5],
      size: [1.6, 0.3, 1.6],
      color: "#ec4899",
    });
  }

  out.push({ pos: [0, 6.2, z - 11], size: [5, 0.5, 5], color: "#fde047", finish: true });
  return out;
}

/** Ice Slide — slippery blue platforms drifting over an icy abyss */
export function buildIceCourse(): Platform[] {
  const out: Platform[] = [];
  // Icy floor far below (death plane)
  out.push({ pos: [0, -8, -40], size: [80, 0.4, 140], color: "#0c4a6e" });

  // Start pad
  out.push({ pos: [0, 0, 0], size: [8, 0.5, 8], color: "#0e7490" });
  out.push({ pos: [0, 0.4, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });

  let z = -6;
  const step = 4.5;

  // Wide drifting ice plates
  for (let i = 0; i < 5; i++) {
    out.push({
      pos: [(i % 2 === 0 ? -1 : 1) * 1.5, 0, z],
      size: [3.2, 0.3, 3.2],
      color: "#bae6fd",
      moveX: { amp: 2.5, period: 3 + i * 0.2 },
    });
    z -= step;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Falling icicle field — overhead killer spikes that bob downward
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [(i % 2 === 0 ? -1.5 : 1.5), 4, z],
      size: [0.6, 1.6, 0.6],
      color: "#dc2626",
      killer: true,
      moveY: { amp: 2.5, period: 1.4 + i * 0.15 },
    });
    out.push({ pos: [0, 0, z], size: [2.4, 0.3, 2.4], color: "#e0f2fe" });
    z -= step - 0.5;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Spinning ring of small ice slabs (move on Z so timing matters)
  for (let i = 0; i < 8; i++) {
    out.push({
      pos: [(i - 3.5) * 1.4, 0, z],
      size: [1.2, 0.3, 1.2],
      color: "#7dd3fc",
      moveY: { amp: 0.5, period: 1.2 + (i % 3) * 0.4 },
    });
  }
  z -= step + 1;

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Slippery slalom — narrow walks with killer crevasses between
  for (let i = 0; i < 5; i++) {
    out.push({ pos: [0, -0.2, z], size: [4, 0.3, 1], color: "#dc2626", killer: true });
    out.push({ pos: [(i % 2 === 0 ? 1.6 : -1.6), 0, z + 0.5], size: [1.4, 0.3, 1.4], color: "#bae6fd" });
    out.push({ pos: [(i % 2 === 0 ? -1.6 : 1.6), 0, z - 0.5], size: [1.4, 0.3, 1.4], color: "#bae6fd" });
    z -= step;
  }

  out.push({ pos: [0, 0, z], size: [3.4, 0.4, 3.4], color: "#22d3ee", checkpoint: true });
  z -= step;

  // Final ascent — staircase of glowing crystals
  for (let i = 0; i < 8; i++) {
    out.push({
      pos: [(i % 2 === 0 ? 1 : -1) * 0.8, i * 0.9, z - i * 1.3],
      size: [1.8, 0.3, 1.8],
      color: "#a5f3fc",
    });
  }

  out.push({ pos: [0, 7.5, z - 12], size: [5, 0.5, 5], color: "#fde047", finish: true });
  return out;
}

/** Speed Run — long horizontal sprint with gaps & moving platforms */
export function buildSpeedCourse(): Platform[] {
  const out: Platform[] = [];
  // start
  out.push({ pos: [0, 0, 0], size: [6, 0.5, 6], color: "#0e7490" });
  out.push({ pos: [0, 0.4, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });

  let z = -5;
  const step = 4;

  // wide platforms with simple gaps
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [(i % 2 === 0 ? 1 : -1) * 0.8, 0, z],
      size: [3, 0.4, 3],
      color: "#22c55e",
    });
    z -= step;
  }

  // checkpoint
  out.push({ pos: [0, 0, z], size: [3.2, 0.4, 3.2], color: "#22d3ee", checkpoint: true });
  z -= step;

  // sliding platforms
  for (let i = 0; i < 5; i++) {
    out.push({
      pos: [0, 0, z],
      size: [2.2, 0.3, 2.2],
      color: "#f59e0b",
      moveX: { amp: 3, period: 2.4 + i * 0.4 },
    });
    z -= step + 0.5;
  }

  // checkpoint
  out.push({ pos: [0, 0, z], size: [3.2, 0.4, 3.2], color: "#22d3ee", checkpoint: true });
  z -= step;

  // narrow planks zigzag
  for (let i = 0; i < 8; i++) {
    out.push({
      pos: [(i % 2 === 0 ? 1.6 : -1.6), 0, z],
      size: [1.4, 0.3, 1.4],
      color: "#fbbf24",
    });
    z -= step - 0.5;
  }

  // checkpoint
  out.push({ pos: [0, 0, z], size: [3.2, 0.4, 3.2], color: "#22d3ee", checkpoint: true });
  z -= step;

  // killer lava strips with floating safe pads
  for (let i = 0; i < 6; i++) {
    out.push({ pos: [0, -0.1, z], size: [4, 0.3, 2.5], color: "#dc2626", killer: true });
    out.push({
      pos: [0, 0.2, z],
      size: [1.6, 0.3, 1.6],
      color: "#7c3aed",
      moveY: { amp: 0.4, period: 1.6 + i * 0.2 },
    });
    z -= step;
  }

  // checkpoint
  out.push({ pos: [0, 0, z], size: [3.2, 0.4, 3.2], color: "#22d3ee", checkpoint: true });
  z -= step;

  // jump pads of varying height
  for (let i = 0; i < 6; i++) {
    out.push({ pos: [(i - 2.5) * 1.6, i * 0.7, z], size: [1.4, 0.3, 1.4], color: "#ec4899" });
  }
  z -= step + 1;

  // finish
  out.push({ pos: [0, 0, z], size: [5, 0.5, 5], color: "#fde047", finish: true });

  return out;
}
