import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import type { AvatarConfig } from "@/lib/auth-context";

/**
 * Renders the player's own avatar in the world, only visible when the
 * player has toggled third-person zoom-out (V key / R3 click). Reads the
 * live player position + yaw from a refs object every frame.
 */
export function SelfAvatar({
  refs,
  config,
}: {
  // refs.current must contain a `player` with pos: Vector3, yaw: number, zoomOut tracking happens externally
  refs: RefObject<{ player: { pos: THREE.Vector3; yaw: number; vel?: THREE.Vector3 } } & { zoomOut?: boolean }>;
  config: AvatarConfig;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const r = refs.current;
    if (!r || !groupRef.current) return;
    groupRef.current.position.copy(r.player.pos);
    groupRef.current.rotation.y = r.player.yaw + Math.PI;
    // Visible only when zoomed-out so first-person doesn't show our own head
    groupRef.current.visible = !!r.zoomOut;
  });

  return (
    <group ref={groupRef}>
      <BlockyAvatar config={config} walking />
    </group>
  );
}
