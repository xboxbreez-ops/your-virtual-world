import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { AvatarConfig } from "@/lib/auth-context";

// Hat catalog
export const HATS = ["none", "cap", "beanie", "horns", "headphones", "tophat", "cowboy", "wizard", "halo", "antlers", "crown", "fire"] as const;
export const FACES = ["smile", "happy", "wink", "cool", "kawaii", "angry", "evil", "robot"] as const;
export const HAIRS = ["none", "buzz", "messy", "side", "ponytail", "pigtails", "bun", "spikes", "mohawk", "long", "afro", "fire"] as const;
export const SHOES = ["sneakers", "sandals", "crocs", "boots", "heels", "cleats", "skates", "platforms", "neonkicks", "rocketboots", "goldenkicks"] as const;
export const JACKETS = ["none", "vest", "hoodie", "denim", "varsity", "puffer", "trench", "leather", "armor", "cape", "wings"] as const;

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
      ) : kind === "kawaii" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.16]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.16]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[-0.22, eyeY + 0.04, 0.001]}><planeGeometry args={[0.04, 0.04]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[0.14, eyeY + 0.04, 0.001]}><planeGeometry args={[0.04, 0.04]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[-0.22, -0.05, 0]}><planeGeometry args={[0.08, 0.04]} /><meshBasicMaterial color="#fb7185" /></mesh>
          <mesh position={[0.22, -0.05, 0]}><planeGeometry args={[0.08, 0.04]} /><meshBasicMaterial color="#fb7185" /></mesh>
        </>
      ) : kind === "evil" ? (
        <>
          <mesh position={[-0.18, eyeY + 0.02, 0]} rotation={[0, 0, -0.4]}><planeGeometry args={[0.16, 0.06]} /><meshBasicMaterial color="#dc2626" /></mesh>
          <mesh position={[0.18, eyeY + 0.02, 0]} rotation={[0, 0, 0.4]}><planeGeometry args={[0.16, 0.06]} /><meshBasicMaterial color="#dc2626" /></mesh>
        </>
      ) : kind === "robot" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.14, 0.08]} /><meshBasicMaterial color="#22d3ee" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.14, 0.08]} /><meshBasicMaterial color="#22d3ee" /></mesh>
        </>
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
      ) : kind === "kawaii" ? (
        <mesh position={[0, mouthY, 0]}><planeGeometry args={[0.12, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
      ) : kind === "evil" ? (
        <mesh position={[0, mouthY, 0]}><planeGeometry args={[0.45, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
      ) : kind === "robot" ? (
        <>
          <mesh position={[-0.15, mouthY, 0]}><planeGeometry args={[0.08, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0, mouthY, 0]}><planeGeometry args={[0.08, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.15, mouthY, 0]}><planeGeometry args={[0.08, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
        </>
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
  if (kind === "beanie")
    return (
      <group position={[0, 0.5, 0]}>
        <mesh castShadow><boxGeometry args={[0.92, 0.32, 0.92]} /><meshStandardMaterial color="#0e7490" /></mesh>
        <mesh position={[0, 0.22, 0]} castShadow><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#fafafa" /></mesh>
      </group>
    );
  if (kind === "headphones")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.45, 0.06, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.46, -0.05, 0]} castShadow><boxGeometry args={[0.16, 0.28, 0.28]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0.46, -0.05, 0]} castShadow><boxGeometry args={[0.16, 0.28, 0.28]} /><meshStandardMaterial color="#dc2626" /></mesh>
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
  if (kind === "fire")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[0.9, 0.18, 0.9]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {[-0.3, 0, 0.3].map((x, i) => (
          <mesh key={x} position={[x, 0.35 + (i === 1 ? 0.1 : 0), 0]} castShadow>
            <coneGeometry args={[0.16, 0.55, 6]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.2} />
          </mesh>
        ))}
        <pointLight color="#f97316" intensity={1.5} distance={3} position={[0, 0.4, 0]} />
      </group>
    );
  if (kind === "tophat")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh><boxGeometry args={[1.05, 0.05, 1.05]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
    );
  if (kind === "cowboy")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[1.4, 0.06, 1.2]} /><meshStandardMaterial color="#78350f" /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.7, 0.5, 0.7]} /><meshStandardMaterial color="#78350f" /></mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0.15, 0, 0]} castShadow><boxGeometry args={[0.72, 0.04, 0.72]} /><meshStandardMaterial color="#78350f" /></mesh>
      </group>
    );
  if (kind === "wizard")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[1.0, 0.08, 1.0]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <coneGeometry args={[0.45, 1.1, 6]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  if (kind === "horns")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh position={[-0.25, 0.15, 0]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.12, 0.4, 4]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[0.25, 0.15, 0]} rotation={[0, 0, 0.3]}><coneGeometry args={[0.12, 0.4, 4]} /><meshStandardMaterial color="#7c2d12" /></mesh>
      </group>
    );
  if (kind === "antlers")
    return (
      <group position={[0, 0.55, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.25, 0.1, 0]} rotation={[0, 0, s * 0.2]}>
            <mesh castShadow><boxGeometry args={[0.06, 0.5, 0.06]} /><meshStandardMaterial color="#a16207" /></mesh>
            <mesh position={[s * 0.18, 0.18, 0]} rotation={[0, 0, s * 0.6]} castShadow><boxGeometry args={[0.06, 0.3, 0.06]} /><meshStandardMaterial color="#a16207" /></mesh>
            <mesh position={[s * -0.05, 0.3, 0]} rotation={[0, 0, s * -0.4]} castShadow><boxGeometry args={[0.06, 0.28, 0.06]} /><meshStandardMaterial color="#a16207" /></mesh>
          </group>
        ))}
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

