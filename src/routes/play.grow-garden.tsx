import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { HeaderBar } from "@/components/HeaderBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useGameInput } from "@/hooks/useGameInput";
import { Coins, Sprout, Gamepad2, Keyboard, Carrot, Apple, Cherry } from "lucide-react";

export const Route = createFileRoute("/play/grow-garden")({
  head: () => ({
    meta: [
      { title: "Grow a Garden — BloxWorld" },
      { name: "description", content: "Plant, water, harvest. Stack Bux at your own pace in this chill 3D garden." },
    ],
  }),
  component: GardenPage,
});

const ROW = 5;
const COL = 5;
const TILE = 1.6;

type CropKind = "carrot" | "apple" | "cherry";
const CROP_INFO: Record<CropKind, { color: string; growMs: number; price: number; label: string; icon: typeof Carrot }> = {
  carrot: { color: "#f97316", growMs: 8000, price: 5, label: "Carrot", icon: Carrot },
  apple: { color: "#dc2626", growMs: 14000, price: 12, label: "Apple", icon: Apple },
  cherry: { color: "#be123c", growMs: 22000, price: 25, label: "Cherry", icon: Cherry },
};

type Plot = { kind: CropKind | null; plantedAt: number };

type Refs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean };
  plots: Plot[][];
};

function makeRefs(): Refs {
  const plots: Plot[][] = Array.from({ length: ROW }, () =>
    Array.from({ length: COL }, () => ({ kind: null, plantedAt: 0 })),
  );
  return {
    player: { pos: new THREE.Vector3(0, 1, 8), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true },
    plots,
  };
}

function plotWorldPos(r: number, c: number): [number, number] {
  const x = (c - (COL - 1) / 2) * TILE;
  const z = (r - (ROW - 1) / 2) * TILE;
  return [x, z];
}

function World() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>
      {/* Garden plots dirt */}
      {Array.from({ length: ROW }).map((_, r) =>
        Array.from({ length: COL }).map((_, c) => {
          const [x, z] = plotWorldPos(r, c);
          return (
            <mesh key={`${r}-${c}`} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[TILE * 0.9, TILE * 0.9]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          );
        })
      )}
      {/* Selling stand */}
      <group position={[7, 0, 0]}>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[1.4, 2, 1.4]} /><meshStandardMaterial color="#a16207" /></mesh>
        <mesh position={[0, 2.4, 0]} castShadow><boxGeometry args={[2, 0.4, 2]} /><meshStandardMaterial color="#f59e0b" /></mesh>
      </group>
    </>
  );
}

function CropMesh({ refs, r, c }: { refs: RefObject<Refs>; r: number; c: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const rs = refs.current; if (!rs || !ref.current) return;
    const p = rs.plots[r][c];
    if (!p.kind) { ref.current.visible = false; return; }
    const info = CROP_INFO[p.kind];
    const t = Math.min(1, (performance.now() - p.plantedAt) / info.growMs);
    ref.current.visible = true;
    const s = 0.15 + t * 0.55;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshStandardMaterial).color.set(info.color);
    (ref.current.material as THREE.MeshStandardMaterial).emissive.set(t >= 1 ? info.color : "#000");
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = t >= 1 ? 0.4 : 0;
  });
  const [x, z] = plotWorldPos(r, c);
  return (
    <mesh ref={ref} position={[x, 0.6, z]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color="#000" />
    </mesh>
  );
}

