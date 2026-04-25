import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { Heart, Timer, Coins, Gamepad2, Keyboard } from "lucide-react";

export const Route = createFileRoute("/play/natural-disaster")({
  head: () => ({
    meta: [
      { title: "Natural Disaster Survival — BloxWorld" },
      { name: "description", content: "Survive earthquakes, tornadoes, floods, and meteor strikes in this 3D multiplayer game." },
      { property: "og:title", content: "Natural Disaster Survival — BloxWorld" },
      { property: "og:description", content: "Survive 3D natural disasters and earn Bux." },
    ],
  }),
  component: GamePage,
});

type Disaster = "calm" | "earthquake" | "tornado" | "flood" | "meteor";
const DISASTER_LABEL: Record<Disaster, string> = {
  calm: "Calm",
  earthquake: "Earthquake",
  tornado: "Tornado",
  flood: "Flood",
  meteor: "Meteor Strike",
};

// ---------- Game state singleton (refs to avoid re-renders) ----------
type GameRefs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; onGround: boolean; alive: boolean; hp: number };
  disaster: { kind: Disaster; intensity: number };
  bots: { pos: THREE.Vector3; alive: boolean; speed: number; color: string }[];
  meteors: { pos: THREE.Vector3; vel: THREE.Vector3 }[];
  floodLevel: number;
  shake: number;
  input: { f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; lookX: number; lookY: number };
};

const SHELTERS: { pos: [number, number, number]; size: [number, number, number]; color: string }[] = [
  { pos: [-8, 1, -6], size: [4, 2, 3], color: "#7c2d12" },
  { pos: [10, 1, 4], size: [5, 2, 3.5], color: "#0f766e" },
  { pos: [2, 1, 12], size: [3, 2, 3], color: "#7c3aed" },
  { pos: [-12, 1, 8], size: [3.5, 2, 3], color: "#ca8a04" },
];

function makeRefs(): GameRefs {
  return {
    player: { pos: new THREE.Vector3(0, 1, 0), vel: new THREE.Vector3(), yaw: 0, onGround: true, alive: true, hp: 100 },
    disaster: { kind: "calm", intensity: 0 },
    bots: Array.from({ length: 7 }, (_, i) => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 30, 1, (Math.random() - 0.5) * 30),
      alive: true,
      speed: 1.5 + Math.random() * 1.2,
      color: ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#f59e0b", "#0ea5e9", "#ec4899"][i % 7],
    })),
    meteors: [],
    floodLevel: -1.5,
    shake: 0,
    input: { f: false, b: false, l: false, r: false, jump: false, lookX: 0, lookY: 0 },
  };
}

const ISLAND_RADIUS = 22;

// ---------- Scene components ----------
function Island() {
  return (
    <>
      {/* sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {/* island */}
      <mesh position={[0, -0.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS + 1, 1, 32]} />
        <meshStandardMaterial color="#3f6212" />
      </mesh>
      {/* center plaza */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      {/* trees */}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = 14 + Math.sin(i * 13) * 4;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh castShadow><boxGeometry args={[0.4, 1.5, 0.4]} /><meshStandardMaterial color="#78350f" /></mesh>
            <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.4, 1.4, 1.4]} /><meshStandardMaterial color="#16a34a" /></mesh>
          </group>
        );
      })}
    </>
  );
}

