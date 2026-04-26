import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useGameInput } from "@/hooks/useGameInput";
import { resolveBoxCollisions, type AABB } from "@/lib/collision";
import { applyPlayerCamera } from "@/lib/camera";
import { Coins, Brain, Timer, Gamepad2, Keyboard } from "lucide-react";

export const Route = createFileRoute("/play/steal-brainrot")({
  head: () => ({
    meta: [
      { title: "Steal a Brainrot — BloxWorld" },
      { name: "description", content: "Run across plots and snatch the silliest items before the bots get them." },
    ],
  }),
  component: BrainrotPage,
});

const PLOT_HALF = 26;

const BRAINROT_NAMES = ["Tung Tung", "Bombardiro", "Tralalero", "Bananini", "Cappuccino", "Lirili", "Brrr-brrr", "Trippi"];
const BRAINROT_COLORS = ["#f97316", "#a21caf", "#facc15", "#22d3ee", "#84cc16", "#ec4899", "#3b82f6", "#fb7185"];

const PLOT_BOXES: AABB[] = [
  // Plot fences (low walls)
  { pos: [-15, 0.6, 0], size: [0.4, 1.2, 18] },
  { pos: [15, 0.6, 0], size: [0.4, 1.2, 18] },
  { pos: [0, 0.6, -15], size: [18, 1.2, 0.4] },
  { pos: [0, 0.6, 15], size: [18, 1.2, 0.4] },
  // Center pedestal
  { pos: [0, 0.5, 0], size: [3, 1, 3] },
];

type Item = { pos: THREE.Vector3; name: string; color: string; held: "none" | "player" | number; respawn: number };
type Holder = { pos: THREE.Vector3; vel: THREE.Vector3; carrying: number | null; color: string; speed: number; baseTimer: number; targetItem: number | null };

type Refs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean; carrying: number | null };
  bots: Holder[];
  items: Item[];
  scoreP: number;
  scoreBots: number[];
  endsAt: number;
  startedAt: number;
};

function makeRefs(): Refs {
  const items: Item[] = BRAINROT_NAMES.map((n, i) => {
    const a = (i / BRAINROT_NAMES.length) * Math.PI * 2;
    const r = 9 + (i % 3) * 3;
    return { pos: new THREE.Vector3(Math.cos(a) * r, 1, Math.sin(a) * r), name: n, color: BRAINROT_COLORS[i], held: "none", respawn: 0 };
  });
  const bots: Holder[] = Array.from({ length: 4 }, (_, i) => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 30, 1, (Math.random() - 0.5) * 30),
    vel: new THREE.Vector3(),
    carrying: null,
    color: ["#7c3aed", "#0ea5e9", "#16a34a", "#dc2626"][i],
    speed: 2.6 + Math.random() * 1.2,
    baseTimer: 0,
    targetItem: null,
  }));
  return {
    player: { pos: new THREE.Vector3(0, 1, -22), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true, carrying: null },
    bots,
    items,
    scoreP: 0,
    scoreBots: [0, 0, 0, 0],
    endsAt: performance.now() + 90_000,
    startedAt: performance.now(),
  };
}

function World() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0c4a6e" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#65a30d" />
      </mesh>
      {/* Center pedestal */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      {/* Fences */}
      {PLOT_BOXES.slice(0, 4).map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
      ))}
      {/* Player base marker */}
      <mesh position={[0, 0.02, -22]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2, 24]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Bot bases */}
      {[[18, -18], [-18, 18], [-18, -18], [18, 18]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.02, p[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.8, 24]} />
          <meshBasicMaterial color="#f87171" opacity={0.7} transparent />
        </mesh>
      ))}
    </>
  );
}

