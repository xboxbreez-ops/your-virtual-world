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
import { Heart, Crosshair, Coins, Gamepad2, Keyboard, Skull } from "lucide-react";

export const Route = createFileRoute("/play/rivals")({
  head: () => ({
    meta: [
      { title: "Rivals Arena — BloxWorld" },
      { name: "description", content: "Fast-paced 3D arena shooter against bot rivals. Earn Bux per elimination." },
    ],
  }),
  component: RivalsPage,
});

const ARENA_HALF = 22;

const COVER: AABB[] = [
  { pos: [-8, 1, -4], size: [3, 2, 1] },
  { pos: [8, 1, 4], size: [1, 2, 4] },
  { pos: [0, 1.5, -10], size: [6, 3, 1] },
  { pos: [-12, 1, 8], size: [1, 2, 5] },
  { pos: [10, 1, -10], size: [4, 2, 1] },
  { pos: [-4, 1, 10], size: [2, 2, 2] },
  { pos: [6, 1, -2], size: [1.5, 2, 1.5] },
];

type Bullet = { pos: THREE.Vector3; vel: THREE.Vector3; from: "player" | "bot"; life: number };
type Bot = { pos: THREE.Vector3; vel: THREE.Vector3; hp: number; alive: boolean; cooldown: number; color: string; targetTimer: number; wander: THREE.Vector3 };

type GRefs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean; alive: boolean; hp: number; ammo: number; reload: number; fireCd: number };
  bots: Bot[];
  bullets: Bullet[];
  kills: number;
};

function makeRefs(): GRefs {
  return {
    player: { pos: new THREE.Vector3(0, 1, 12), vel: new THREE.Vector3(), yaw: Math.PI, pitch: 0, onGround: true, alive: true, hp: 100, ammo: 12, reload: 0, fireCd: 0 },
    bots: Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return {
        pos: new THREE.Vector3(Math.cos(a) * 14, 1, Math.sin(a) * 14),
        vel: new THREE.Vector3(),
        hp: 60, alive: true, cooldown: 1 + Math.random(),
        color: ["#dc2626", "#16a34a", "#2563eb", "#9333ea", "#f59e0b"][i],
        targetTimer: 0, wander: new THREE.Vector3((Math.random()-.5)*20, 1, (Math.random()-.5)*20),
      };
    }),
    bullets: [],
    kills: 0,
  };
}