function Hair({ kind }: { kind: string }) {
  if (kind === "none" || !kind) return null;
  if (kind === "buzz")
    return (
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.85, 0.18, 0.85]} />
        <meshStandardMaterial color="#3b2f1d" roughness={0.9} />
      </mesh>
    );
  if (kind === "messy")
    return (
      <group position={[0, 0.45, 0]}>
        <mesh castShadow><boxGeometry args={[0.9, 0.3, 0.9]} /><meshStandardMaterial color="#7c4a1e" roughness={0.9} /></mesh>
        <mesh position={[-0.25, 0.18, 0.2]} castShadow><boxGeometry args={[0.18, 0.18, 0.18]} /><meshStandardMaterial color="#7c4a1e" /></mesh>
        <mesh position={[0.2, 0.2, -0.1]} castShadow><boxGeometry args={[0.16, 0.22, 0.16]} /><meshStandardMaterial color="#7c4a1e" /></mesh>
      </group>
    );
  if (kind === "ponytail")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.22, 0.85]} /><meshStandardMaterial color="#fbbf24" /></mesh>
        <mesh position={[0, -0.15, -0.5]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>
    );
  if (kind === "mohawk")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.1, 0.85]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.2, 0.45, 0.85]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
      </group>
    );
  if (kind === "afro")
    return (
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.65, 12, 12]} />
        <meshStandardMaterial color="#1c1917" roughness={1} />
      </mesh>
    );
  if (kind === "bun")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.2, 0.85]} /><meshStandardMaterial color="#581c87" /></mesh>
        <mesh position={[0, 0.4, -0.05]} castShadow>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#581c87" />
        </mesh>
      </group>
    );
  return null;
}

function Shoe({ kind, color }: { kind: string; color?: string }) {
  // Renders a single shoe centered at origin (caller positions it on each foot).
  // `color` is used for the default sneaker; other shoes have their own palettes.
  if (kind === "boots")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.5, 0.3, 0.6]} /><meshStandardMaterial color="#3f1d12" /></mesh>
        <mesh position={[0, 0.18, -0.05]} castShadow><boxGeometry args={[0.46, 0.28, 0.46]} /><meshStandardMaterial color="#7c2d12" /></mesh>
      </group>
    );
  if (kind === "heels")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.42, 0.12, 0.6]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, -0.2, 0.22]} castShadow><boxGeometry args={[0.08, 0.3, 0.08]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "sandals")
    return (
      <mesh castShadow><boxGeometry args={[0.5, 0.1, 0.65]} /><meshStandardMaterial color="#a16207" /></mesh>
    );
  if (kind === "skates")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.46, 0.25, 0.6]} /><meshStandardMaterial color="#fafafa" /></mesh>
        <mesh position={[-0.15, -0.2, 0.18]} castShadow><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0.15, -0.2, 0.18]} castShadow><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[-0.15, -0.2, -0.18]} castShadow><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0.15, -0.2, -0.18]} castShadow><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
    );
  if (kind === "rocketboots")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.5, 0.32, 0.62]} /><meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, -0.22, -0.18]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 0.18, 8]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  // sneakers (default)
  return (
    <mesh castShadow>
      <boxGeometry args={[0.5, 0.22, 0.62]} />
      <meshStandardMaterial color={color ?? "#1f1f1f"} />
    </mesh>
  );
}

