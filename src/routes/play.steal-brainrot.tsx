import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { HeaderBar } from "@/components/HeaderBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SelfAvatar } from "@/components/SelfAvatar";
import { RemotePlayers } from "@/components/RemotePlayers";
import { useRoomPlayers } from "@/lib/multiplayer";
import { useGameInput } from "@/hooks/useGameInput";
import { resolveBoxCollisions, type AABB } from "@/lib/collision";
import { applyPlayerCamera } from "@/lib/camera";
import { GameAtmosphere } from "@/components/GameAtmosphere";
import { Coins, Brain, Gamepad2, Keyboard, Timer, Users } from "lucide-react";

export const Route = createFileRoute("/play/steal-brainrot")({
  head: () => ({
    meta: [
      { title: "Steal a Brainrot — BloxWorld" },
      { name: "description", content: "Buy brainrots from the center carpet, send them to your base, and earn money per second." },
    ],
  }),
  component: BrainrotPage,
});

const ARENA_HALF = 35;
const STARTING_CASH = 100;
const MATCH_LEN_SEC = 180;

// Brainrot tiers — name, color, cost, income per second, walk speed
type Tier = { name: string; color: string; cost: number; income: number; speed: number };
const TIERS: Tier[] = [
  { name: "Tung Tung", color: "#f97316", cost: 50, income: 2, speed: 1.4 },
  { name: "Bananini", color: "#facc15", cost: 100, income: 5, speed: 1.2 },
  { name: "Cappuccino", color: "#a16207", cost: 250, income: 12, speed: 1.0 },
  { name: "Tralalero", color: "#22d3ee", cost: 500, income: 28, speed: 0.9 },
  { name: "Bombardiro", color: "#dc2626", cost: 1000, income: 65, speed: 0.8 },
];

// 4 player bases around the central carpet
type BaseSlot = { id: number; pos: [number, number]; color: string; name: string; isPlayer: boolean };
const BASES: BaseSlot[] = [
  { id: 0, pos: [0, -25], color: "#22d3ee", name: "You", isPlayer: true },
  { id: 1, pos: [25, 0], color: "#dc2626", name: "RoboRex", isPlayer: false },
  { id: 2, pos: [0, 25], color: "#16a34a", name: "BloxBot", isPlayer: false },
  { id: 3, pos: [-25, 0], color: "#9333ea", name: "PixelPete", isPlayer: false },
];

const BASE_BOXES: AABB[] = BASES.map((b) => ({
  pos: [b.pos[0], 0.6, b.pos[1]],
  size: [4, 1.2, 4],
}));

const COLLIDERS: AABB[] = [
  ...BASE_BOXES,
  // outer wall ring
  { pos: [0, 1.5, ARENA_HALF], size: [80, 3, 1] },
  { pos: [0, 1.5, -ARENA_HALF], size: [80, 3, 1] },
  { pos: [ARENA_HALF, 1.5, 0], size: [1, 3, 80] },
  { pos: [-ARENA_HALF, 1.5, 0], size: [1, 3, 80] },
];

type Brainrot = {
  id: number;
  tier: number;
  ownerBase: number; // base id this brainrot is heading to / parked at
  pos: THREE.Vector3;
  parked: boolean;
};

type SpawnSlot = {
  tier: number;
  // where on the carpet it appears
  pos: THREE.Vector3;
  // -1 = none / claimed
  claimedBy: number;
  cooldown: number; // seconds until next spawn
};

type Refs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean };
  cash: number[]; // cash per base
  brainrots: Brainrot[];
  spawns: SpawnSlot[];
  brainrotIdSeq: number;
  endsAt: number;
};

function makeRefs(): Refs {
  const spawns: SpawnSlot[] = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return {
      tier: weightedTier(),
      pos: new THREE.Vector3(Math.cos(a) * 4.5, 1, Math.sin(a) * 4.5),
      claimedBy: -1,
      cooldown: 0,
    };
  });
  return {
    player: { pos: new THREE.Vector3(0, 1, -22), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true },
    cash: [STARTING_CASH, STARTING_CASH, STARTING_CASH, STARTING_CASH],
    brainrots: [],
    spawns,
    brainrotIdSeq: 1,
    endsAt: performance.now() + MATCH_LEN_SEC * 1000,
  };
}

function weightedTier(): number {
  // Bias toward cheaper tiers
  const r = Math.random();
  if (r < 0.45) return 0;
  if (r < 0.75) return 1;
  if (r < 0.92) return 2;
  if (r < 0.99) return 3;
  return 4;
}

