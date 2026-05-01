import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SelfAvatar } from "@/components/SelfAvatar";
import { RemotePlayers } from "@/components/RemotePlayers";
import { useRoomPlayers } from "@/lib/multiplayer";
import { useGameInput } from "@/hooks/useGameInput";
import { resolveBoxCollisions, type AABB } from "@/lib/collision";
import { applyPlayerCamera } from "@/lib/camera";
import { GameAtmosphere } from "@/components/GameAtmosphere";
import { Heart, Coins, Gamepad2, Keyboard, Skull, Users, Send } from "lucide-react";

export const Route = createFileRoute("/play/rivals")({
  head: () => ({
    meta: [
      { title: "Rivals Arena — BloxWorld" },
      { name: "description", content: "Queue 1v1, 2v2, or 3v3. Pick your gun. Hunt rivals for Bux." },
    ],
  }),
  component: RivalsPage,
});

type Mode = "1v1" | "2v2" | "3v3";
const TEAM_SIZE: Record<Mode, number> = { "1v1": 1, "2v2": 2, "3v3": 3 };

type Gun = { id: string; name: string; dmg: number; fireCd: number; mag: number; reloadSec: number; bulletSpeed: number; spread: number; color: string };
const GUNS: Gun[] = [
  { id: "pistol",  name: "Pistol",  dmg: 22, fireCd: 0.22, mag: 12, reloadSec: 1.2, bulletSpeed: 50, spread: 0.02, color: "#fde047" },
  { id: "smg",     name: "SMG",     dmg: 11, fireCd: 0.08, mag: 28, reloadSec: 1.7, bulletSpeed: 55, spread: 0.06, color: "#22d3ee" },
  { id: "shotgun", name: "Shotgun", dmg: 14, fireCd: 0.55, mag: 6,  reloadSec: 2.2, bulletSpeed: 45, spread: 0.18, color: "#f97316" },
  { id: "sniper",  name: "Sniper",  dmg: 80, fireCd: 1.1,  mag: 4,  reloadSec: 2.5, bulletSpeed: 90, spread: 0.005, color: "#a78bfa" },
];

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

function ARENA_BOUNDS(): AABB[] {
  return [
    { pos: [0, 1.5, ARENA_HALF], size: [60, 3, 1] },
    { pos: [0, 1.5, -ARENA_HALF], size: [60, 3, 1] },
    { pos: [ARENA_HALF, 1.5, 0], size: [1, 3, 60] },
    { pos: [-ARENA_HALF, 1.5, 0], size: [1, 3, 60] },
    ...COVER,
  ];
}

type Bullet = { pos: THREE.Vector3; vel: THREE.Vector3; from: "player" | "bot"; life: number; dmg: number };
type Bot = { pos: THREE.Vector3; hp: number; alive: boolean; cooldown: number; color: string; team: "ally" | "enemy"; targetTimer: number; wander: THREE.Vector3 };
type GRefs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean; alive: boolean; hp: number; ammo: number; reload: number; fireCd: number };
  bots: Bot[];
  bullets: Bullet[];
  kills: number;
};

function makeRefs(mode: Mode, gun: Gun): GRefs {
  const teamSize = TEAM_SIZE[mode];
  const enemies = teamSize;
  const allies = teamSize - 1;
  const bots: Bot[] = [];
  for (let i = 0; i < enemies; i++) {
    const a = (i / Math.max(1, enemies)) * Math.PI - Math.PI / 2;
    bots.push({
      pos: new THREE.Vector3(Math.cos(a) * 14, 1, -10 + Math.sin(a) * 4),
      hp: 80, alive: true, cooldown: 1 + Math.random(),
      color: ["#dc2626", "#9333ea", "#f59e0b"][i % 3],
      team: "enemy", targetTimer: 0,
      wander: new THREE.Vector3((Math.random()-.5)*20, 1, (Math.random()-.5)*20),
    });
  }
  for (let i = 0; i < allies; i++) {
    const a = (i / Math.max(1, allies)) * Math.PI - Math.PI / 2;
    bots.push({
      pos: new THREE.Vector3(Math.cos(a) * 6, 1, 10 + Math.sin(a) * 2),
      hp: 80, alive: true, cooldown: 1.5 + Math.random(),
      color: ["#22d3ee", "#16a34a"][i % 2],
      team: "ally", targetTimer: 0,
      wander: new THREE.Vector3((Math.random()-.5)*20, 1, (Math.random()-.5)*20),
    });
  }
  return {
    player: { pos: new THREE.Vector3(0, 1, 12), vel: new THREE.Vector3(), yaw: Math.PI, pitch: 0, onGround: true, alive: true, hp: 100, ammo: gun.mag, reload: 0, fireCd: 0 },
    bots, bullets: [], kills: 0,
  };
}