function Jacket({ kind, baseColor }: { kind: string; baseColor: string }) {
  // 3D outerwear that wraps the torso. Rendered slightly larger than the torso so it visibly layers on top.
  if (kind === "none" || !kind) return null;
  if (kind === "hoodie")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.32, 1.35, 0.72]} /><meshStandardMaterial color="#374151" /></mesh>
        {/* Hood at back of neck */}
        <mesh position={[0, 2.45, -0.2]} castShadow><boxGeometry args={[0.95, 0.55, 0.45]} /><meshStandardMaterial color="#374151" /></mesh>
        {/* Front zip */}
        <mesh position={[0, 1.7, 0.37]} castShadow><boxGeometry args={[0.06, 1.2, 0.02]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} /></mesh>
      </group>
    );
  if (kind === "varsity")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.32, 1.3, 0.7]} /><meshStandardMaterial color={baseColor} /></mesh>
        {/* White sleeves accent at shoulders */}
        <mesh position={[-0.7, 2.05, 0]} castShadow><boxGeometry args={[0.42, 0.4, 0.42]} /><meshStandardMaterial color="#fafafa" /></mesh>
        <mesh position={[0.7, 2.05, 0]} castShadow><boxGeometry args={[0.42, 0.4, 0.42]} /><meshStandardMaterial color="#fafafa" /></mesh>
        {/* Letter on chest */}
        <mesh position={[0, 1.85, 0.36]} castShadow><boxGeometry args={[0.3, 0.3, 0.02]} /><meshStandardMaterial color="#fbbf24" /></mesh>
      </group>
    );
  if (kind === "leather")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[1.34, 1.3, 0.72]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Collar pop */}
        <mesh position={[-0.3, 2.4, 0.3]} rotation={[0, 0, -0.3]} castShadow><boxGeometry args={[0.3, 0.25, 0.05]} /><meshStandardMaterial color="#0a0a0a" metalness={0.4} /></mesh>
        <mesh position={[0.3, 2.4, 0.3]} rotation={[0, 0, 0.3]} castShadow><boxGeometry args={[0.3, 0.25, 0.05]} /><meshStandardMaterial color="#0a0a0a" metalness={0.4} /></mesh>
      </group>
    );
  if (kind === "puffer")
    return (
      <group>
        <mesh position={[0, 1.95, 0]} castShadow><boxGeometry args={[1.45, 0.4, 0.85]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[1.45, 0.4, 0.85]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[1.42, 0.32, 0.82]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "cape")
    return (
      <mesh position={[0, 1.6, -0.4]} castShadow>
        <boxGeometry args={[1.3, 1.6, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" side={2} />
      </mesh>
    );
  return null;
}

type Props = {
  // Allow callers (e.g. NPC bots) to omit the new cosmetic slots and fall back to defaults
  config: Omit<AvatarConfig, "hair" | "shoes" | "jacket"> & Partial<Pick<AvatarConfig, "hair" | "shoes" | "jacket">>;
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
  const hair = config.hair ?? "none";
  const shoes = config.shoes ?? "sneakers";
  const jacket = config.jacket ?? "none";

  // Common pieces ------------------------------------------
  const Head = (
    <group position={[0, 2.6, 0]}>
      <mesh castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color={skin} /></mesh>
      <Face kind={config.face} />
      <Hair kind={hair} />
      <Hat kind={config.hat} />
    </group>
  );

  if (config.rig === "R6") {
    return (
      <group ref={group} position={position}>
        {Head}
        {/* torso */}
        <mesh position={[0, 1.6, 0]} castShadow><boxGeometry args={[1.2, 1.2, 0.6]} /><meshStandardMaterial color={shirt} /></mesh>
        {/* jacket layers over torso */}
        <Jacket kind={jacket} baseColor={shirt} />
        {/* arms */}
        <group ref={lArm as React.RefObject<Group>} position={[-0.8, 2.1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.4, 1.2, 0.4]} /><meshStandardMaterial color={shirt} /></mesh>
        </group>
        <group ref={rArm as React.RefObject<Group>} position={[0.8, 2.1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.4, 1.2, 0.4]} /><meshStandardMaterial color={shirt} /></mesh>
        </group>
        {/* legs (with shoes attached at the foot) */}
        <group ref={lLeg as React.RefObject<Group>} position={[-0.3, 1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.5, 1.2, 0.5]} /><meshStandardMaterial color={pants} /></mesh>
          <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
        </group>
        <group ref={rLeg as React.RefObject<Group>} position={[0.3, 1, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow><boxGeometry args={[0.5, 1.2, 0.5]} /><meshStandardMaterial color={pants} /></mesh>
          <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
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
      {/* jacket layers over torso */}
      <Jacket kind={jacket} baseColor={shirt} />
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
      {/* left leg (shoe replaces the bare foot) */}
      <group ref={lLeg as React.RefObject<Group>} position={[-0.27, 1.1, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.45, 0.6, 0.45]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.42, 0.55, 0.42]} /><meshStandardMaterial color={pants} /></mesh>
        <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
      </group>
      {/* right leg */}
      <group ref={rLeg as React.RefObject<Group>} position={[0.27, 1.1, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow><boxGeometry args={[0.45, 0.6, 0.45]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh position={[0, -0.95, 0]} castShadow><boxGeometry args={[0.42, 0.55, 0.42]} /><meshStandardMaterial color={pants} /></mesh>
        <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
      </group>
    </group>
  );
}
