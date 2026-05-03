import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { AvatarConfig } from "@/lib/auth-context";

// Hat catalog
export const HATS = ["none", "cap", "beanie", "horns", "headphones", "tophat", "cowboy", "wizard", "halo", "antlers", "crown", "fire", "catears", "foxears", "bunnyears", "headband", "strawhat", "samurai", "demonhorns", "angelhalo", "ninjahood", "magicalgirl", "visor", "skullcrown", "rainbow", "durag_black", "durag_red", "durag_blue", "fitted_black", "fitted_red", "fitted_white", "designerbucket"] as const;
export const FACES = ["smile", "happy", "wink", "cool", "kawaii", "angry", "evil", "robot", "anime", "tsundere", "sleepy", "starry", "heart", "demon", "void", "blush", "grillz", "shades"] as const;
export const HAIRS = ["none", "buzz", "messy", "side", "ponytail", "pigtails", "bun", "spikes", "mohawk", "long", "afro", "fire", "twintails", "hime", "spiky", "silver", "bluebob", "pinkpunk", "swordsman", "lightning", "rainbow", "demonking", "dreads", "freeform", "longdreads", "twists", "waves360"] as const;
export const SHOES = ["sneakers", "sandals", "crocs", "boots", "heels", "cleats", "skates", "platforms", "neonkicks", "rocketboots", "goldenkicks", "geta", "ninjaboots", "samuraiboots", "magicalboots", "iceboots", "lavaboots", "void", "designersneaks", "redbottoms", "highdesigners"] as const;
export const JACKETS = ["none", "vest", "hoodie", "denim", "varsity", "puffer", "trench", "leather", "armor", "cape", "wings", "kimono", "haori", "schooluniform", "ninjagi", "demonwings", "dragonscale", "magicalgirl", "akatsuki", "designerhoodie", "luxuryjacket", "bigpuffer", "chain", "gucciset", "tracksuit"] as const;

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
      ) : kind === "anime" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.14, 0.22]} /><meshBasicMaterial color="#7c3aed" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.14, 0.22]} /><meshBasicMaterial color="#7c3aed" /></mesh>
          <mesh position={[-0.16, eyeY + 0.06, 0.001]}><planeGeometry args={[0.04, 0.06]} /><meshBasicMaterial color="#fff" /></mesh>
          <mesh position={[0.2, eyeY + 0.06, 0.001]}><planeGeometry args={[0.04, 0.06]} /><meshBasicMaterial color="#fff" /></mesh>
        </>
      ) : kind === "tsundere" ? (
        <>
          <mesh position={[-0.18, eyeY + 0.02, 0]} rotation={[0, 0, 0.3]}><planeGeometry args={[0.16, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY + 0.02, 0]} rotation={[0, 0, -0.3]}><planeGeometry args={[0.16, 0.06]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[-0.22, -0.05, 0]}><planeGeometry args={[0.08, 0.04]} /><meshBasicMaterial color="#fb7185" /></mesh>
          <mesh position={[0.22, -0.05, 0]}><planeGeometry args={[0.08, 0.04]} /><meshBasicMaterial color="#fb7185" /></mesh>
        </>
      ) : kind === "sleepy" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.03]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.03]} /><meshBasicMaterial color="#111" /></mesh>
        </>
      ) : kind === "starry" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.18]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.18]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[-0.18, eyeY, 0.001]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#fde047" /></mesh>
          <mesh position={[0.18, eyeY, 0.001]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#fde047" /></mesh>
        </>
      ) : kind === "heart" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.16]} /><meshBasicMaterial color="#ec4899" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.16, 0.16]} /><meshBasicMaterial color="#ec4899" /></mesh>
        </>
      ) : kind === "demon" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.14]} /><meshBasicMaterial color="#dc2626" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.14]} /><meshBasicMaterial color="#dc2626" /></mesh>
        </>
      ) : kind === "void" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.18]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.18, 0.18]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
        </>
      ) : kind === "blush" ? (
        <>
          <mesh position={[-0.18, eyeY, 0]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[0.18, eyeY, 0]}><planeGeometry args={[0.1, 0.1]} /><meshBasicMaterial color="#111" /></mesh>
          <mesh position={[-0.26, -0.02, 0]}><planeGeometry args={[0.14, 0.08]} /><meshBasicMaterial color="#fb7185" /></mesh>
          <mesh position={[0.26, -0.02, 0]}><planeGeometry args={[0.14, 0.08]} /><meshBasicMaterial color="#fb7185" /></mesh>
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
  if (kind === "catears" || kind === "foxears" || kind === "bunnyears") {
    const isBunny = kind === "bunnyears";
    const earColor = kind === "foxears" ? "#ea580c" : kind === "catears" ? "#1f2937" : "#fafafa";
    const inner = "#fb7185";
    const earH = isBunny ? 0.7 : 0.4;
    const earW = isBunny ? 0.16 : 0.22;
    return (
      <group position={[0, 0.5, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.28, earH / 2, 0]} rotation={[0, 0, s * (isBunny ? 0.05 : 0.25)]}>
            <mesh castShadow><boxGeometry args={[earW, earH, 0.08]} /><meshStandardMaterial color={earColor} /></mesh>
            <mesh position={[0, 0, 0.05]}><boxGeometry args={[earW * 0.5, earH * 0.7, 0.02]} /><meshBasicMaterial color={inner} /></mesh>
          </group>
        ))}
      </group>
    );
  }
  if (kind === "headband")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.95, 0.18, 0.95]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
        <mesh position={[0, 0, 0.48]}><boxGeometry args={[0.3, 0.16, 0.02]} /><meshStandardMaterial color="#9ca3af" metalness={0.8} /></mesh>
      </group>
    );
  if (kind === "strawhat")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.95, 0.95, 0.08, 16]} /><meshStandardMaterial color="#fde047" /></mesh>
        <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.5, 0.55, 0.4, 16]} /><meshStandardMaterial color="#fde047" /></mesh>
        <mesh position={[0, 0.05, 0.46]}><boxGeometry args={[0.6, 0.06, 0.02]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "samurai")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[0.95, 0.45, 0.95]} /><meshStandardMaterial color="#0a0a0a" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.6, 0.3, 0.6]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
        {/* horns / kuwagata */}
        <mesh position={[-0.32, 0.45, 0]} rotation={[0, 0, -0.5]} castShadow><boxGeometry args={[0.06, 0.5, 0.06]} /><meshStandardMaterial color="#fbbf24" metalness={0.8} /></mesh>
        <mesh position={[0.32, 0.45, 0]} rotation={[0, 0, 0.5]} castShadow><boxGeometry args={[0.06, 0.5, 0.06]} /><meshStandardMaterial color="#fbbf24" metalness={0.8} /></mesh>
      </group>
    );
  if (kind === "demonhorns")
    return (
      <group position={[0, 0.5, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.3, 0.25, 0]} rotation={[0, 0, s * 0.4]} castShadow>
            <coneGeometry args={[0.14, 0.55, 6]} />
            <meshStandardMaterial color="#0a0a0a" emissive="#dc2626" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    );
  if (kind === "angelhalo")
    return (
      <group>
        <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.07, 12, 32]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1.4} />
        </mesh>
        <pointLight color="#fde047" intensity={1.2} distance={3} position={[0, 1.0, 0]} />
      </group>
    );
  if (kind === "ninjahood")
    return (
      <group position={[0, 0.45, 0]}>
        <mesh castShadow><boxGeometry args={[1.0, 0.8, 1.0]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, -0.05, 0.41]}><boxGeometry args={[0.85, 0.18, 0.02]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "magicalgirl")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.2, 0.85]} /><meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, 0.2, 0.4]}><boxGeometry args={[0.18, 0.18, 0.04]} /><meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.6} /></mesh>
      </group>
    );
  if (kind === "visor")
    return (
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 0, 0.42]}><boxGeometry args={[0.95, 0.22, 0.06]} /><meshStandardMaterial color="#0a0a0a" emissive="#22d3ee" emissiveIntensity={0.9} /></mesh>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.95, 0.1, 0.95]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
      </group>
    );
  if (kind === "skullcrown")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><boxGeometry args={[0.95, 0.22, 0.95]} /><meshStandardMaterial color="#0a0a0a" metalness={0.6} /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.35, 0.35, 0.35]} /><meshStandardMaterial color="#fafafa" /></mesh>
      </group>
    );
  if (kind === "rainbow")
    return (
      <group position={[0, 0.6, 0]}>
        {["#dc2626", "#f59e0b", "#fde047", "#16a34a", "#0ea5e9", "#7c3aed"].map((c, i) => (
          <mesh key={c} position={[0, i * 0.04, 0]}>
            <torusGeometry args={[0.5 + i * 0.04, 0.025, 8, 24]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.8} />
          </mesh>
        ))}
        <pointLight color="#a855f7" intensity={1.3} distance={4} />
      </group>
    );
  // Streetwear hats
  if (kind === "durag_black" || kind === "durag_red" || kind === "durag_blue") {
    const c = kind === "durag_red" ? "#dc2626" : kind === "durag_blue" ? "#1e40af" : "#0a0a0a";
    return (
      <group position={[0, 0.42, 0]}>
        {/* hugs the skull */}
        <mesh castShadow><boxGeometry args={[0.92, 0.42, 0.94]} /><meshStandardMaterial color={c} roughness={0.4} metalness={0.1} /></mesh>
        {/* tied knot front */}
        <mesh position={[0, 0, 0.48]} castShadow><boxGeometry args={[0.18, 0.14, 0.08]} /><meshStandardMaterial color={c} /></mesh>
        {/* tail flowing back */}
        <mesh position={[0, -0.08, -0.55]} rotation={[0.5, 0, 0]} castShadow><boxGeometry args={[0.55, 0.06, 0.6]} /><meshStandardMaterial color={c} side={2} /></mesh>
      </group>
    );
  }
  if (kind === "fitted_black" || kind === "fitted_red" || kind === "fitted_white") {
    const c = kind === "fitted_red" ? "#dc2626" : kind === "fitted_white" ? "#fafafa" : "#0a0a0a";
    return (
      <group position={[0, 0.55, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow><boxGeometry args={[0.98, 0.22, 0.98]} /><meshStandardMaterial color={c} /></mesh>
        {/* flat brim */}
        <mesh position={[0, -0.02, 0.6]} castShadow><boxGeometry args={[0.95, 0.04, 0.42]} /><meshStandardMaterial color={c} /></mesh>
        {/* logo dot */}
        <mesh position={[0, 0.08, 0.5]}><boxGeometry args={[0.16, 0.12, 0.02]} /><meshStandardMaterial color={c === "#fafafa" ? "#dc2626" : "#fde047"} metalness={0.7} /></mesh>
      </group>
    );
  }
  if (kind === "designerbucket")
    return (
      <group position={[0, 0.55, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.55, 0.55, 0.4, 16]} /><meshStandardMaterial color="#7c2d12" roughness={0.5} /></mesh>
        <mesh position={[0, -0.18, 0]} castShadow><cylinderGeometry args={[0.85, 0.85, 0.06, 16]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        {/* monogram band */}
        <mesh position={[0, 0, 0.55]}><boxGeometry args={[0.7, 0.16, 0.02]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} /></mesh>
      </group>
    );
  return null;
}
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
  if (kind === "side")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.88, 0.22, 0.88]} /><meshStandardMaterial color="#3b2f1d" /></mesh>
        <mesh position={[-0.3, 0.05, 0.3]} rotation={[0, 0, 0.4]} castShadow><boxGeometry args={[0.2, 0.18, 0.4]} /><meshStandardMaterial color="#3b2f1d" /></mesh>
      </group>
    );
  if (kind === "pigtails")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.86, 0.22, 0.86]} /><meshStandardMaterial color="#7c4a1e" /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.55, -0.2, 0]} castShadow>
            <boxGeometry args={[0.18, 0.6, 0.18]} />
            <meshStandardMaterial color="#7c4a1e" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "spikes")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.1, 0.85]} /><meshStandardMaterial color="#1c1917" /></mesh>
        {[
          [-0.25, -0.25], [0.25, -0.25], [0, 0], [-0.25, 0.25], [0.25, 0.25],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.25, z]} castShadow>
            <coneGeometry args={[0.12, 0.4, 4]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "long")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.92, 0.3, 0.92]} /><meshStandardMaterial color="#a16207" /></mesh>
        <mesh position={[0, -0.7, -0.4]} castShadow><boxGeometry args={[0.85, 1.4, 0.18]} /><meshStandardMaterial color="#a16207" /></mesh>
      </group>
    );
  if (kind === "fire")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.1, 0.85]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        {[-0.25, 0, 0.25].map((x, i) => (
          <mesh key={x} position={[x, 0.35 + (i === 1 ? 0.15 : 0), 0]} castShadow>
            <coneGeometry args={[0.18, 0.65, 6]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.4} />
          </mesh>
        ))}
        <pointLight color="#fb923c" intensity={1.2} distance={3} position={[0, 0.4, 0]} />
      </group>
    );
  if (kind === "twintails")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.9, 0.28, 0.9]} /><meshStandardMaterial color="#f472b6" /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.55, -0.3, 0]}>
            <mesh castShadow><boxGeometry args={[0.22, 1.0, 0.22]} /><meshStandardMaterial color="#f472b6" /></mesh>
            <mesh position={[0, -0.5, 0]} castShadow><boxGeometry args={[0.18, 0.4, 0.18]} /><meshStandardMaterial color="#f472b6" /></mesh>
          </group>
        ))}
      </group>
    );
  if (kind === "hime")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.95, 0.3, 0.95]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* side bangs */}
        <mesh position={[-0.42, -0.2, 0.3]} castShadow><boxGeometry args={[0.16, 0.55, 0.32]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0.42, -0.2, 0.3]} castShadow><boxGeometry args={[0.16, 0.55, 0.32]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* long back hair */}
        <mesh position={[0, -0.7, -0.4]} castShadow><boxGeometry args={[0.9, 1.5, 0.18]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
      </group>
    );
  if (kind === "spiky")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.18, 0.85]} /><meshStandardMaterial color="#fbbf24" /></mesh>
        {[[-0.3, 0.2], [0, 0.35], [0.3, 0.2], [-0.15, 0.0], [0.15, 0.0]].map(([x, h], i) => (
          <mesh key={i} position={[x, 0.22 + h, 0]} rotation={[0, 0, (i % 2 ? 0.2 : -0.2)]} castShadow>
            <coneGeometry args={[0.16, 0.5 + h, 4]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "silver")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.92, 0.3, 0.92]} /><meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.6} /></mesh>
        <mesh position={[0, -0.7, -0.4]} castShadow><boxGeometry args={[0.85, 1.4, 0.18]} /><meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.6} /></mesh>
      </group>
    );
  if (kind === "bluebob")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[1.0, 0.55, 1.0]} /><meshStandardMaterial color="#0ea5e9" /></mesh>
        <mesh position={[0, -0.05, 0.42]}><boxGeometry args={[0.9, 0.18, 0.04]} /><meshStandardMaterial color="#0ea5e9" /></mesh>
      </group>
    );
  if (kind === "pinkpunk")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.12, 0.85]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.25, 0.55, 0.85]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  if (kind === "swordsman")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.92, 0.28, 0.92]} /><meshStandardMaterial color="#16a34a" /></mesh>
        <mesh position={[0, -0.05, 0.42]}><boxGeometry args={[0.9, 0.2, 0.04]} /><meshStandardMaterial color="#16a34a" /></mesh>
        {/* small ponytail */}
        <mesh position={[0, -0.25, -0.5]} rotation={[0.4, 0, 0]} castShadow><boxGeometry args={[0.18, 0.5, 0.18]} /><meshStandardMaterial color="#16a34a" /></mesh>
      </group>
    );
  if (kind === "lightning")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.85, 0.12, 0.85]} /><meshStandardMaterial color="#fde047" /></mesh>
        {[-0.3, 0, 0.3].map((x, i) => (
          <mesh key={x} position={[x, 0.4 + (i === 1 ? 0.18 : 0), 0]} rotation={[0, 0, (i - 1) * 0.3]} castShadow>
            <coneGeometry args={[0.16, 0.7, 4]} />
            <meshStandardMaterial color="#fde047" emissive="#fbbf24" emissiveIntensity={1.2} />
          </mesh>
        ))}
        <pointLight color="#fde047" intensity={1.4} distance={3} position={[0, 0.5, 0]} />
      </group>
    );
  if (kind === "rainbow") {
    const cols = ["#dc2626", "#f59e0b", "#fde047", "#16a34a", "#0ea5e9", "#7c3aed"];
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.9, 0.28, 0.9]} /><meshStandardMaterial color="#fafafa" /></mesh>
        {cols.map((c, i) => (
          <mesh key={c} position={[(i - 2.5) * 0.15, 0.25, 0]} castShadow>
            <boxGeometry args={[0.13, 0.3, 0.85]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "demonking")
    return (
      <group position={[0, 0.42, 0]}>
        <mesh castShadow><boxGeometry args={[0.92, 0.28, 0.92]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, -0.7, -0.4]} castShadow>
          <boxGeometry args={[0.85, 1.5, 0.18]} />
          <meshStandardMaterial color="#0a0a0a" emissive="#7f1d1d" emissiveIntensity={0.4} />
        </mesh>
        <pointLight color="#dc2626" intensity={0.9} distance={3} />
      </group>
    );
  return null;
}

function Shoe({ kind, color }: { kind: string; color?: string }) {
  // Renders a single shoe centered at origin (caller positions it on each foot).
  // `color` is used for the default sneaker; other shoes have their own palettes.
  if (kind === "geta")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.5, 0.1, 0.66]} /><meshStandardMaterial color="#78350f" /></mesh>
        <mesh position={[-0.12, -0.12, 0]} castShadow><boxGeometry args={[0.08, 0.18, 0.6]} /><meshStandardMaterial color="#78350f" /></mesh>
        <mesh position={[0.12, -0.12, 0]} castShadow><boxGeometry args={[0.08, 0.18, 0.6]} /><meshStandardMaterial color="#78350f" /></mesh>
      </group>
    );
  if (kind === "ninjaboots")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.48, 0.3, 0.62]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0, 0.32]}><boxGeometry args={[0.46, 0.06, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "samuraiboots")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.5, 0.4, 0.62]} /><meshStandardMaterial color="#1c1917" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[0.52, 0.08, 0.62]} /><meshStandardMaterial color="#fbbf24" metalness={0.7} /></mesh>
      </group>
    );
  if (kind === "magicalboots")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.36, 0.62]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.1, 0.3]}><boxGeometry args={[0.4, 0.08, 0.04]} /><meshStandardMaterial color="#fde047" /></mesh>
      </group>
    );
  if (kind === "iceboots")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.3, 0.62]} />
          <meshStandardMaterial color="#bae6fd" emissive="#22d3ee" emissiveIntensity={0.6} metalness={0.3} roughness={0.2} />
        </mesh>
      </group>
    );
  if (kind === "lavaboots")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.3, 0.62]} />
          <meshStandardMaterial color="#7c2d12" emissive="#f97316" emissiveIntensity={0.9} />
        </mesh>
        <pointLight color="#f97316" intensity={0.6} distance={1.6} />
      </group>
    );
  if (kind === "void")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.3, 0.62]} />
          <meshStandardMaterial color="#0a0a0a" emissive="#7c3aed" emissiveIntensity={0.7} />
        </mesh>
        <pointLight color="#a855f7" intensity={0.7} distance={2} />
      </group>
    );
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
  if (kind === "crocs")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.55, 0.18, 0.7]} /><meshStandardMaterial color="#84cc16" /></mesh>
        <mesh position={[0, 0.06, 0]} castShadow><boxGeometry args={[0.5, 0.1, 0.5]} /><meshStandardMaterial color="#65a30d" /></mesh>
      </group>
    );
  if (kind === "cleats")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.5, 0.2, 0.62]} /><meshStandardMaterial color="#fafafa" /></mesh>
        <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.46, 0.06, 0.58]} /><meshStandardMaterial color="#16a34a" /></mesh>
        {[[-0.15, 0.18], [0.15, 0.18], [-0.15, -0.18], [0.15, -0.18]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.14, z]} castShadow><boxGeometry args={[0.06, 0.08, 0.06]} /><meshStandardMaterial color="#111" /></mesh>
        ))}
      </group>
    );
  if (kind === "platforms")
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.55, 0.45, 0.65]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.5, 0.18, 0.6]} /><meshStandardMaterial color="#7c3aed" /></mesh>
      </group>
    );
  if (kind === "neonkicks")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.24, 0.64]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, -0.14, 0]} castShadow><boxGeometry args={[0.54, 0.06, 0.66]} /><meshStandardMaterial color="#fafafa" /></mesh>
      </group>
    );
  if (kind === "goldenkicks")
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.24, 0.64]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} emissive="#fbbf24" emissiveIntensity={0.4} />
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
  if (kind === "vest")
    return (
      <group>
        {/* Open-front vest: two side panels around the torso */}
        <mesh position={[-0.55, 1.7, 0]} castShadow><boxGeometry args={[0.3, 1.2, 0.74]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0.55, 1.7, 0]} castShadow><boxGeometry args={[0.3, 1.2, 0.74]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, 1.7, -0.32]} castShadow><boxGeometry args={[1.32, 1.2, 0.1]} /><meshStandardMaterial color="#1f2937" /></mesh>
      </group>
    );
  if (kind === "denim")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.34, 1.3, 0.72]} /><meshStandardMaterial color="#1e40af" roughness={0.85} /></mesh>
        {/* lighter chest pockets */}
        <mesh position={[-0.3, 1.85, 0.37]} castShadow><boxGeometry args={[0.3, 0.3, 0.04]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <mesh position={[0.3, 1.85, 0.37]} castShadow><boxGeometry args={[0.3, 0.3, 0.04]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      </group>
    );
  if (kind === "trench")
    return (
      <group>
        <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.36, 2.0, 0.74]} /><meshStandardMaterial color="#78350f" /></mesh>
        {/* belt */}
        <mesh position={[0, 1.5, 0.38]} castShadow><boxGeometry args={[1.4, 0.12, 0.04]} /><meshStandardMaterial color="#3f1d12" /></mesh>
        {/* collar pop */}
        <mesh position={[-0.32, 2.42, 0.28]} rotation={[0, 0, -0.4]} castShadow><boxGeometry args={[0.3, 0.3, 0.05]} /><meshStandardMaterial color="#78350f" /></mesh>
        <mesh position={[0.32, 2.42, 0.28]} rotation={[0, 0, 0.4]} castShadow><boxGeometry args={[0.3, 0.3, 0.05]} /><meshStandardMaterial color="#78350f" /></mesh>
      </group>
    );
  if (kind === "armor")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[1.4, 1.4, 0.78]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* shoulder pauldrons */}
        <mesh position={[-0.78, 2.2, 0]} castShadow><boxGeometry args={[0.42, 0.4, 0.5]} /><meshStandardMaterial color="#6b7280" metalness={0.95} roughness={0.2} /></mesh>
        <mesh position={[0.78, 2.2, 0]} castShadow><boxGeometry args={[0.42, 0.4, 0.5]} /><meshStandardMaterial color="#6b7280" metalness={0.95} roughness={0.2} /></mesh>
        {/* chest emblem */}
        <mesh position={[0, 1.85, 0.4]} castShadow><boxGeometry args={[0.35, 0.35, 0.04]} /><meshStandardMaterial color="#fbbf24" metalness={0.8} /></mesh>
      </group>
    );
  if (kind === "wings")
    return (
      <group position={[0, 2.0, -0.3]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.7, 0, 0]} rotation={[0, s * 0.4, s * 0.2]}>
            <mesh castShadow><boxGeometry args={[0.9, 1.4, 0.06]} /><meshStandardMaterial color="#fafafa" emissive="#fafafa" emissiveIntensity={0.2} /></mesh>
            <mesh position={[s * 0.4, -0.3, 0.01]} castShadow><boxGeometry args={[0.5, 0.7, 0.06]} /><meshStandardMaterial color="#fafafa" /></mesh>
          </group>
        ))}
      </group>
    );
  if (kind === "kimono")
    return (
      <group>
        <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.36, 2.0, 0.74]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[0, 1.5, 0.38]} castShadow><boxGeometry args={[1.4, 0.16, 0.04]} /><meshStandardMaterial color="#fde047" /></mesh>
        <mesh position={[-0.35, 1.95, 0.36]} rotation={[0, 0, -0.7]}><boxGeometry args={[0.5, 0.06, 0.04]} /><meshStandardMaterial color="#fafafa" /></mesh>
        <mesh position={[0.35, 1.95, 0.36]} rotation={[0, 0, 0.7]}><boxGeometry args={[0.5, 0.06, 0.04]} /><meshStandardMaterial color="#fafafa" /></mesh>
      </group>
    );
  if (kind === "haori")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.42, 1.6, 0.78]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* shoulder flame trim */}
        <mesh position={[0, 0.95, 0.4]}><boxGeometry args={[1.4, 0.4, 0.04]} /><meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} /></mesh>
        <mesh position={[-0.55, 1.45, 0.41]}><boxGeometry args={[0.18, 0.5, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0.55, 1.45, 0.41]}><boxGeometry args={[0.18, 0.5, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "schooluniform")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.34, 1.3, 0.72]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
        {/* white collar */}
        <mesh position={[0, 2.32, 0.36]}><boxGeometry args={[0.7, 0.18, 0.04]} /><meshStandardMaterial color="#fafafa" /></mesh>
        {/* red ribbon */}
        <mesh position={[0, 2.18, 0.39]}><boxGeometry args={[0.22, 0.18, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "ninjagi")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.34, 1.3, 0.72]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 1.5, 0.38]}><boxGeometry args={[1.4, 0.18, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  if (kind === "demonwings")
    return (
      <group position={[0, 2.0, -0.3]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.7, 0, 0]} rotation={[0, s * 0.4, s * 0.2]}>
            <mesh castShadow>
              <boxGeometry args={[0.95, 1.5, 0.06]} />
              <meshStandardMaterial color="#1c1917" emissive="#7f1d1d" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (kind === "dragonscale")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[1.4, 1.4, 0.78]} />
          <meshStandardMaterial color="#16a34a" metalness={0.7} roughness={0.3} emissive="#14532d" emissiveIntensity={0.4} />
        </mesh>
        {/* spikes on shoulders */}
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <mesh key={x} position={[x, 2.4, 0]} castShadow>
            <coneGeometry args={[0.1, 0.3, 4]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "magicalgirl")
    return (
      <group>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[1.36, 1.3, 0.74]} /><meshStandardMaterial color="#fb7185" /></mesh>
        <mesh position={[0, 1.05, 0]}><boxGeometry args={[1.5, 0.15, 0.78]} /><meshStandardMaterial color="#fafafa" /></mesh>
        <mesh position={[0, 1.85, 0.4]}><boxGeometry args={[0.3, 0.18, 0.04]} /><meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.5} /></mesh>
      </group>
    );
  if (kind === "akatsuki")
    return (
      <group>
        <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.4, 2.0, 0.78]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* red clouds */}
        <mesh position={[-0.4, 1.85, 0.4]}><boxGeometry args={[0.3, 0.22, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0.4, 1.4, 0.4]}><boxGeometry args={[0.3, 0.22, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, 1.0, 0.4]}><boxGeometry args={[0.28, 0.2, 0.04]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
    );
  return null;
}

