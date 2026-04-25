import * as THREE from "three";

export type AABB = {
  // Center on top of ground (so y range = [groundY, groundY + size.y])
  pos: [number, number, number];
  size: [number, number, number];
};

const PLAYER_RADIUS = 0.4;
const PLAYER_HEIGHT = 1.8;
const FOOT_OFFSET = 1.0; // player.pos.y is feet+1 in our scenes

/**
 * Resolve player horizontal collision against axis-aligned boxes.
 * Mutates `pos` in place. Boxes are treated as solid walls — players
 * cannot enter from the sides AND cannot stand on top (no climbing).
 *
 * Returns true if any collision was resolved.
 */
export function resolveBoxCollisions(pos: THREE.Vector3, boxes: AABB[]): boolean {
  let hit = false;
  for (const b of boxes) {
    const halfX = b.size[0] / 2 + PLAYER_RADIUS;
    const halfZ = b.size[2] / 2 + PLAYER_RADIUS;
    // Box vertical extent in world space — player stands at pos.y (= feet + 1)
    // Box bottom = b.pos[1] - size.y/2, top = b.pos[1] + size.y/2
    const boxBottom = b.pos[1] - b.size[1] / 2;
    const boxTop = b.pos[1] + b.size[1] / 2;
    const playerBottom = pos.y - FOOT_OFFSET;
    const playerTop = playerBottom + PLAYER_HEIGHT;
    // No overlap vertically? Skip.
    if (playerTop < boxBottom || playerBottom > boxTop) continue;

    const dx = pos.x - b.pos[0];
    const dz = pos.z - b.pos[2];
    if (Math.abs(dx) < halfX && Math.abs(dz) < halfZ) {
      // Push out along the shorter axis
      const overlapX = halfX - Math.abs(dx);
      const overlapZ = halfZ - Math.abs(dz);
      if (overlapX < overlapZ) {
        pos.x = b.pos[0] + Math.sign(dx || 1) * halfX;
      } else {
        pos.z = b.pos[2] + Math.sign(dz || 1) * halfZ;
      }
      hit = true;
    }
  }
  return hit;
}

/**
 * Returns true if the player feet are inside an AABB footprint
 * (used for shelter checks). Vertical is ignored.
 */
export function insideFootprint(pos: THREE.Vector3, b: AABB): boolean {
  return Math.abs(pos.x - b.pos[0]) < b.size[0] / 2 && Math.abs(pos.z - b.pos[2]) < b.size[2] / 2;
}