function PlayerCtl({ refs, input, onAction, onSell, selectedCrop }: {
  refs: RefObject<Refs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number }>;
  onAction: (kind: "plant" | "harvest", value?: number) => void;
  onSell: () => void;
  selectedCrop: CropKind;
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

    const speed = input.current.sprint ? 8 : 5;
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
    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }

    // Action edge
    const a = input.current.action;
    if (a && !lastAction.current) {
      // Are we near sell stand?
      if (Math.hypot(p.pos.x - 7, p.pos.z - 0) < 1.6) {
        onSell();
      } else {
        // Find nearest plot within 1.5
        let best: { r: number; c: number; d: number } | null = null;
        for (let rr = 0; rr < ROW; rr++) for (let cc = 0; cc < COL; cc++) {
          const [x, z] = plotWorldPos(rr, cc);
          const d = Math.hypot(p.pos.x - x, p.pos.z - z);
          if (d < 1.4 && (!best || d < best.d)) best = { r: rr, c: cc, d };
        }
        if (best) {
          const plot = r.plots[best.r][best.c];
          if (!plot.kind) {
            plot.kind = selectedCrop;
            plot.plantedAt = performance.now();
            onAction("plant");
          } else {
            const info = CROP_INFO[plot.kind];
            const ready = performance.now() - plot.plantedAt >= info.growMs;
            if (ready) {
              const value = info.price;
              plot.kind = null; plot.plantedAt = 0;
              onAction("harvest", value);
            }
          }
        }
      }
    }
    lastAction.current = a;

    camera.position.set(p.pos.x, p.pos.y + 1.6, p.pos.z);
    camera.quaternion.setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));
  });
  return null;
}

function GardenPage() {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<Refs>(makeRefs());
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [held, setHeld] = useState(0);  // unsold value
  const [earned, setEarned] = useState(0);
  const [crop, setCrop] = useState<CropKind>("carrot");

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () => supabase.from("presence").upsert({
      user_id: user.id, username: profile.username, location: "grow-garden", last_seen: new Date().toISOString(),
    });
    void upsert();
    const i = setInterval(upsert, 20000);
    return () => clearInterval(i);
  }, [user, profile]);

  // Hotkey 1/2/3 for crop select
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Digit1") setCrop("carrot");
      if (e.code === "Digit2") setCrop("apple");
      if (e.code === "Digit3") setCrop("cherry");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onAction = (kind: "plant" | "harvest", value?: number) => {
    if (kind === "harvest" && value) {
      setHeld((h) => h + value);
    }
  };

  const onSell = async () => {
    if (held <= 0) { toast.message("Nothing to sell"); return; }
    const value = held;
    setHeld(0);
    setEarned((e) => e + value);
    addBux(value);
    if (user && profile) {
      await supabase.from("game_scores").insert({
        user_id: user.id, username: profile.username, game: "grow-garden", score: value, bux_earned: value,
      });
      await supabase.from("profiles").update({ bux: (profile.bux ?? 0) + value }).eq("id", user.id);
    }
    toast.success(`Sold for ${value} Bux!`);
  };

  if (!user || !profile || !avatar) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location="Grow a Garden" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, 8], fov: 75 }}>
            <Sky sunPosition={[50, 40, 30]} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 20, 5]} intensity={1.1} castShadow />
            <World />
            {Array.from({ length: ROW }).map((_, r) =>
              Array.from({ length: COL }).map((_, c) => (
                <CropMesh key={`${r}-${c}`} refs={refs} r={r} c={c} />
              ))
            )}
            <PlayerCtl refs={refs} input={input} onAction={onAction} onSell={onSell} selectedCrop={crop} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70"><Sprout className="h-3.5 w-3.5" /> Held</div>
                <div className="font-display text-2xl text-white">{held}</div>
              </div>
              <div className="pointer-events-auto rounded-xl bg-black/55 px-3 py-2 text-white backdrop-blur">
                <div className="text-xs uppercase tracking-wider text-white/70">Seed</div>
                <div className="mt-1 flex gap-2">
                  {(["carrot", "apple", "cherry"] as const).map((k) => {
                    const Info = CROP_INFO[k];
                    const Icon = Info.icon;
                    return (
                      <button
                        key={k}
                        onClick={() => setCrop(k)}
                        className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs ${crop === k ? "bg-primary text-primary-foreground" : "bg-white/10"}`}
                      >
                        <Icon className="h-4 w-4" style={{ color: Info.color }} />
                        <span>{Info.price}b</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-right text-bux backdrop-blur">
                <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-white/70"><Coins className="h-3.5 w-3.5" /> Earned</div>
                <div className="font-display text-2xl">{earned}</div>
              </div>
            </div>

            {!locked && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Grow a Garden</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Plant on dirt with E. Wait for the glow. Harvest. Sell at the orange stand.</p>
                  <button onClick={() => containerRef.current?.requestPointerLock?.()} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · E plant/harvest/sell · 1/2/3 pick seed</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT action · R-stick look {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