function Shelters() {
  return (
    <>
      {SHELTERS.map((s, i) => (
        <group key={i} position={s.pos}>
          <mesh castShadow receiveShadow><boxGeometry args={s.size} /><meshStandardMaterial color={s.color} /></mesh>
          {/* roof */}
          <mesh position={[0, s.size[1] / 2 + 0.25, 0]} castShadow>
            <boxGeometry args={[s.size[0] + 0.5, 0.5, s.size[2] + 0.5]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          {/* doorway */}
          <mesh position={[0, -s.size[1] / 4, s.size[2] / 2 + 0.01]}>
            <planeGeometry args={[0.8, 1.2]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Tornado({ visible, position }: { visible: boolean; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, dt) => { if (ref.current) ref.current.rotation.y += dt * 6; });
  if (!visible) return null;
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, i * 1.4, 0]}>
          <coneGeometry args={[2 + i * 0.6, 1.4, 8, 1, true]} />
          <meshStandardMaterial color="#525252" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Flood({ level }: { level: number }) {
  if (level <= -1.4) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, level, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#1e3a8a" transparent opacity={0.7} />
    </mesh>
  );
}

function Meteors({ list }: { list: { pos: THREE.Vector3 }[] }) {
  return (
    <>
      {list.map((m, i) => (
        <group key={i} position={m.pos.toArray()}>
          <mesh><sphereGeometry args={[0.6, 8, 8]} /><meshStandardMaterial color="#7f1d1d" emissive="#f97316" emissiveIntensity={0.8} /></mesh>
          <pointLight intensity={3} color="#f97316" distance={6} />
        </group>
      ))}
    </>
  );
}

// ---------- Player controller ----------
function PlayerController({ refs, hudUpdate, gameOver }: {
  refs: RefObject<GameRefs>;
  hudUpdate: (hp: number, alive: boolean) => void;
  gameOver: () => void;
}) {
  const { camera } = useThree();
  const lastHpReport = useRef(100);

  useFrame((_state, dt) => {
    const r = refs.current;
    if (!r) return;
    const p = r.player;
    if (!p.alive) return;

    // Read camera yaw (PointerLockControls drives camera)
    p.yaw = camera.rotation.y;

    // Movement input
    const speed = 6;
    const forward = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const move = new THREE.Vector3();
    if (r.input.f) move.add(forward);
    if (r.input.b) move.sub(forward);
    if (r.input.r) move.add(right);
    if (r.input.l) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);
    p.vel.x = move.x;
    p.vel.z = move.z;

    // Jump
    if (r.input.jump && p.onGround) {
      p.vel.y = 7;
      p.onGround = false;
    }
    p.vel.y -= 18 * dt; // gravity

    // Wind from tornado
    if (r.disaster.kind === "tornado") {
      const dir = new THREE.Vector3(-p.pos.x, 0, -p.pos.z);
      const dist = Math.max(2, dir.length());
      dir.normalize().multiplyScalar((40 / (dist * dist)) * r.disaster.intensity);
      p.vel.x += dir.x * dt * 60;
      p.vel.z += dir.z * dt * 60;
    }

    p.pos.addScaledVector(p.vel, dt);

    // Ground collision (island top is y=0, plus stand height 1)
    const onIsland = Math.hypot(p.pos.x, p.pos.z) < ISLAND_RADIUS;
    const groundY = onIsland ? 1 : -2; // fall into sea if off island
    if (p.pos.y <= groundY) {
      p.pos.y = groundY;
      p.vel.y = 0;
      p.onGround = true;
    } else { p.onGround = false; }

    // Drowning
    if (p.pos.y < r.floodLevel + 0.5 || !onIsland) {
      p.hp -= dt * 25;
    }

    // Earthquake damage if outside shelter
    if (r.disaster.kind === "earthquake" && p.onGround) {
      const inShelter = SHELTERS.some((s) => {
        const [sx, , sz] = s.pos;
        return Math.abs(p.pos.x - sx) < s.size[0] / 2 + 0.3 && Math.abs(p.pos.z - sz) < s.size[2] / 2 + 0.3;
      });
      if (!inShelter) p.hp -= dt * 12 * r.disaster.intensity;
      r.shake = 0.25 * r.disaster.intensity;
    } else { r.shake *= 0.9; }

    // Meteor proximity damage handled in DisasterController

    // Camera follow (third-person-ish: place camera at player head, behind)
    const camOffset = new THREE.Vector3(0, 1.6, 0);
    camera.position.copy(p.pos).add(camOffset);
    if (r.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * r.shake;
      camera.position.z += (Math.random() - 0.5) * r.shake;
    }

    // HP & death
    p.hp = Math.max(0, p.hp);
    if (Math.floor(p.hp) !== Math.floor(lastHpReport.current)) {
      lastHpReport.current = p.hp;
      hudUpdate(p.hp, p.alive);
    }
    if (p.hp <= 0) {
      p.alive = false;
      hudUpdate(0, false);
      gameOver();
    }
  });

  return null;
}

// ---------- Disaster + bot brain ----------
function WorldController({ refs, hudUpdate, onTimerTick }: {
  refs: RefObject<GameRefs>;
  hudUpdate: (hp: number, alive: boolean) => void;
  onTimerTick: (t: number, d: Disaster) => void;
}) {
  const elapsed = useRef(0);
  const phaseEnd = useRef(8); // first calm
  const meteorTimer = useRef(0);

  useFrame((_s, dt) => {
    const r = refs.current;
    if (!r) return;
    elapsed.current += dt;

    // Switch disasters
    if (elapsed.current > phaseEnd.current) {
      const choices: Disaster[] = ["earthquake", "tornado", "flood", "meteor", "calm"];
      const next = choices[Math.floor(Math.random() * choices.length)];
      r.disaster.kind = next;
      r.disaster.intensity = next === "calm" ? 0 : 0.8 + Math.random() * 0.4;
      phaseEnd.current = elapsed.current + (next === "calm" ? 6 : 14);
      if (next === "flood") r.floodLevel = -1.5;
      if (next !== "flood") r.floodLevel = Math.max(-1.5, r.floodLevel - dt * 2);
      if (next === "meteor") r.meteors = [];
    }
    onTimerTick(elapsed.current, r.disaster.kind);

    // Disaster effects
    if (r.disaster.kind === "flood") {
      r.floodLevel = Math.min(1.4, r.floodLevel + dt * 0.35);
    } else {
      r.floodLevel = Math.max(-1.5, r.floodLevel - dt * 0.6);
    }

    if (r.disaster.kind === "meteor") {
      meteorTimer.current -= dt;
      if (meteorTimer.current <= 0) {
        meteorTimer.current = 0.6 - Math.random() * 0.3;
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        r.meteors.push({ pos: new THREE.Vector3(x, 25, z), vel: new THREE.Vector3(0, -18, 0) });
      }
    }
    // update meteors
    for (let i = r.meteors.length - 1; i >= 0; i--) {
      const m = r.meteors[i];
      m.pos.addScaledVector(m.vel, dt);
      if (m.pos.y <= 0.6) {
        // impact damage to player
        const dx = m.pos.x - r.player.pos.x, dz = m.pos.z - r.player.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 3) r.player.hp -= 35;
        r.shake = 0.5;
        // damage bots
        for (const b of r.bots) {
          if (!b.alive) continue;
          if (Math.hypot(b.pos.x - m.pos.x, b.pos.z - m.pos.z) < 2.5) b.alive = false;
        }
        r.meteors.splice(i, 1);
      }
    }

    // Bot AI: wander toward shelters during quake, away from tornado center, swim during flood
    for (const b of r.bots) {
      if (!b.alive) continue;
      let target: THREE.Vector3 | null = null;
      if (r.disaster.kind === "earthquake" || r.disaster.kind === "meteor") {
        const s = SHELTERS[Math.floor((b.color.charCodeAt(1) + b.color.charCodeAt(2)) % SHELTERS.length)];
        target = new THREE.Vector3(s.pos[0], 1, s.pos[2]);
      } else if (r.disaster.kind === "tornado") {
        target = new THREE.Vector3(b.pos.x * 2, 1, b.pos.z * 2);
        if (target.length() > ISLAND_RADIUS - 2) target.setLength(ISLAND_RADIUS - 2);
      } else if (r.disaster.kind === "flood") {
        target = new THREE.Vector3(0, 1, 0); // huddle center (highest spot)
      } else {
        // wander
        if (!b.pos.userData) (b.pos as THREE.Vector3 & { userData?: THREE.Vector3 }).userData = new THREE.Vector3((Math.random() - 0.5) * 20, 1, (Math.random() - 0.5) * 20);
        target = (b.pos as THREE.Vector3 & { userData: THREE.Vector3 }).userData;
        if (b.pos.distanceTo(target) < 1) (b.pos as THREE.Vector3 & { userData: THREE.Vector3 }).userData = new THREE.Vector3((Math.random() - 0.5) * 20, 1, (Math.random() - 0.5) * 20);
      }
      const dir = target.clone().sub(b.pos); dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        dir.normalize().multiplyScalar(b.speed * dt);
        b.pos.add(dir);
      }
      // bots take flood damage too
      if (r.floodLevel > 0.5) b.alive = Math.random() > 0.005 ? b.alive : false;
    }

    void hudUpdate; // referenced
  });

  return null;
}

// ---------- Bot rendering ----------
function Bots({ refs }: { refs: RefObject<GameRefs> }) {
  const groupRef = useRef<THREE.Group>(null);
  // Rebuild positions each frame via refs
  useFrame(() => {
    const r = refs.current;
    if (!r || !groupRef.current) return;
    const children = groupRef.current.children;
    for (let i = 0; i < r.bots.length; i++) {
      const b = r.bots[i];
      const c = children[i];
      if (!c) continue;
      c.position.copy(b.pos);
      c.visible = b.alive;
    }
  });
  const bots = refs.current?.bots ?? [];
  return (
    <group ref={groupRef}>
      {bots.map((b, i) => (
        <BlockyAvatar
          key={i}
          walking
          config={{ rig: i % 2 === 0 ? "R6" : "R15", skin_color: "#f5c896", shirt_color: b.color, pants_color: "#1f2937", face: "smile", hat: i % 3 === 0 ? "cap" : "none" }}
        />
      ))}
    </group>
  );
}

// ---------- HUD / wrapper ----------
function GamePage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<GameRefs>(makeRefs());
  const [hp, setHp] = useState(100);
  const [alive, setAlive] = useState(true);
  const [t, setT] = useState(0);
  const [disaster, setDisaster] = useState<Disaster>("calm");
  const [bux, setBux] = useState(0);
  const [locked, setLocked] = useState(false);
  const [usingPad, setUsingPad] = useState(false);
  const lockRef = useRef<{ lock?: () => void }>(null);

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);

  // presence
  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () => supabase.from("presence").upsert({
      user_id: user.id, username: profile.username, location: "natural-disaster", last_seen: new Date().toISOString(),
    });
    void upsert();
    const i = setInterval(upsert, 20000);
    return () => clearInterval(i);
  }, [user, profile]);

  // keyboard input
  useEffect(() => {
    const set = (e: KeyboardEvent, v: boolean) => {
      const r = refs.current.input;
      switch (e.code) {
        case "KeyW": case "ArrowUp": r.f = v; break;
        case "KeyS": case "ArrowDown": r.b = v; break;
        case "KeyA": case "ArrowLeft": r.l = v; break;
        case "KeyD": case "ArrowRight": r.r = v; break;
        case "Space": r.jump = v; if (v) e.preventDefault(); break;
      }
    };
    const dn = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // gamepad polling
  useEffect(() => {
    let raf = 0;
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const gp = pads.find((p) => !!p);
      if (gp) {
        if (!usingPad) setUsingPad(true);
        const r = refs.current.input;
        const lx = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
        const ly = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
        r.f = ly < -0.2; r.b = ly > 0.2;
        r.l = lx < -0.2; r.r = lx > 0.2;
        r.jump = !!gp.buttons[0]?.pressed; // A
        // Right stick rotates camera yaw (when pointer not locked we still apply)
        const rx = Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0;
        const ry = Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0;
        r.lookX = rx;
        r.lookY = ry;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [usingPad]);

  const onGameOver = async () => {
    if (!user || !profile) return;
    const survived = Math.floor(t);
    const earned = 10 + survived * 2;
    setBux(earned);
    addBux(earned);
    await supabase.from("game_scores").insert({
      user_id: user.id, username: profile.username, game: "natural-disaster", score: survived, bux_earned: earned,
    });
    await supabase.from("profiles").update({ bux: (profile.bux ?? 0) + earned }).eq("id", user.id);
    toast.success(`+${earned} Bux earned!`);
  };

  const restart = () => {
    refs.current = makeRefs();
    setHp(100); setAlive(true); setT(0); setDisaster("calm"); setBux(0);
    lockRef.current?.lock?.();
  };

  if (!user || !profile || !avatar) return null;

  const minutes = Math.floor(t / 60).toString().padStart(2, "0");
  const seconds = Math.floor(t % 60).toString().padStart(2, "0");
  const disasterColor: Record<Disaster, string> = {
    calm: "bg-success/30 text-success",
    earthquake: "bg-orange-500/30 text-orange-400",
    tornado: "bg-slate-500/40 text-slate-200",
    flood: "bg-blue-500/30 text-blue-300",
    meteor: "bg-red-500/40 text-red-300",
  };

  return (
    <div className="min-h-screen">
      <HeaderBar location="Natural Disaster" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, 0], fov: 75 }}>
            <Sky sunPosition={[100, 20, 100]} turbidity={disaster === "tornado" || disaster === "meteor" ? 10 : 2} />
            <fog attach="fog" args={["#0a1029", 25, 80]} />
            <ambientLight intensity={disaster === "meteor" ? 0.25 : 0.55} />
            <directionalLight position={[20, 30, 10]} intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} />
            <Island />
            <Shelters />
            <Tornado visible={disaster === "tornado"} position={[0, 0, 0]} />
            <Flood level={refs.current.floodLevel} />
            <Meteors list={refs.current.meteors} />
            <Bots refs={refs} />

            <PointerLockControls
              ref={lockRef as React.RefObject<never>}
              onLock={() => setLocked(true)}
              onUnlock={() => setLocked(false)}
            />
            <PlayerController refs={refs} hudUpdate={(h, a) => { setHp(h); setAlive(a); }} gameOver={onGameOver} />
            <WorldController refs={refs} hudUpdate={() => {}} onTimerTick={(tt, d) => { setT(tt); if (d !== disaster) setDisaster(d); }} />
          </Canvas>

          {/* HUD */}
          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
                  <Heart className="h-3.5 w-3.5 text-red-400" /> HP
                </div>
                <div className="mt-1 h-2 w-44 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${hp}%` }} />
                </div>
                <div className="mt-1 text-sm font-bold text-white">{Math.ceil(hp)} / 100</div>
              </div>
              <div className={`rounded-xl px-4 py-3 backdrop-blur ${disasterColor[disaster]}`}>
                <div className="text-xs uppercase tracking-wider opacity-80">Now</div>
                <div className="font-display text-xl">{DISASTER_LABEL[disaster]}</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-right text-white backdrop-blur">
                <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-white/70">
                  <Timer className="h-3.5 w-3.5" /> Survived
                </div>
                <div className="font-display text-xl">{minutes}:{seconds}</div>
              </div>
            </div>

            {/* Click to play overlay */}
            {!locked && alive && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Block Island</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Survive whatever the world throws at you.</p>
                  <button
                    onClick={() => lockRef.current?.lock?.()}
                    className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block"
                  >
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-left text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD move · Space jump · Mouse look · Esc release</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Left stick move · A jump · Right stick look {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad detected</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {/* Game over overlay */}
            {!alive && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/75 backdrop-blur-sm">
                <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl text-primary">Eliminated</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Survived {minutes}:{seconds}</p>
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

            {/* Crosshair */}
            {locked && alive && (
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
