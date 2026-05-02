import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import type { RemotePlayer } from "@/lib/multiplayer";

/**
 * Renders every other real player in the room. Avatars smoothly lerp toward
 * their last reported position so 10Hz updates feel fluid.
 */
export function RemotePlayers({
  playersRef,
  version,
}: {
  playersRef: RefObject<Map<string, RemotePlayer>>;
  version: number;
}) {
  // Snapshot the player list whenever someone joins/leaves (version changes).
  const list = useMemo(() => {
    const m = playersRef.current;
    return m ? Array.from(m.values()) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, playersRef]);

  return (
    <>
      {list.map((p) => (
        <RemoteAvatar key={p.user_id} userId={p.user_id} playersRef={playersRef} />
      ))}
    </>
  );
}

function RemoteAvatar({
  userId,
  playersRef,
}: {
  userId: string;
  playersRef: RefObject<Map<string, RemotePlayer>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lerpPos = useRef(new THREE.Vector3());
  const lerpYaw = useRef(0);
  const initialized = useRef(false);
  const walkingRef = useRef(false);
  const lastPos = useRef(new THREE.Vector3());

  useFrame((_s, dt) => {
    const p = playersRef.current?.get(userId);
    const g = groupRef.current;
    if (!p || !g) {
      if (g) g.visible = false;
      return;
    }
    g.visible = p.hp > 0;

    const target = new THREE.Vector3(p.px, p.py - 1, p.pz); // BlockyAvatar root sits at feet
    if (!initialized.current) {
      lerpPos.current.copy(target);
      lerpYaw.current = p.yaw;
      lastPos.current.copy(target);
      initialized.current = true;
    } else {
      const k = Math.min(1, dt * 12);
      lerpPos.current.lerp(target, k);
      // Yaw shortest-arc interp
      let dy = p.yaw - lerpYaw.current;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      lerpYaw.current += dy * k;
    }
    g.position.copy(lerpPos.current);
    g.rotation.y = lerpYaw.current + Math.PI;

    const moved = lerpPos.current.distanceTo(lastPos.current);
    walkingRef.current = moved > 0.005;
    lastPos.current.copy(lerpPos.current);
  });

  const player = playersRef.current?.get(userId);
  if (!player) return null;

  return (
    <group ref={groupRef}>
      <BlockyAvatar
        config={
          player.avatar ?? {
            rig: "R15",
            skin_color: "#f5c896",
            shirt_color: "#64748b",
            pants_color: "#1f2937",
            face: "smile",
            hat: "none",
            hair: "none",
            shoes: "sneakers",
            jacket: "none",
          }
        }
        anim={
          player.anim === "jump"
            ? "jump"
            : player.anim === "shoot"
              ? "shoot"
              : (walkingRef.current || player.anim === "walk")
                ? "walk"
                : "idle"
        }
      />
      {/* Floating name tag — counter-rotated so it always faces upright */}
      <group position={[0, 3.0, 0]} rotation={[0, -lerpYaw.current - Math.PI, 0]}>
        <Text
          fontSize={0.32}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0b1020"
        >
          @{player.username}
        </Text>
      </group>
    </group>
  );
}
