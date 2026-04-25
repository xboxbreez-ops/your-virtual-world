import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { AvatarConfig } from "@/lib/auth-context";

// Hat catalog
export const HATS = ["none", "cap", "crown", "tophat", "horns", "halo"] as const;
export const FACES = ["smile", "cool", "angry", "happy", "wink"] as const;

function Face({ kind }: { kind: string }) {
  // eyes + mouth as small dark planes on the front of head
  const eyeY = 0.08;
  const mouthY = -0.12;
  return (
    <group position={[0, 0, 0.41]}>
      {/* eyes */}
      {kind === "wink" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.12, 0.03]} /><meshBasicMaterial color="#111" /></mesh>
        </>
      ) : kind === "cool" ? (
        <mesh position={[0, eyeY, 0]}><planeGeometry args={[0.55, 0.13]} /><meshBasicMaterial color="#111" /></mesh>
      ) : (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
        </>
      )}
      {/* mouth */}
      {kind === "angry" ? (
        <mesh position={[0, mouthY, 0]} rotation={[0, 0, Math.PI]}><planeGeometry args={[0.3, 0.05]} /><meshBasicMaterial color="#111" /></mesh>
      ) : kind === "happy" ? (
        <mesh position={[0, mouthY, 0]}><planeGeometry args={[0.4, 0.12]} /><meshBasicMaterial color="#111" /></mesh>
      ) : (
        <mesh position={[0, mouthY, 0]}><planeGeometry args={[0.3, 0.05]} /><meshBasicMaterial color="#111" /></mesh>
      )}
    </group>
  );
}

function Hat({ kind }: { kind: string }) {
  if (kind === "none") return null;
  if (kind === "cap")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.95, 0.2, 0.95]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, 0, 0.55]}><boxGeometry args={[0.9, 0.05, 0.35]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "crown")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh><boxGeometry args={[0.9, 0.2, 0.9]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} /></mesh>
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.18, 0]}><boxGeometry args={[0.15, 0.18, 0.15]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} /></mesh>
        ))}
      </group>
    );
  if (kind === "tophat")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh><boxGeometry args={[1.05, 0.05, 1.05]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
    );
  if (kind === "horns")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh position={[-0.25, 0.15, 0]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.12, 0.4, 4]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[0.25, 0.15, 0]} rotation={[0, 0, 0.3]}><coneGeometry args={[0.12, 0.4, 4]} /><meshStandardMaterial color="#7c2d12" /></mesh>
      </group>
    );
  if (kind === "halo")
    return (
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.05, 8, 24]} />
        <meshStandardMaterial color="#fde047" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>
    );
  return null;
}

type Props = {
  config: AvatarConfig;
  position?: [number, number, number];
  walking?: boolean;
};

/**
 * Blocky Roblox-style avatar.
 * R6: 6 limbs (head, torso, 2 arms, 2 legs)
 * R15: 15 parts — arms split into upper/lower/hand, legs split into upper/lower/foot
 */
export function BlockyAvatar({ config, position = [0, 0, 0], walking = false }: Props) {
  const group = useRef<Group>(null);
  const lArm = useRef<Mesh | Group>(null);
  const rArm = useRef<Mesh | Group>(null);
  const lLeg = useRef<Mesh | Group>(null);
  const rLeg = useRef<Mesh | Group>(null);

  useFrame((_s, dt) => {
    if (!group.current) return;
    const t = (group.current.userData.t = (group.current.userData.t ?? 0) + dt * (walking ? 8 : 1.5));
    const swing = walking ? Math.sin(t) * 0.6 : Math.sin(t * 0.5) * 0.05;
    if (lArm.current) lArm.current.rotation.x = swing;
    if (rArm.current) rArm.current.rotation.x = -swing;
    if (lLeg.current) lLeg.current.rotation.x = -swing;
    if (rLeg.current) rLeg.current.rotation.x = swing;
  });

  const skin = config.skin_color;
  const shirt = config.shirt_color;
  const pants = config.pants_color;

  // Common pieces ------------------------------------------
  const Head = (
    <group position={[0, 2.6, 0]}>
      <mesh castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color={skin} /></mesh>
      <Face kind={config.face} />
      <Hat kind={config.hat} />
    </group>
  );

  if (config.rig === "R6") {
    return (
      <group ref={group} position={position}>
        {Head}
        {/* torso */}
        <mesh position={[0, 1.6, 0]} castShadow><boxGeometry args={[1.2, 1.2, 0.6]} /><meshStandardMaterial color={shirt} /></mesh>
        {/* arms */}
        <group ref={lArm as React.RefObject<Group>} position={[-0.8, 2.1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.4, 1.2, 0.4]} /><meshStandardMaterial color={shirt} /></mesh>
        </group>
        <group ref={rArm as React.RefObject<Group>} position={[0.8, 2.1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.4, 1.2, 0.4]} /><meshStandardMaterial color={shirt} /></mesh>
        </group>
        {/* legs */}
        <group ref={lLeg as React.RefObject<Group>} position={[-0.3, 1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.5, 1.2, 0.5]} /><meshStandardMaterial color={pants} /></mesh>
        </group>
        <group ref={rLeg as React.RefObject<Group>} position={[0.3, 1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.5, 1.2, 0.5]} /><meshStandardMaterial color={pants} /></mesh>
        </group>
      </group>
    );
  }

  // R15: more articulated — split arms/legs into upper/lower/hand|foot
  return (
    <group ref={group} position={position}>
      {Head}
      {/* torso (upper + lower) */}
      <mesh position={[0, 2.0, 0]} castShadow><boxGeometry args={[1.1, 0.7, 0.55]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.0, 0.55, 0.5]} /><meshStandardMaterial color={shirt} /></mesh>
      {/* left arm */}
      <group ref={lArm as React.RefObject<Group>} position={[-0.75, 2.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.35, 0.6, 0.35]} /><meshStandardMaterial color={shirt} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.32, 0.55, 0.32]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -1.3, 0]} castShadow><boxGeometry args={[0.36, 0.25, 0.36]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* right arm */}
      <group ref={rArm as React.RefObject<Group>} position={[0.75, 2.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.35, 0.6, 0.35]} /><meshStandardMaterial color={shirt} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.32, 0.55, 0.32]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -1.3, 0]} castShadow><boxGeometry args={[0.36, 0.25, 0.36]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* left leg */}
      <group ref={lLeg as React.RefObject<Group>} position={[-0.27, 1.1, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.45, 0.6, 0.45]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.42, 0.55, 0.42]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -1.3, 0.05]} castShadow><boxGeometry args={[0.46, 0.25, 0.55]} /><meshStandardMaterial color="#1f1f1f" /></mesh>
      </group>
      {/* right leg */}
      <group ref={rLeg as React.RefObject<Group>} position={[0.27, 1.1, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.45, 0.6, 0.45]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.42, 0.55, 0.42]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -1.3, 0.05]} castShadow><boxGeometry args={[0.46, 0.25, 0.55]} /><meshStandardMaterial color="#1f1f1f" /></mesh>
      </group>
    </group>
  );
}
