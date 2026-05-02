import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import type { AvatarConfig } from "@/lib/auth-context";

type Anim = "idle" | "walk" | "jump" | "shoot";

/**
 * Renders the player's own avatar in the world. Visible only when the player
 * has toggled third-person zoom-out (V key / R3 click).
 *
 * IMPORTANT: gameplay code stores `pos.y = feet + 1` (see src/lib/collision.ts
 * FOOT_OFFSET). The BlockyAvatar's root is at the avatar's feet level, so we
 * subtract 1 here to keep the model planted on the ground (no levitation).
 */
export function SelfAvatar({
  posRef,
  inputRef,
  config,
}: {
  posRef: RefObject<{ pos: THREE.Vector3; yaw: number; anim?: Anim }>;
  inputRef: RefObject<{ zoomOut: boolean }>;
  config: AvatarConfig;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const animRef = useRef<Anim>("idle");

  useFrame(() => {
    const p = posRef.current;
    const inp = inputRef.current;
    if (!p || !groupRef.current) return;
    groupRef.current.position.set(p.pos.x, p.pos.y - 1, p.pos.z);
    groupRef.current.rotation.y = p.yaw + Math.PI;
    groupRef.current.visible = !!inp?.zoomOut;
    animRef.current = p.anim ?? "idle";
  });

  return (
    <group ref={groupRef}>
      <BlockyAvatar config={config} anim={animRef.current} />
    </group>
  );
}
