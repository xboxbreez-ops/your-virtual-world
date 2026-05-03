import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { HeaderBar } from "@/components/HeaderBar";
import { SelfAvatar } from "@/components/SelfAvatar";
import { useGameInput } from "@/hooks/useGameInput";
import { applyPlayerCamera } from "@/lib/camera";
import { GameAtmosphere } from "@/components/GameAtmosphere";
import { Egg, Heart, Home, Coins } from "lucide-react";

export const Route = createFileRoute("/play/pet-pals")({
  head: () => ({
    meta: [
      { title: "Pet Pals — BloxWorld" },
      { name: "description", content: "Adopt eggs, hatch pets, raise them, and decorate your house." },
    ],
  }),
  component: PetPalsPage,
});

type PetKind = "dog" | "cat" | "dragon" | "unicorn";
type EggKind = "common" | "rare" | "legendary";
const EGG_INFO: Record<EggKind, { price: number; hatchMs: number; pool: PetKind[]; color: string; label: string }> = {
  common:    { price: 100,  hatchMs: 8000,  pool: ["dog", "cat"],         color: "#fafafa", label: "Common Egg" },
  rare:      { price: 500,  hatchMs: 14000, pool: ["dog", "cat", "dragon"], color: "#a855f7", label: "Rare Egg" },
  legendary: { price: 2000, hatchMs: 22000, pool: ["dragon", "unicorn"],   color: "#fbbf24", label: "Legendary Egg" },
};
const PET_INFO: Record<PetKind, { color: string; emoji: string; label: string }> = {
  dog: { color: "#a16207", emoji: "🐶", label: "Puppy" },
  cat: { color: "#9ca3af", emoji: "🐱", label: "Kitty" },
  dragon: { color: "#16a34a", emoji: "🐲", label: "Dragon" },
  unicorn: { color: "#f9a8d4", emoji: "🦄", label: "Unicorn" },
};

type Pet = {
  id: string;
  kind: PetKind;
  age: "baby" | "teen" | "adult"; // grows with time-played
  born: number;
  equipped: boolean;
};
type EggSlot = { kind: EggKind; startedAt: number } | null;

const HOUSE_POS: [number, number] = [-14, 0];
const EGG_SHOP_POS: [number, number] = [14, 0];

function World() {
  return (
    <>
      <Sky sunPosition={[100, 30, 100]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#bef264" />
      </mesh>
      {/* paths */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 4]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      {/* Egg shop */}
      <group position={[EGG_SHOP_POS[0], 0, EGG_SHOP_POS[1]]}>
        <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[5, 3, 5]} /><meshStandardMaterial color="#fb7185" /></mesh>
        <mesh position={[0, 3.4, 0]} castShadow><coneGeometry args={[3.6, 1.4, 4]} /><meshStandardMaterial color="#be185d" /></mesh>
        <mesh position={[0, 3.6, 0]} castShadow><boxGeometry args={[2.5, 0.6, 0.2]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        <mesh position={[0, 1.2, 2.55]} castShadow><boxGeometry args={[1.4, 2.0, 0.1]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        {/* eggs out front */}
        {[-2, 0, 2].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 3.5]} castShadow>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color={i === 0 ? "#fafafa" : i === 1 ? "#a855f7" : "#fbbf24"} roughness={0.4} metalness={0.2} />
          </mesh>
        ))}
      </group>
      {/* House */}
      <group position={[HOUSE_POS[0], 0, HOUSE_POS[1]]}>
        <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[6, 3, 5]} /><meshStandardMaterial color="#fde68a" /></mesh>
        <mesh position={[0, 3.5, 0]} castShadow><coneGeometry args={[4.5, 1.6, 4]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <mesh position={[0, 1.0, 2.55]} castShadow><boxGeometry args={[1.2, 2.0, 0.1]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[-1.8, 1.8, 2.55]}><boxGeometry args={[1, 1, 0.05]} /><meshStandardMaterial color="#bae6fd" emissive="#bae6fd" emissiveIntensity={0.3} /></mesh>
        <mesh position={[1.8, 1.8, 2.55]}><boxGeometry args={[1, 1, 0.05]} /><meshStandardMaterial color="#bae6fd" emissive="#bae6fd" emissiveIntensity={0.3} /></mesh>
      </group>
      {/* fence */}
      {[[0, 0.6, 22, 60, 1.2, 0.2], [0, 0.6, -22, 60, 1.2, 0.2], [30, 0.6, 0, 0.2, 1.2, 44], [-30, 0.6, 0, 0.2, 1.2, 44]].map((w, i) => (
        <mesh key={i} position={[w[0], w[1], w[2]]} castShadow><boxGeometry args={[w[3], w[4], w[5]]} /><meshStandardMaterial color="#fafafa" /></mesh>
      ))}
    </>
  );
}