function ItemMesh({ item, idx, refs }: { item: Item; idx: number; refs: RefObject<Refs> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const r = refs.current;
    if (!r || !ref.current) return;
    const it = r.items[idx];
    if (it.held === "player") {
      ref.current.position.set(r.player.pos.x, r.player.pos.y + 2.6, r.player.pos.z);
      ref.current.visible = true;
    } else if (typeof it.held === "number") {
      const b = r.bots[it.held];
      ref.current.position.set(b.pos.x, b.pos.y + 2.6, b.pos.z);
      ref.current.visible = true;
    } else if (it.respawn > 0) {
      ref.current.visible = false;
    } else {
      ref.current.position.copy(it.pos);
      ref.current.visible = true;
      ref.current.position.y = 1 + Math.sin(s.clock.elapsedTime * 2 + idx) * 0.15;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <group ref={ref} position={item.pos}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.25} />
      </mesh>
      {/* eyes for the brainrot creature */}
      <mesh position={[-0.15, 0.1, 0.36]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
      <mesh position={[0.15, 0.1, 0.36]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
      <mesh position={[-0.15, 0.1, 0.42]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
      <mesh position={[0.15, 0.1, 0.42]}><sphereGeometry args={[0.04, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
    </group>
  );
}

function PlayerCtl({ refs, input, onScore }: {
  refs: RefObject<Refs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number; zoomOut: boolean }>;
  onScore: () => void;
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

    const speed = (input.current.sprint ? 9 : 6) * (p.carrying !== null ? 0.7 : 1);
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

    resolveBoxCollisions(p.pos, PLOT_BOXES);

    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }

    p.pos.x = Math.max(-PLOT_HALF, Math.min(PLOT_HALF, p.pos.x));
    p.pos.z = Math.max(-PLOT_HALF, Math.min(PLOT_HALF, p.pos.z));

    // Pickup / drop on E (action edge)
    const a = input.current.action;
    if (a && !lastAction.current) {
      if (p.carrying === null) {
        // pickup nearest
        let best = -1, bestD = 2.5 * 2.5;
        r.items.forEach((it, idx) => {
          if (it.held !== "none" || it.respawn > 0) return;
          const dx = it.pos.x - p.pos.x, dz = it.pos.z - p.pos.z;
          const d = dx * dx + dz * dz;
          if (d < bestD) { bestD = d; best = idx; }
        });
        if (best >= 0) { r.items[best].held = "player"; p.carrying = best; }
      } else {
        // drop / score if at base
        const atBase = Math.hypot(p.pos.x - 0, p.pos.z - (-22)) < 2.2;
        const it = r.items[p.carrying];
        if (atBase) {
          r.scoreP += 1;
          it.held = "none"; it.respawn = 4;
          onScore();
        } else {
          // drop where standing
          it.pos.copy(p.pos); it.pos.y = 1; it.held = "none";
        }
        p.carrying = null;
      }
    }
    lastAction.current = a;

    // If carrying and tackled by a bot? bots can steal
    if (p.carrying !== null) {
      for (let bi = 0; bi < r.bots.length; bi++) {
        const b = r.bots[bi];
        if (b.carrying !== null) continue;
        if (b.pos.distanceTo(p.pos) < 1.1) {
          const idx = p.carrying;
          r.items[idx].held = bi;
          b.carrying = idx;
          p.carrying = null;
          break;
        }
      }
    }

    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);
  });
  return null;
}

function WorldCtl({ refs, onBotScore }: { refs: RefObject<Refs>; onBotScore: () => void }) {
  const BOT_BASES: [number, number][] = [[18, -18], [-18, 18], [-18, -18], [18, 18]];
  useFrame((_s, dt) => {
    const r = refs.current; if (!r) return;

    // Item respawn timers
    for (const it of r.items) {
      if (it.respawn > 0) {
        it.respawn -= dt;
        if (it.respawn <= 0) {
          // respawn at random plot point
          const a = Math.random() * Math.PI * 2; const rad = 6 + Math.random() * 8;
          it.pos.set(Math.cos(a) * rad, 1, Math.sin(a) * rad);
        }
      }
    }

    for (let bi = 0; bi < r.bots.length; bi++) {
      const b = r.bots[bi];
      b.baseTimer -= dt;
      // pick a target item if not carrying
      if (b.carrying === null) {
        if (b.targetItem === null || r.items[b.targetItem].held !== "none") {
          let best = -1, bestD = Infinity;
          r.items.forEach((it, idx) => {
            if (it.held !== "none" || it.respawn > 0) return;
            const dx = it.pos.x - b.pos.x, dz = it.pos.z - b.pos.z;
            const d = dx * dx + dz * dz;
            if (d < bestD) { bestD = d; best = idx; }
          });
          b.targetItem = best === -1 ? null : best;
        }
        if (b.targetItem !== null) {
          const it = r.items[b.targetItem];
          const dir = it.pos.clone().sub(b.pos); dir.y = 0;
          const d = dir.length();
          if (d < 1.0) { it.held = bi; b.carrying = b.targetItem; b.targetItem = null; }
          else { dir.normalize().multiplyScalar(b.speed * dt); b.pos.add(dir); }
        }
      } else {
        // head to base
        const base = BOT_BASES[bi];
        const dir = new THREE.Vector3(base[0] - b.pos.x, 0, base[1] - b.pos.z);
        const d = dir.length();
        if (d < 1.5) {
          // score
          r.scoreBots[bi] += 1;
          const it = r.items[b.carrying];
          it.held = "none"; it.respawn = 4;
          b.carrying = null;
          onBotScore();
        } else {
          dir.normalize().multiplyScalar(b.speed * 0.85 * dt);
          b.pos.add(dir);
        }
      }
      resolveBoxCollisions(b.pos, PLOT_BOXES);
      b.pos.x = Math.max(-PLOT_HALF, Math.min(PLOT_HALF, b.pos.x));
      b.pos.z = Math.max(-PLOT_HALF, Math.min(PLOT_HALF, b.pos.z));
    }
  });
  return null;
}

function Bots({ refs }: { refs: RefObject<Refs> }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const r = refs.current;
    if (!r || !groupRef.current) return;
    for (let i = 0; i < r.bots.length; i++) {
      const c = groupRef.current.children[i];
      if (c) c.position.copy(r.bots[i].pos);
    }
  });
  const bots = refs.current?.bots ?? [];
  return (
    <group ref={groupRef}>
      {bots.map((b, i) => (
        <BlockyAvatar key={i} walking config={{ rig: i % 2 ? "R6" : "R15", skin_color: "#f5c896", shirt_color: b.color, pants_color: "#1f2937", face: "wink", hat: "cap" }} />
      ))}
    </group>
  );
}