function Arena() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Floor grid */}
      <gridHelper args={[60, 30, "#3b82f6", "#1e293b"]} position={[0, 0.01, 0]} />
      {/* Walls */}
      {[
        [0, 1.5, ARENA_HALF, 60, 3, 1],
        [0, 1.5, -ARENA_HALF, 60, 3, 1],
        [ARENA_HALF, 1.5, 0, 1, 3, 60],
        [-ARENA_HALF, 1.5, 0, 1, 3, 60],
      ].map((w, i) => (
        <mesh key={i} position={[w[0], w[1], w[2]]} castShadow>
          <boxGeometry args={[w[3], w[4], w[5]]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
      {/* Cover blocks */}
      {COVER.map((c, i) => (
        <group key={i} position={c.pos}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={c.size} />
            <meshStandardMaterial color={i % 2 === 0 ? "#7c3aed" : "#0ea5e9"} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ARENA_BOUNDS(): AABB[] {
  // Outer walls as collision boxes (player can't leave arena, can't climb cover)
  return [
    { pos: [0, 1.5, ARENA_HALF], size: [60, 3, 1] },
    { pos: [0, 1.5, -ARENA_HALF], size: [60, 3, 1] },
    { pos: [ARENA_HALF, 1.5, 0], size: [1, 3, 60] },
    { pos: [-ARENA_HALF, 1.5, 0], size: [1, 3, 60] },
    ...COVER,
  ];
}

function PlayerCtl({ refs, input, hudUpdate, gameOver }: {
  refs: RefObject<GRefs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number }>;
  hudUpdate: (hp: number, ammo: number, reload: number) => void;
  gameOver: () => void;
}) {
  const { camera } = useThree();
  const colliders = useRef(ARENA_BOUNDS());
  const lastReport = useRef({ hp: 100, ammo: 12, reload: 0 });

  useFrame((_s, dt) => {
    const r = refs.current;
    if (!r) return;
    const p = r.player;
    if (!p.alive) return;

    p.yaw -= input.current.lookDX;
    p.pitch -= input.current.lookDY;
    p.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, p.pitch));
    input.current.lookDX = 0;
    input.current.lookDY = 0;

    const speed = input.current.sprint ? 10 : 6.5;
    const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const m = new THREE.Vector3();
    if (input.current.f) m.add(fwd);
    if (input.current.b) m.sub(fwd);
    if (input.current.r) m.add(right);
    if (input.current.l) m.sub(right);
    if (m.lengthSq() > 0) m.normalize().multiplyScalar(speed);
    p.vel.x = m.x; p.vel.z = m.z;

    if (input.current.jump && p.onGround) { p.vel.y = 7; p.onGround = false; }
    p.vel.y -= 18 * dt;

    p.pos.addScaledVector(p.vel, dt);
    resolveBoxCollisions(p.pos, colliders.current);

    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }
    else p.onGround = false;

    // Shooting
    p.fireCd = Math.max(0, p.fireCd - dt);
    if (p.reload > 0) {
      p.reload = Math.max(0, p.reload - dt);
      if (p.reload === 0) p.ammo = 12;
    }
    if (input.current.action && p.ammo > 0 && p.fireCd === 0 && p.reload === 0) {
      p.fireCd = 0.18;
      p.ammo -= 1;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const muzzle = camera.position.clone().add(dir.clone().multiplyScalar(0.6));
      r.bullets.push({ pos: muzzle, vel: dir.multiplyScalar(45), from: "player", life: 1.2 });
      if (p.ammo === 0) p.reload = 1.4;
    }

    // Camera
    camera.position.set(p.pos.x, p.pos.y + 1.6, p.pos.z);
    camera.quaternion.setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));

    p.hp = Math.max(0, p.hp);
    if (
      lastReport.current.hp !== Math.floor(p.hp) ||
      lastReport.current.ammo !== p.ammo ||
      Math.abs(lastReport.current.reload - p.reload) > 0.05
    ) {
      lastReport.current = { hp: Math.floor(p.hp), ammo: p.ammo, reload: p.reload };
      hudUpdate(p.hp, p.ammo, p.reload);
    }
    if (p.hp <= 0) { p.alive = false; gameOver(); }
  });

  return null;
}

function WorldCtl({ refs, onKill }: { refs: RefObject<GRefs>; onKill: () => void }) {
  const colliders = useRef(ARENA_BOUNDS());

  useFrame((_s, dt) => {
    const r = refs.current;
    if (!r) return;

    // Bots
    for (const b of r.bots) {
      if (!b.alive) continue;
      b.targetTimer -= dt;
      if (b.targetTimer <= 0) {
        b.targetTimer = 2 + Math.random() * 2;
        b.wander.set((Math.random()-.5) * (ARENA_HALF*1.6), 1, (Math.random()-.5) * (ARENA_HALF*1.6));
      }
      // Move toward player when close, otherwise wander
      const toPlayer = r.player.pos.clone().sub(b.pos); toPlayer.y = 0;
      const distP = toPlayer.length();
      const target = distP < 18 && r.player.alive ? r.player.pos : b.wander;
      const dir = target.clone().sub(b.pos); dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        dir.normalize().multiplyScalar(3 * dt);
        b.pos.add(dir);
        resolveBoxCollisions(b.pos, colliders.current);
      }

      // Shoot at player on cooldown
      b.cooldown -= dt;
      if (b.cooldown <= 0 && r.player.alive && distP < 22) {
        b.cooldown = 1.0 + Math.random() * 1.2;
        const aim = r.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(b.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
        aim.normalize();
        // Spread
        aim.x += (Math.random() - 0.5) * 0.05;
        aim.y += (Math.random() - 0.5) * 0.05;
        aim.z += (Math.random() - 0.5) * 0.05;
        aim.normalize().multiplyScalar(35);
        r.bullets.push({ pos: b.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), vel: aim, from: "bot", life: 1.5 });
      }
    }

    // Bullets
    for (let i = r.bullets.length - 1; i >= 0; i--) {
      const bl = r.bullets[i];
      bl.life -= dt;
      bl.pos.addScaledVector(bl.vel, dt);

      let removed = false;

      // Hit world
      for (const c of colliders.current) {
        if (
          Math.abs(bl.pos.x - c.pos[0]) < c.size[0] / 2 &&
          Math.abs(bl.pos.z - c.pos[2]) < c.size[2] / 2 &&
          bl.pos.y > c.pos[1] - c.size[1] / 2 && bl.pos.y < c.pos[1] + c.size[1] / 2
        ) { r.bullets.splice(i, 1); removed = true; break; }
      }
      if (removed) continue;

      // Hit player
      if (bl.from === "bot" && r.player.alive) {
        const dx = bl.pos.x - r.player.pos.x;
        const dy = bl.pos.y - (r.player.pos.y + 1.2);
        const dz = bl.pos.z - r.player.pos.z;
        if (dx * dx + dy * dy + dz * dz < 0.7 * 0.7) {
          r.player.hp -= 12;
          r.bullets.splice(i, 1);
          continue;
        }
      }
      // Hit bots
      if (bl.from === "player") {
        let hit = false;
        for (const b of r.bots) {
          if (!b.alive) continue;
          const dx = bl.pos.x - b.pos.x;
          const dy = bl.pos.y - (b.pos.y + 1.2);
          const dz = bl.pos.z - b.pos.z;
          if (dx * dx + dy * dy + dz * dz < 0.8 * 0.8) {
            b.hp -= 25;
            if (b.hp <= 0) { b.alive = false; r.kills += 1; onKill(); }
            r.bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      if (bl.life <= 0 || Math.abs(bl.pos.x) > ARENA_HALF || Math.abs(bl.pos.z) > ARENA_HALF || bl.pos.y < 0) {
        r.bullets.splice(i, 1);
      }
    }

    // Respawn bots over time so the arena stays alive
    for (const b of r.bots) {
      if (!b.alive) {
        b.cooldown -= dt;
        if (b.cooldown < -3) {
          b.alive = true; b.hp = 60; b.cooldown = 1 + Math.random();
          b.pos.set((Math.random()-.5)*(ARENA_HALF*1.6), 1, (Math.random()-.5)*(ARENA_HALF*1.6));
        }
      }
    }
  });

  return null;
}

function Bots({ refs }: { refs: RefObject<GRefs> }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const r = refs.current;
    if (!r || !groupRef.current) return;
    for (let i = 0; i < r.bots.length; i++) {
      const b = r.bots[i];
      const c = groupRef.current.children[i];
      if (!c) continue;
      c.position.copy(b.pos);
      c.visible = b.alive;
    }
  });
  const bots = refs.current?.bots ?? [];
  return (
    <group ref={groupRef}>
      {bots.map((b, i) => (
        <BlockyAvatar key={i} walking config={{ rig: "R6", skin_color: "#f5c896", shirt_color: b.color, pants_color: "#0f172a", face: "angry", hat: "horns" }} />
      ))}
    </group>
  );
}

function Bullets({ refs }: { refs: RefObject<GRefs> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  useFrame(() => {
    const r = refs.current;
    if (!r || !ref.current) return;
    const list = r.bullets;
    for (let i = 0; i < 80; i++) {
      const b = list[i];
      if (b) {
        dummy.current.position.copy(b.pos);
        dummy.current.scale.setScalar(1);
      } else {
        dummy.current.scale.setScalar(0);
      }
      dummy.current.updateMatrix();
      ref.current.setMatrixAt(i, dummy.current.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 80]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color="#fde047" />
    </instancedMesh>
  );
}

function RivalsPage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<GRefs>(makeRefs());
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [hp, setHp] = useState(100);
  const [ammo, setAmmo] = useState(12);
  const [reload, setReload] = useState(0);
  const [kills, setKills] = useState(0);
  const [alive, setAlive] = useState(true);
  const [bux, setBux] = useState(0);

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () => supabase.from("presence").upsert({
      user_id: user.id, username: profile.username, location: "rivals", last_seen: new Date().toISOString(),
    });
    void upsert();
    const i = setInterval(upsert, 20000);
    return () => clearInterval(i);
  }, [user, profile]);

  const onKill = () => setKills((k) => k + 1);

  const onGameOver = async () => {
    if (!user || !profile) return;
    const k = refs.current.kills;
    const earned = 5 + k * 15;
    setBux(earned);
    addBux(earned);
    await supabase.from("game_scores").insert({
      user_id: user.id, username: profile.username, game: "rivals", score: k, bux_earned: earned,
    });
    await supabase.from("profiles").update({ bux: (profile.bux ?? 0) + earned }).eq("id", user.id);
    toast.success(`+${earned} Bux earned!`);
  };

  const restart = () => {
    refs.current = makeRefs();
    setHp(100); setAmmo(12); setReload(0); setKills(0); setAlive(true); setBux(0);
    containerRef.current?.requestPointerLock?.();
  };

  if (!user || !profile || !avatar) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location="Rivals" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, 12], fov: 75 }}>
            <Sky sunPosition={[10, 5, 10]} turbidity={6} />
            <fog attach="fog" args={["#0f172a", 20, 60]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
            <Arena />
            <Bots refs={refs} />
            <Bullets refs={refs} />
            <PlayerCtl refs={refs} input={input} hudUpdate={(h, a, rl) => { setHp(h); setAmmo(a); setReload(rl); if (h <= 0) setAlive(false); }} gameOver={() => { setAlive(false); void onGameOver(); }} />
            <WorldCtl refs={refs} onKill={onKill} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70"><Heart className="h-3.5 w-3.5 text-red-400" /> HP</div>
                <div className="mt-1 h-2 w-44 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${hp}%` }} />
                </div>
                <div className="mt-1 text-sm font-bold text-white">{Math.ceil(hp)} / 100</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-center text-white backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-white/70"><Skull className="h-3.5 w-3.5" /> Eliminations</div>
                <div className="font-display text-2xl">{kills}</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-right text-white backdrop-blur">
                <div className="text-xs uppercase tracking-wider text-white/70">Ammo</div>
                <div className="font-display text-xl">{reload > 0 ? "Reloading…" : `${ammo} / 12`}</div>
              </div>
            </div>

            {!locked && alive && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Rivals Arena</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Hunt rival bots. Reload when empty. +15 Bux per elim.</p>
                  <button onClick={() => containerRef.current?.requestPointerLock?.()} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · Click fire · Shift sprint · Space jump</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT fire · A jump · R-stick aim {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {!alive && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/75 backdrop-blur-sm">
                <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl text-primary">Down</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Eliminations: {kills}</p>
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

            {locked && alive && (
              <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center text-white/80">
                <Crosshair className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