function World() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Center carpet */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#a21caf" emissive="#a21caf" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.6, 8, 48]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      {/* Bases */}
      {BASES.map((b) => (
        <group key={b.id} position={[b.pos[0], 0, b.pos[1]]}>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 1.2, 4]} />
            <meshStandardMaterial color={b.color} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[3.2, 0.4, 3.2]} />
            <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.4} />
          </mesh>
          {/* Pillar with name */}
          <mesh position={[0, 3, -1.8]} castShadow>
            <boxGeometry args={[0.3, 4, 0.3]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
        </group>
      ))}
      {/* Outer wall */}
      {[
        [0, 1.5, ARENA_HALF, 80, 3, 1],
        [0, 1.5, -ARENA_HALF, 80, 3, 1],
        [ARENA_HALF, 1.5, 0, 1, 3, 80],
        [-ARENA_HALF, 1.5, 0, 1, 3, 80],
      ].map((w, i) => (
        <mesh key={i} position={[w[0], w[1], w[2]]} castShadow>
          <boxGeometry args={[w[3], w[4], w[5]]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </>
  );
}

/** Renders the active brainrots on the floor + spawn pedestals on the carpet. */
function BrainrotMeshes({ refs }: { refs: RefObject<Refs> }) {
  const groupRef = useRef<THREE.Group>(null);
  const spawnGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const r = refs.current;
    if (!r) return;
    // Active brainrots
    if (groupRef.current) {
      const children = groupRef.current.children;
      // ensure enough child meshes (recreate on mismatch)
      // We rely on React re-renders via state changes for new ones — driven by spawn count below.
      for (let i = 0; i < r.brainrots.length; i++) {
        const c = children[i];
        const b = r.brainrots[i];
        if (!c || !b) continue;
        c.position.copy(b.pos);
        c.position.y = 1 + Math.sin(performance.now() * 0.004 + b.id) * 0.1;
      }
    }
    // Spawn pedestals
    if (spawnGroupRef.current) {
      for (let i = 0; i < r.spawns.length; i++) {
        const c = spawnGroupRef.current.children[i];
        const s = r.spawns[i];
        if (!c) continue;
        c.position.copy(s.pos);
        c.visible = s.cooldown <= 0 && s.claimedBy === -1;
        c.position.y = 1 + Math.sin(performance.now() * 0.003 + i) * 0.1;
      }
    }
  });

  // We re-key the groups on length changes via a state we get from the parent.
  return (
    <>
      <group ref={spawnGroupRef}>
        {refs.current?.spawns.map((s, i) => {
          const t = TIERS[s.tier];
          return (
            <group key={i}>
              <mesh castShadow>
                <boxGeometry args={[0.9, 0.9, 0.9]} />
                <meshStandardMaterial color={t.color} emissive={t.color} emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[-0.18, 0.15, 0.46]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[0.18, 0.15, 0.46]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[-0.18, 0.15, 0.52]}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
              <mesh position={[0.18, 0.15, 0.52]}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
            </group>
          );
        })}
      </group>
      <group ref={groupRef}>
        {refs.current?.brainrots.map((b) => {
          const t = TIERS[b.tier];
          return (
            <group key={b.id}>
              <mesh castShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color={t.color} emissive={t.color} emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[-0.18, 0.1, 0.41]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[0.18, 0.1, 0.41]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[-0.18, 0.1, 0.46]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
              <mesh position={[0.18, 0.1, 0.46]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}

function PlayerCtl({ refs, input, onPurchase }: {
  refs: RefObject<Refs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number; zoomOut: boolean }>;
  onPurchase: (tier: number) => void;
}) {
  const { camera } = useThree();
  const lastAction = useRef(false);

  useFrame((_s, dt) => {
    const r = refs.current; if (!r) return;
    const p = r.player;
    p.yaw -= input.current.lookDX;
    p.pitch -= input.current.lookDY;
    p.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, p.pitch));
    input.current.lookDX = 0; input.current.lookDY = 0;

    const speed = input.current.sprint ? 9 : 6;
    const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const m = new THREE.Vector3();
    if (input.current.f) m.add(fwd);
    if (input.current.b) m.sub(fwd);
    if (input.current.r) m.add(right);
    if (input.current.l) m.sub(right);
    if (m.lengthSq() > 0) m.normalize().multiplyScalar(speed);
    p.vel.x = m.x; p.vel.z = m.z;

    if (input.current.jump && p.onGround) { p.vel.y = 6; p.onGround = false; }
    p.vel.y -= 18 * dt;
    p.pos.addScaledVector(p.vel, dt);
    resolveBoxCollisions(p.pos, COLLIDERS);
    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }
    p.pos.x = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, p.pos.x));
    p.pos.z = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, p.pos.z));

    // Action edge → buy nearest spawn
    const a = input.current.action;
    if (a && !lastAction.current) {
      let best = -1, bestD = 2.5 * 2.5;
      r.spawns.forEach((s, i) => {
        if (s.cooldown > 0 || s.claimedBy !== -1) return;
        const dx = s.pos.x - p.pos.x, dz = s.pos.z - p.pos.z;
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) {
        const s = r.spawns[best];
        const tier = TIERS[s.tier];
        if (r.cash[0] >= tier.cost) {
          r.cash[0] -= tier.cost;
          // Spawn brainrot heading to player's base
          r.brainrots.push({
            id: r.brainrotIdSeq++,
            tier: s.tier,
            ownerBase: 0,
            pos: s.pos.clone(),
            parked: false,
          });
          s.claimedBy = 0;
          s.cooldown = 5 + Math.random() * 4;
          onPurchase(s.tier);
        } else {
          // not enough cash - tiny visual feedback via toast outside
        }
      }
    }
    lastAction.current = a;

    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);
  });
  return null;
}