function BrainrotPage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<Refs>(makeRefs());
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [score, setScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [over, setOver] = useState(false);
  const [bux, setBux] = useState(0);

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

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((refs.current.endsAt - performance.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && !over) {
        setOver(true);
        const earned = 10 + refs.current.scoreP * 25;
        setBux(earned);
        addBux(earned);
        if (user && profile) {
          void supabase.from("game_scores").insert({
            user_id: user.id, username: profile.username, game: "steal-brainrot", score: refs.current.scoreP, bux_earned: earned,
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
    setScore(0); setBotScore(0); setOver(false); setTimeLeft(90); setBux(0);
    containerRef.current?.requestPointerLock?.();
  };

  if (!user || !profile || !avatar) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location="Steal a Brainrot" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, -22], fov: 75 }}>
            <Sky sunPosition={[50, 30, 50]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[20, 30, 10]} intensity={1.1} castShadow />
            <World />
            {refs.current.items.map((it, i) => (
              <ItemMesh key={i} item={it} idx={i} refs={refs} />
            ))}
            <Bots refs={refs} />
            <PlayerCtl refs={refs} input={input} onScore={() => setScore((s) => s + 1)} />
            <WorldCtl refs={refs} onBotScore={() => setBotScore(refs.current.scoreBots.reduce((a, b) => a + b, 0))} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70"><Brain className="h-3.5 w-3.5" /> You</div>
                <div className="font-display text-2xl text-white">{score}</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-center text-white backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-white/70"><Timer className="h-3.5 w-3.5" /> Time</div>
                <div className="font-display text-2xl">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-right text-white backdrop-blur">
                <div className="text-xs uppercase tracking-wider text-white/70">Rivals</div>
                <div className="font-display text-2xl">{botScore}</div>
              </div>
            </div>

            {!locked && !over && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Steal a Brainrot</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Grab brainrots, run them back to your cyan ring. +25 Bux each.</p>
                  <button onClick={() => containerRef.current?.requestPointerLock?.()} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · E grab/drop · Shift sprint · Space jump</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT grab · A jump · R-stick look {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {over && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/75 backdrop-blur-sm">
                <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl text-primary">Round Over</h2>
                  <p className="mt-1 text-sm text-muted-foreground">You {score} · Rivals {botScore}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bux/15 px-4 py-2 text-bux">
                    <Coins className="h-5 w-5" /> <span className="font-display text-xl">+{bux} Bux</span>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button onClick={restart} className="flex-1 rounded-lg bg-primary py-3 font-display text-primary-foreground shadow-block">Again</button>
                    <Link to="/lobby" className="flex-1 rounded-lg bg-secondary py-3 font-display shadow-block">Lobby</Link>
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
