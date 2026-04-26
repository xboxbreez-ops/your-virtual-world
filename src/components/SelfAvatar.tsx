import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import type { AvatarConfig } from "@/lib/auth-context";

/**
 * Renders the player's own avatar in the world. Visible only when the player
 * has toggled third-person zoom-out (V key / R3 click). Reads position + yaw
 * from a refs object and the zoom flag from the input ref.
 */
export function SelfAvatar({
  posRef,
  inputRef,
  config,
}: {
  posRef: RefObject<{ pos: THREE.Vector3; yaw: number }>;
  inputRef: RefObject<{ zoomOut: boolean }>;
  config: AvatarConfig;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = posRef.current;
    const inp = inputRef.current;
    if (!p || !groupRef.current) return;
    groupRef.current.position.copy(p.pos);
    groupRef.current.rotation.y = p.yaw + Math.PI;
    groupRef.current.visible = !!inp?.zoomOut;
  });

  return (
    <group ref={groupRef}>
      <BlockyAvatar config={config} walking />
    </group>
  );
}