function PetMesh({ pet, target }: { pet: Pet; target: RefObject<THREE.Vector3> }) {
  const ref = useRef<THREE.Group>(null);
  const lerp = useRef(new THREE.Vector3(0, 0.5, 3));
  useFrame((_s, dt) => {
    if (!ref.current || !target.current) return;
    // follow at offset behind player
    const desired = new THREE.Vector3(target.current.x + 1.5, 0.5, target.current.z + 1.5);
    lerp.current.lerp(desired, Math.min(1, dt * 3));
    ref.current.position.copy(lerp.current);
    ref.current.rotation.y += dt * 0.5;
  });
  const scale = pet.age === "baby" ? 0.45 : pet.age === "teen" ? 0.7 : 1.0;
  const c = PET_INFO[pet.kind].color;
  return (
    <group ref={ref}>
      <group scale={scale}>
        <mesh castShadow><sphereGeometry args={[0.4, 14, 14]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh>
        <mesh position={[0, 0.45, 0]} castShadow><sphereGeometry args={[0.3, 14, 14]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh>
        <mesh position={[-0.18, 0.55, 0.25]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#000" /></mesh>
        <mesh position={[0.18, 0.55, 0.25]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#000" /></mesh>
        {pet.kind === "unicorn" && (
          <mesh position={[0, 0.85, 0.1]}><coneGeometry args={[0.06, 0.3, 8]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
        )}
        {pet.kind === "dragon" && (
          <mesh position={[0, 0.5, -0.4]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.6, 0.06, 0.4]} />
            <meshStandardMaterial color={c} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Player({ posRef, inputRef }: {
  posRef: RefObject<{ pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean }>;
  inputRef: RefObject<import("@/hooks/useGameInput").GameInput>;
}) {
  const { camera } = useThree();
  useFrame((_s, dt) => {
    const p = posRef.current; const inp = inputRef.current; if (!p || !inp) return;
    p.yaw -= inp.lookDX; p.pitch -= inp.lookDY;
    p.pitch = Math.max(-1.5, Math.min(1.5, p.pitch));
    inp.lookDX = 0; inp.lookDY = 0;
    const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const m = new THREE.Vector3();
    if (inp.f) m.add(fwd);
    if (inp.b) m.sub(fwd);
    if (inp.r) m.add(right);
    if (inp.l) m.sub(right);
    if (m.lengthSq() > 0) m.normalize().multiplyScalar(inp.sprint ? 8 : 5);
    p.vel.x = m.x; p.vel.z = m.z;
    if (inp.jump && p.onGround) { p.vel.y = 6; p.onGround = false; }
    p.vel.y -= 18 * dt;
    p.pos.addScaledVector(p.vel, dt);
    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }
    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, inp.zoomOut);
  });
  return null;
}

function PetPalsPage() {
  const { user, profile, avatar, addBux, setBuxLocal } = useAuth();
  const input = useGameInput();
  const posRef = useRef({ pos: new THREE.Vector3(0, 1, 6), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true });
  const targetPos = useRef(posRef.current.pos);
  const [pets, setPets] = useState<Pet[]>([]);
  const [egg, setEgg] = useState<EggSlot>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  // grow pets with time
  useEffect(() => {
    const t = setInterval(() => {
      setPets((ps) => ps.map((p) => {
        const ageMs = Date.now() - p.born;
        const age = ageMs > 60_000 ? "adult" : ageMs > 25_000 ? "teen" : "baby";
        return p.age !== age ? { ...p, age } : p;
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  if (!user || !profile || !avatar) return null;

  const buyEgg = (kind: EggKind) => {
    const info = EGG_INFO[kind];
    if (egg) { toast.error("You already have an egg hatching!"); return; }
    if (profile.bux < info.price) { toast.error("Not enough Bux"); return; }
    setBuxLocal(profile.bux - info.price);
    setEgg({ kind, startedAt: Date.now() });
    toast.success(`${info.label} purchased! Hatching...`);
  };

  const tryHatch = () => {
    if (!egg) return;
    const info = EGG_INFO[egg.kind];
    if (Date.now() - egg.startedAt < info.hatchMs) return;
    const kind = info.pool[Math.floor(Math.random() * info.pool.length)];
    const newPet: Pet = { id: crypto.randomUUID(), kind, age: "baby", born: Date.now(), equipped: pets.every((p) => !p.equipped) };
    setPets((ps) => [...ps, newPet]);
    setEgg(null);
    toast.success(`Hatched a ${PET_INFO[kind].label}! ${PET_INFO[kind].emoji}`);
  };

  useEffect(() => {
    if (!egg) return;
    const t = setInterval(tryHatch, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [egg]);

  const equipped = pets.find((p) => p.equipped);
  const eggInfo = egg ? EGG_INFO[egg.kind] : null;
  const eggPct = egg && eggInfo ? Math.min(100, ((Date.now() - egg.startedAt) / eggInfo.hatchMs) * 100) : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <HeaderBar location="Pet Pals" />
      <Canvas shadows camera={{ position: [0, 4, 10], fov: 65 }}>
        <GameAtmosphere preset="garden" />
        <World />
        <Player posRef={posRef} input={input} />
        <SelfAvatar posRef={posRef} inputRef={input} config={avatar} />
        {equipped && <PetMesh pet={equipped} target={targetPos} />}
      </Canvas>

      {/* Egg shop UI */}
      <div className="absolute right-4 top-20 w-72 rounded-2xl border border-border bg-card/95 p-4 shadow-block backdrop-blur">
        <h3 className="mb-2 flex items-center gap-2 font-display text-lg"><Egg className="h-5 w-5" /> Egg Shop</h3>
        <div className="space-y-2">
          {(Object.keys(EGG_INFO) as EggKind[]).map((k) => (
            <button
              key={k}
              onClick={() => buyEgg(k)}
              disabled={!!egg}
              className="flex w-full items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50 hover:bg-primary hover:text-primary-foreground"
            >
              <span>{EGG_INFO[k].label}</span>
              <span className="inline-flex items-center gap-1 text-bux"><Coins className="h-3.5 w-3.5" /> {EGG_INFO[k].price}</span>
            </button>
          ))}
        </div>
        {egg && eggInfo && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">Hatching {eggInfo.label}…</div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${eggPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Pet inventory */}
      <div className="absolute bottom-4 left-4 max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-block backdrop-blur">
        <h3 className="mb-2 flex items-center gap-2 font-display text-lg"><Heart className="h-5 w-5 text-destructive" /> My Pets ({pets.length})</h3>
        <div className="flex flex-wrap gap-2">
          {pets.length === 0 && <div className="text-sm text-muted-foreground">Buy an egg to get a pet!</div>}
          {pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPets((ps) => ps.map((q) => ({ ...q, equipped: q.id === p.id ? !q.equipped : false })))}
              className={`rounded-md border-2 px-3 py-2 text-xs font-bold ${p.equipped ? "border-primary bg-primary/20" : "border-border bg-secondary"}`}
              title={`${PET_INFO[p.kind].label} (${p.age})`}
            >
              {PET_INFO[p.kind].emoji} {PET_INFO[p.kind].label}
              <div className="text-[10px] opacity-70">{p.age}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 rounded-xl border border-border bg-card/90 px-3 py-2 text-xs shadow-block backdrop-blur">
        <Home className="mr-1 inline h-3.5 w-3.5" /> WASD to move · Space to jump · click pet to equip/follow
      </div>

      <Link to="/lobby" className="absolute left-4 top-20 rounded-md bg-secondary px-3 py-1.5 text-xs font-bold shadow-block">← Lobby</Link>
    </div>
  );
}