function Arena() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.2} />
      </mesh>
      <gridHelper args={[60, 30, "#3b82f6", "#1e293b"]} position={[0, 0.01, 0]} />
      {/* central glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.4, 3.6, 64]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {[
        [0, 1.5, ARENA_HALF, 60, 3, 1],
        [0, 1.5, -ARENA_HALF, 60, 3, 1],
        [ARENA_HALF, 1.5, 0, 1, 3, 60],
        [-ARENA_HALF, 1.5, 0, 1, 3, 60],
      ].map((w, i) => (
        <mesh key={i} position={[w[0], w[1], w[2]]} castShadow>
          <boxGeometry args={[w[3], w[4], w[5]]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} emissive="#3b82f6" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {COVER.map((c, i) => (
        <mesh key={i} position={c.pos} castShadow receiveShadow>
          <boxGeometry args={c.size} />
          <meshStandardMaterial color={i % 2 === 0 ? "#7c3aed" : "#0ea5e9"} roughness={0.35} metalness={0.45} emissive={i % 2 === 0 ? "#7c3aed" : "#0ea5e9"} emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* rim lights along each wall */}
      {[
        [0, 0.1, ARENA_HALF - 0.6],
        [0, 0.1, -ARENA_HALF + 0.6],
        [ARENA_HALF - 0.6, 0.1, 0],
        [-ARENA_HALF + 0.6, 0.1, 0],
      ].map((p, i) => (
        <mesh key={`r${i}`} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, i >= 2 ? Math.PI / 2 : 0]}>
          <planeGeometry args={[40, 0.3]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function PlayerCtl({ refs, input, gun, hudUpdate, gameOver }: {
  refs: RefObject<GRefs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number; zoomOut: boolean }>;
  gun: Gun;
  hudUpdate: (hp: number, ammo: number, reload: number) => void;
  gameOver: () => void;
}) {
  const { camera } = useThree();
  const colliders = useRef(ARENA_BOUNDS());
  const lastReport = useRef({ hp: 100, ammo: gun.mag, reload: 0 });

  useFrame((_s, dt) => {
    const r = refs.current; if (!r) return;
    const p = r.player;
    if (!p.alive) return;

    p.yaw -= input.current.lookDX;
    p.pitch -= input.current.lookDY;
    p.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, p.pitch));
    input.current.lookDX = 0; input.current.lookDY = 0;

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
    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; } else p.onGround = false;

    p.fireCd = Math.max(0, p.fireCd - dt);
    if (p.reload > 0) {
      p.reload = Math.max(0, p.reload - dt);
      if (p.reload === 0) p.ammo = gun.mag;
    }
    if (input.current.action && p.ammo > 0 && p.fireCd === 0 && p.reload === 0) {
      p.fireCd = gun.fireCd;
      p.ammo -= 1;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const muzzle = camera.position.clone().add(dir.clone().multiplyScalar(0.6));
      // Shotgun fires multiple pellets
      const pellets = gun.id === "shotgun" ? 6 : 1;
      for (let i = 0; i < pellets; i++) {
        const d = dir.clone();
        d.x += (Math.random() - 0.5) * gun.spread;
        d.y += (Math.random() - 0.5) * gun.spread;
        d.z += (Math.random() - 0.5) * gun.spread;
        d.normalize().multiplyScalar(gun.bulletSpeed);
        r.bullets.push({ pos: muzzle.clone(), vel: d, from: "player", life: 1.4, dmg: gun.dmg });
      }
      if (p.ammo === 0) p.reload = gun.reloadSec;
    }

    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);

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
    const r = refs.current; if (!r) return;
    for (const b of r.bots) {
      if (!b.alive) continue;
      b.targetTimer -= dt;
      if (b.targetTimer <= 0) {
        b.targetTimer = 2 + Math.random() * 2;
        b.wander.set((Math.random()-.5) * (ARENA_HALF*1.6), 1, (Math.random()-.5) * (ARENA_HALF*1.6));
      }
      // Pick target based on team
      let target: THREE.Vector3 = b.wander;
      let dist = Infinity;
      if (b.team === "enemy") {
        const candidates: THREE.Vector3[] = [];
        if (r.player.alive) candidates.push(r.player.pos);
        for (const o of r.bots) if (o.alive && o.team === "ally") candidates.push(o.pos);
        for (const c of candidates) {
          const d = c.distanceTo(b.pos); if (d < dist) { dist = d; target = c; }
        }
      } else {
        // ally targets nearest enemy
        for (const o of r.bots) {
          if (o.alive && o.team === "enemy") {
            const d = o.pos.distanceTo(b.pos); if (d < dist) { dist = d; target = o.pos; }
          }
        }
      }
      const dir = target.clone().sub(b.pos); dir.y = 0;
      if (dir.lengthSq() > 0.01 && dist > 8) {
        dir.normalize().multiplyScalar(3 * dt);
        b.pos.add(dir);
        resolveBoxCollisions(b.pos, colliders.current);
      }
      b.cooldown -= dt;
      if (b.cooldown <= 0 && dist < 22) {
        b.cooldown = 1.0 + Math.random() * 1.2;
        const aim = target.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(b.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
        aim.normalize();
        aim.x += (Math.random() - 0.5) * 0.05;
        aim.y += (Math.random() - 0.5) * 0.05;
        aim.z += (Math.random() - 0.5) * 0.05;
        aim.normalize().multiplyScalar(35);
        r.bullets.push({ pos: b.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), vel: aim, from: "bot", life: 1.5, dmg: 11 });
      }
    }

    for (let i = r.bullets.length - 1; i >= 0; i--) {
      const bl = r.bullets[i];
      bl.life -= dt;
      bl.pos.addScaledVector(bl.vel, dt);
      let removed = false;
      for (const c of colliders.current) {
        if (Math.abs(bl.pos.x - c.pos[0]) < c.size[0] / 2 &&
            Math.abs(bl.pos.z - c.pos[2]) < c.size[2] / 2 &&
            bl.pos.y > c.pos[1] - c.size[1] / 2 && bl.pos.y < c.pos[1] + c.size[1] / 2) {
          r.bullets.splice(i, 1); removed = true; break;
        }
      }
      if (removed) continue;
      if (bl.from === "bot" && r.player.alive) {
        const dx = bl.pos.x - r.player.pos.x;
        const dy = bl.pos.y - (r.player.pos.y + 1.2);
        const dz = bl.pos.z - r.player.pos.z;
        if (dx * dx + dy * dy + dz * dz < 0.7 * 0.7) {
          r.player.hp -= bl.dmg; r.bullets.splice(i, 1); continue;
        }
      }
      if (bl.from === "player") {
        let hit = false;
        for (const b of r.bots) {
          if (!b.alive || b.team === "ally") continue;
          const dx = bl.pos.x - b.pos.x;
          const dy = bl.pos.y - (b.pos.y + 1.2);
          const dz = bl.pos.z - b.pos.z;
          if (dx * dx + dy * dy + dz * dz < 0.8 * 0.8) {
            b.hp -= bl.dmg;
            if (b.hp <= 0) { b.alive = false; r.kills += 1; onKill(); }
            r.bullets.splice(i, 1); hit = true; break;
          }
        }
        if (hit) continue;
      }
      if (bl.life <= 0 || Math.abs(bl.pos.x) > ARENA_HALF || Math.abs(bl.pos.z) > ARENA_HALF || bl.pos.y < 0) {
        r.bullets.splice(i, 1);
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
        <BlockyAvatar key={i} walking config={{ rig: "R6", skin_color: "#f5c896", shirt_color: b.color, pants_color: "#0f172a", face: b.team === "enemy" ? "angry" : "cool", hat: "cap", hair: "buzz", shoes: "sneakers", jacket: "none" }} />
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
    for (let i = 0; i < 120; i++) {
      const b = r.bullets[i];
      if (b) { dummy.current.position.copy(b.pos); dummy.current.scale.setScalar(1); }
      else dummy.current.scale.setScalar(0);
      dummy.current.updateMatrix();
      ref.current.setMatrixAt(i, dummy.current.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 120]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#fde047" toneMapped={false} />
    </instancedMesh>
  );
}

type ChatMsg = { id: string; username: string; message: string; created_at: string };

function LobbyView({ onStart }: { onStart: (mode: Mode, gun: Gun) => void }) {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<Mode>("1v1");
  const [gun, setGun] = useState<Gun>(GUNS[0]);
  const [queue, setQueue] = useState<{ user_id: string; username: string; mode: string }[]>([]);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const inQueue = !!queue.find((q) => q.user_id === user?.id);

  // Subscribe to queue & chat
  useEffect(() => {
    let mounted = true;
    const loadQ = async () => {
      const { data } = await supabase.from("match_queue").select("user_id, username, mode");
      if (mounted && data) setQueue(data);
    };
    const loadC = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, username, message, created_at")
        .eq("channel", "rivals-lobby")
        .order("created_at", { ascending: false })
        .limit(40);
      if (mounted && data) setMsgs(data.reverse());
    };
    void loadQ(); void loadC();
    const ch = supabase
      .channel("rivals-lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_queue" }, () => void loadQ())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "channel=eq.rivals-lobby" }, () => void loadC())
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(ch); };
  }, []);

  const joinQ = async () => {
    if (!user || !profile) return;
    await supabase.from("match_queue").upsert({ user_id: user.id, username: profile.username, mode });
  };
  const leaveQ = async () => {
    if (!user) return;
    await supabase.from("match_queue").delete().eq("user_id", user.id);
  };
  const sendMsg = async () => {
    if (!user || !profile || !input.trim()) return;
    const msg = input.trim().slice(0, 300);
    setInput("");
    await supabase.from("chat_messages").insert({ channel: "rivals-lobby", user_id: user.id, username: profile.username, message: msg });
  };

  // Auto-start when queue has enough humans for selected mode (players + bots fill)
  useEffect(() => {
    if (!inQueue) return;
    const need = TEAM_SIZE[mode] * 2; // ideal count
    const sameMode = queue.filter((q) => q.mode === mode).length;
    // Start after 6s in queue regardless (fill with bots)
    const myEntry = queue.find((q) => q.user_id === user?.id);
    if (!myEntry) return;
    const t = setTimeout(async () => {
      if (sameMode >= need) {
        await leaveQ();
        onStart(mode, gun);
      }
    }, 1500);
    // Bot-fill fallback
    const t2 = setTimeout(async () => {
      await leaveQ();
      onStart(mode, gun);
    }, 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [inQueue, queue, mode, gun, user, onStart]);

  const counts: Record<Mode, number> = {
    "1v1": queue.filter((q) => q.mode === "1v1").length,
    "2v2": queue.filter((q) => q.mode === "2v2").length,
    "3v3": queue.filter((q) => q.mode === "3v3").length,
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-block">
        <h1 className="font-display text-3xl">Rivals Arena</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a queue and a gun. We'll match you with anyone in queue, then fill with bots.</p>

        <div className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Mode</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["1v1","2v2","3v3"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl border-2 p-4 text-center font-display text-2xl transition ${mode === m ? "border-primary bg-primary/10" : "border-border bg-secondary/50"}`}
              >
                {m}
                <div className="mt-1 text-xs font-normal text-muted-foreground"><Users className="inline h-3 w-3" /> {counts[m]} queued</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Weapon</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GUNS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGun(g)}
                className={`rounded-lg border-2 p-3 text-left transition ${gun.id === g.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50"}`}
              >
                <div className="h-3 w-full rounded-sm" style={{ background: g.color }} />
                <div className="mt-2 font-bold">{g.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{g.dmg} dmg · mag {g.mag}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {!inQueue ? (
            <button onClick={joinQ} className="w-full rounded-lg bg-primary py-3 font-display text-xl text-primary-foreground shadow-block">
              Join {mode} queue
            </button>
          ) : (
            <button onClick={leaveQ} className="w-full rounded-lg bg-destructive py-3 font-display text-xl text-destructive-foreground">
              Cancel queue · matching…
            </button>
          )}
        </div>
      </div>

      {/* Live chat with other queued players */}
      <div className="flex flex-col rounded-2xl border border-border bg-card shadow-block">
        <div className="border-b border-border p-3 font-bold">Lobby chat</div>
        <ul className="flex-1 space-y-1 overflow-y-auto p-3 text-sm" style={{ maxHeight: 360 }}>
          {msgs.map((m) => (
            <li key={m.id}>
              <span className="font-bold text-primary">@{m.username}</span>
              <span className="ml-2 break-words">{m.message}</span>
            </li>
          ))}
          {msgs.length === 0 && <li className="text-xs text-muted-foreground">Be the first to say hi.</li>}
        </ul>
        <div className="flex gap-1 border-t border-border p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void sendMsg(); }}
            placeholder="Say something…"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button onClick={sendMsg} className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RivalsPage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [match, setMatch] = useState<{ mode: Mode; gun: Gun } | null>(null);
  const refs = useRef<GRefs | null>(null);
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
    // leave queue when leaving page
    return () => {
      clearInterval(i);
      void supabase.from("match_queue").delete().eq("user_id", user.id);
    };
  }, [user, profile]);

  const startMatch = (mode: Mode, gun: Gun) => {
    refs.current = makeRefs(mode, gun);
    setMatch({ mode, gun });
    setHp(100); setAmmo(gun.mag); setReload(0); setKills(0); setAlive(true); setBux(0);
    // Don't auto-request pointer lock here — the browser throttles silent
    // requests, which then makes the user's "Click to start" click fail too.
    // The overlay's button is the user's first gesture; let it lock cleanly.
  };

  const onKill = () => setKills((k) => k + 1);

  const onGameOver = async () => {
    if (!user || !profile || !refs.current) return;
    const k = refs.current.kills;
    const earned = 10 + k * 20;
    setBux(earned);
    addBux(earned);
    await supabase.from("game_scores").insert({
      user_id: user.id, username: profile.username, game: "rivals", score: k, bux_earned: earned,
    });
    await supabase.from("profiles").update({ bux: (profile.bux ?? 0) + earned }).eq("id", user.id);
    toast.success(`+${earned} Bux earned!`);
  };

  const exitMatch = () => { setMatch(null); refs.current = null; };

  if (!user || !profile || !avatar) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location="Rivals" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        {!match ? (
          <LobbyView onStart={startMatch} />
        ) : (
          <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
            <Canvas shadows camera={{ position: [0, 1.6, 12], fov: 75 }} dpr={[1, 1.75]} gl={{ antialias: true, toneMappingExposure: 1.0 }}>
              <Sky sunPosition={[10, 5, 10]} turbidity={6} />
              <fog attach="fog" args={["#0a0f1f", 18, 55]} />
              <GameAtmosphere preset="arena" contactPos={[0, 0, 0]} contactScale={70} />
              <Arena />
              <Bots refs={refs as RefObject<GRefs>} />
              <Bullets refs={refs as RefObject<GRefs>} />
              {refs.current && (
                <SelfAvatar posRef={{ current: refs.current.player }} inputRef={input} config={avatar} />
              )}
              <PlayerCtl
                refs={refs as RefObject<GRefs>}
                input={input}
                gun={match.gun}
                hudUpdate={(h, a, rl) => { setHp(h); setAmmo(a); setReload(rl); if (h <= 0) setAlive(false); }}
                gameOver={() => { setAlive(false); void onGameOver(); }}
              />
              <WorldCtl refs={refs as RefObject<GRefs>} onKill={onKill} />
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
                  <div className="text-xs text-white/60">{match.mode} · {match.gun.name}</div>
                </div>
                <div className="rounded-xl bg-black/55 px-4 py-3 text-right text-white backdrop-blur">
                  <div className="text-xs uppercase tracking-wider text-white/70">Ammo</div>
                  <div className="font-display text-xl">{reload > 0 ? "Reloading…" : `${ammo} / ${match.gun.mag}`}</div>
                </div>
              </div>

              {!locked && alive && (
                <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                  <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                    <h2 className="font-display text-3xl">{match.mode} · {match.gun.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">+20 Bux per elim. Reload when empty.</p>
                    <button onClick={(e) => { e.stopPropagation(); containerRef.current?.requestPointerLock?.(); }} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                      Click to start
                    </button>
                    <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · Click fire · V zoom-out</div>
                      <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT fire · A jump · R-stick aim {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                    </div>
                    <button onClick={exitMatch} className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</button>
                  </div>
                </div>
              )}

              {!alive && (
                <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/70 backdrop-blur">
                  <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                    <h2 className="font-display text-3xl">Eliminated</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{kills} kills · <span className="text-bux">+{bux} Bux</span></p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => startMatch(match.mode, match.gun)} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground shadow-block">Re-queue</button>
                      <button onClick={exitMatch} className="rounded-lg bg-secondary px-4 py-2 font-bold">Lobby</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