function WorldCtl({ refs, onTick }: { refs: RefObject<Refs>; onTick: () => void }) {
  const tickAcc = useRef(0);
  const botBuyAcc = useRef([2, 3, 4]);

  useFrame((_s, dt) => {
    const r = refs.current; if (!r) return;

    // Spawn cooldown decay & re-roll tier when cooldown finishes
    for (const s of r.spawns) {
      if (s.cooldown > 0) {
        s.cooldown -= dt;
        if (s.cooldown <= 0) { s.cooldown = 0; s.claimedBy = -1; s.tier = weightedTier(); }
      }
    }

    // Move brainrots toward their owner base
    for (const b of r.brainrots) {
      if (b.parked) continue;
      const base = BASES[b.ownerBase];
      const dir = new THREE.Vector3(base.pos[0] - b.pos.x, 0, base.pos[1] - b.pos.z);
      const d = dir.length();
      if (d < 2.5) {
        b.parked = true;
        // park around base in a small ring
        const ang = Math.random() * Math.PI * 2;
        b.pos.set(base.pos[0] + Math.cos(ang) * 2.6, 1, base.pos[1] + Math.sin(ang) * 2.6);
      } else {
        const tier = TIERS[b.tier];
        dir.normalize().multiplyScalar(tier.speed * dt);
        b.pos.add(dir);
      }
    }

    // Per-second income tick
    tickAcc.current += dt;
    if (tickAcc.current >= 1) {
      tickAcc.current = 0;
      for (const b of r.brainrots) {
        if (!b.parked) continue;
        r.cash[b.ownerBase] += TIERS[b.tier].income;
      }

      // Bots buy occasionally
      for (let bi = 1; bi <= 3; bi++) {
        botBuyAcc.current[bi - 1] -= 1;
        if (botBuyAcc.current[bi - 1] <= 0) {
          botBuyAcc.current[bi - 1] = 3 + Math.floor(Math.random() * 3);
          // pick best affordable spawn
          let bestSlot = -1, bestTier = -1;
          for (let i = 0; i < r.spawns.length; i++) {
            const s = r.spawns[i];
            if (s.cooldown > 0 || s.claimedBy !== -1) continue;
            const tier = TIERS[s.tier];
            if (r.cash[bi] >= tier.cost && s.tier > bestTier) {
              bestTier = s.tier; bestSlot = i;
            }
          }
          if (bestSlot >= 0) {
            const s = r.spawns[bestSlot];
            const tier = TIERS[s.tier];
            r.cash[bi] -= tier.cost;
            r.brainrots.push({
              id: r.brainrotIdSeq++, tier: s.tier, ownerBase: bi,
              pos: s.pos.clone(), parked: false,
            });
            s.claimedBy = bi;
            s.cooldown = 5 + Math.random() * 4;
          }
        }
      }
      onTick();
    }
  });

  return null;
}