type AvatarAnim = "idle" | "walk" | "jump" | "shoot";

type Props = {
  // Allow callers (e.g. NPC bots) to omit the new cosmetic slots and fall back to defaults
  config: Omit<AvatarConfig, "hair" | "shoes" | "jacket"> & Partial<Pick<AvatarConfig, "hair" | "shoes" | "jacket">>;
  position?: [number, number, number];
  /** Legacy: when true, plays walk cycle. Prefer `anim` for full state. */
  walking?: boolean;
  /** Animation state. If omitted, falls back to `walking` flag for backwards compat. */
  anim?: AvatarAnim;
};

/**
 * Blocky Roblox-style avatar.
 * R6: 6 limbs (head, torso, 2 arms, 2 legs)
 * R15: 15 parts — arms split into upper/lower/hand, legs split into upper/lower/foot
 */
export function BlockyAvatar({ config, position = [0, 0, 0], walking = false, anim }: Props) {
  const group = useRef<Group>(null);
  const lArm = useRef<Mesh | Group>(null);
  const rArm = useRef<Mesh | Group>(null);
  const lLeg = useRef<Mesh | Group>(null);
  const rLeg = useRef<Mesh | Group>(null);
  // Smoothed pose targets so transitions between idle/walk/jump don't snap.
  const poseRef = useRef({ lArm: 0, rArm: 0, lLeg: 0, rLeg: 0 });

  useFrame((_s, dt) => {
    if (!group.current) return;
    const state: AvatarAnim = anim ?? (walking ? "walk" : "idle");
    const t = (group.current.userData.t = (group.current.userData.t ?? 0) + dt * (state === "walk" ? 8 : state === "jump" ? 6 : 1.5));

    let lArmX = 0, rArmX = 0, lLegX = 0, rLegX = 0;
    if (state === "walk") {
      const s = Math.sin(t) * 0.6;
      lArmX = s; rArmX = -s; lLegX = -s; rLegX = s;
    } else if (state === "jump") {
      // Tuck legs up, arms slightly raised — classic Roblox jump pose
      lArmX = -1.0; rArmX = -1.0;
      lLegX = 0.6; rLegX = 0.6;
    } else if (state === "shoot") {
      // arms forward, legs idle micro-sway
      lArmX = -1.4; rArmX = -1.4;
      const s = Math.sin(t * 0.5) * 0.04;
      lLegX = -s; rLegX = s;
    } else {
      // idle: no swing — just hold neutral with a tiny breathing micro-motion
      const s = Math.sin(t * 0.5) * 0.03;
      lArmX = s; rArmX = -s; lLegX = 0; rLegX = 0;
    }

    // Lerp toward target so jump→land doesn't snap
    const k = Math.min(1, dt * 14);
    const p = poseRef.current;
    p.lArm += (lArmX - p.lArm) * k;
    p.rArm += (rArmX - p.rArm) * k;
    p.lLeg += (lLegX - p.lLeg) * k;
    p.rLeg += (rLegX - p.rLeg) * k;

    if (lArm.current) lArm.current.rotation.x = p.lArm;
    if (rArm.current) rArm.current.rotation.x = p.rArm;
    if (lLeg.current) lLeg.current.rotation.x = p.lLeg;
    if (rLeg.current) rLeg.current.rotation.x = p.rLeg;
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

  if (config.rig === "Realistic") {
    // Proportional human body — capsule torso, rounded limbs, smoother shading.
    // Anchor points (head y=2.6, arms y≈2.25, legs y≈1.1) match R15 so all
    // existing hats/hair/jackets/shoes still fit when the player switches rigs.
    const muscleRough = 0.55;
    const skinMat = (
      <meshStandardMaterial color={skin} roughness={0.7} metalness={0.0} />
    );
    return (
      <group ref={group} position={position}>
        {/* Head — sphere for smoother silhouette */}
        <group position={[0, 2.6, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 20, 20]} />
            <meshStandardMaterial color={skin} roughness={0.65} />
          </mesh>
          {/* neck */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.25, 12]} />
            {skinMat}
          </mesh>
          <Face kind={config.face} />
          <Hair kind={hair} />
          <Hat kind={config.hat} />
        </group>
        {/* torso — tapered V-shape (broad shoulders → narrow waist) */}
        <mesh position={[0, 2.0, 0]} castShadow>
          <boxGeometry args={[1.25, 0.7, 0.55]} />
          <meshStandardMaterial color={shirt} roughness={muscleRough} />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[0.95, 0.6, 0.5]} />
          <meshStandardMaterial color={shirt} roughness={muscleRough} />
        </mesh>
        {/* pec/ab definition (subtle dark inset lines) */}
        <mesh position={[0, 2.05, 0.28]}>
          <boxGeometry args={[0.04, 0.5, 0.01]} />
          <meshStandardMaterial color="#000" transparent opacity={0.18} />
        </mesh>
        <mesh position={[0, 1.65, 0.26]}>
          <boxGeometry args={[0.5, 0.02, 0.01]} />
          <meshStandardMaterial color="#000" transparent opacity={0.18} />
        </mesh>
        <Jacket kind={jacket} baseColor={shirt} />
        {/* arms — capsule (cylinder + sphere caps) for muscular look */}
        <group ref={lArm as React.RefObject<Group>} position={[-0.78, 2.25, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={shirt} roughness={muscleRough} />
          </mesh>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.16, 0.7, 14]} />
            <meshStandardMaterial color={shirt} roughness={muscleRough} />
          </mesh>
          <mesh position={[0, -0.95, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.55, 14]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -1.3, 0]} castShadow>
            <sphereGeometry args={[0.16, 14, 14]} />
            {skinMat}
          </mesh>
        </group>
        <group ref={rArm as React.RefObject<Group>} position={[0.78, 2.25, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={shirt} roughness={muscleRough} />
          </mesh>
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.16, 0.7, 14]} />
            <meshStandardMaterial color={shirt} roughness={muscleRough} />
          </mesh>
          <mesh position={[0, -0.95, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.55, 14]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -1.3, 0]} castShadow>
            <sphereGeometry args={[0.16, 14, 14]} />
            {skinMat}
          </mesh>
        </group>
        {/* legs — thigh + calf cylinders */}
        <group ref={lLeg as React.RefObject<Group>} position={[-0.27, 1.1, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.2, 0.65, 14]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.95, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.55, 14]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
        </group>
        <group ref={rLeg as React.RefObject<Group>} position={[0.27, 1.1, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.2, 0.65, 14]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.95, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.55, 14]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
          <group position={[0, -1.3, 0.05]}><Shoe kind={shoes} /></group>
        </group>
      </group>
    );
  }

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