function BrainrotPage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<Refs>(makeRefs());
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [, setTick] = useState(0);
  const [over, setOver] = useState(false);
  const [bux, setBux] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MATCH_LEN_SEC);

  const getSelfState = useCallback(() => {
    const p = refs.current.player;
    return {
      px: p.pos.x, py: p.pos.y, pz: p.pos.z, yaw: p.yaw,
      anim: p.vel.lengthSq() > 0.5 ? ("walk" as const) : ("idle" as const),
      hp: 100,
    };
  }, []);
  const { playersRef, version } = useRoomPlayers({
    game: "steal-brainrot",
    selfUserId: user?.id ?? null,
    selfUsername: profile?.username ?? null,
    getSelfState,
  });

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () => supabase.from("presence").upsert({
      user_id: user.id, username: profile.username, location: "steal-brainrot", last_seen: new Date().toISOString(),
    });
    void upsert();
    const i = setInterval(upsert, 20000);
    return () => clearInterval(i);
  }, [user, profile]);

  // Timer + end-of-match
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((refs.current.endsAt - performance.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && !over) {
        setOver(true);
        // Bux awarded = 10% of final cash, min 10
        const earned = Math.max(10, Math.floor(refs.current.cash[0] * 0.1));
        setBux(earned);
        addBux(earned);
        if (user && profile) {
          void supabase.from("game_scores").insert({
            user_id: user.id, username: profile.username, game: "steal-brainrot",
            score: refs.current.cash[0], bux_earned: earned,
          });
          void supabase.from("profiles").update({ bux: (profile.bux ?? 0) + earned }).eq("id", user.id);
          toast.success(`+${earned} Bux earned!`);
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [over, user, profile, addBux]);

  const restart = () => {
    refs.current = makeRefs();
    setOver(false); setBux(0); setTimeLeft(MATCH_LEN_SEC);
    containerRef.current?.requestPointerLock?.();
  };

  if (!user || !profile || !avatar) return null;

  const cash = refs.current.cash[0];
  const myCount = refs.current.brainrots.filter((b) => b.ownerBase === 0 && b.parked).length;
  const incomePerSec = refs.current.brainrots
    .filter((b) => b.ownerBase === 0 && b.parked)
    .reduce((sum, b) => sum + TIERS[b.tier].income, 0);

  return (
    <div className="min-h-screen">
      <HeaderBar location="Steal a Brainrot" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, -22], fov: 75 }} dpr={[1, 1.75]} gl={{ antialias: true, toneMappingExposure: 1.05 }}>
            <Sky sunPosition={[50, 30, 50]} />
            <fog attach="fog" args={["#1a0b2e", 35, 110]} />
            <GameAtmosphere preset="tycoon" contactPos={[0, 0, 0]} contactScale={120} />
            <World />
            <BrainrotMeshes refs={refs} />
            <SelfAvatar posRef={{ current: refs.current.player }} inputRef={input} config={avatar} />
            <PlayerCtl refs={refs} input={input} onPurchase={() => setTick((t) => t + 1)} />
            <WorldCtl refs={refs} onTick={() => setTick((t) => t + 1)} />
            <RemotePlayers playersRef={playersRef} version={version} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-black/65 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70"><Coins className="h-3.5 w-3.5 text-bux" /> Cash</div>
                <div className="font-display text-2xl text-bux">${cash}</div>
                <div className="text-xs text-white/70">+${incomePerSec}/s</div>
              </div>
              <div className="rounded-xl bg-black/65 px-4 py-3 text-center text-white backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-white/70"><Timer className="h-3.5 w-3.5" /> Time</div>
                <div className="font-display text-2xl">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div>
              </div>
              <div className="rounded-xl bg-black/65 px-4 py-3 text-right text-white backdrop-blur">
                <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-white/70"><Brain className="h-3.5 w-3.5" /> Brainrots</div>
                <div className="font-display text-2xl">{myCount}</div>
              </div>
            </div>

            {/* Tier price legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {TIERS.map((t, i) => (
                <div key={i} className="rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                  <span className="inline-block h-2 w-2 rounded-sm align-middle" style={{ background: t.color }} /> {t.name}
                  <span className="ml-1 text-bux">${t.cost}</span>
                  <span className="ml-1 text-white/60">+${t.income}/s</span>
                </div>
              ))}
            </div>

            {!locked && !over && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Steal a Brainrot</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Walk to the center carpet, press <b>E</b> on a brainrot to buy it. It walks back to your base and pays you per second. Start: $100.</p>
                  <button onClick={() => containerRef.current?.requestPointerLock?.()} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · E buy · Shift sprint · V zoom-out</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT buy · A jump · R-stick look {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {over && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/70 backdrop-blur">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Time's up!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Final cash: <b className="text-bux">${cash}</b></p>
                  <p className="mt-1 text-bux">+{bux} Bux earned</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={restart} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground shadow-block">Play again</button>
                    <Link to="/lobby" className="rounded-lg bg-secondary px-4 py-2 font-bold">Lobby</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
