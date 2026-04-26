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
import { SelfAvatar } from "@/components/SelfAvatar";
import { useGameInput } from "@/hooks/useGameInput";
import { resolveBoxCollisions, type AABB } from "@/lib/collision";
import { applyPlayerCamera } from "@/lib/camera";
import { Coins, Sprout, Gamepad2, Keyboard, Carrot, Apple, Cherry, ShoppingCart, Store } from "lucide-react";

export const Route = createFileRoute("/play/grow-garden")({
  head: () => ({
    meta: [
      { title: "Grow a Garden — BloxWorld" },
      { name: "description", content: "Own a garden plot, buy seeds at the seed shop, and sell harvests at the market." },
    ],
  }),
  component: GardenPage,
});

type CropKind = "carrot" | "apple" | "cherry" | "pumpkin" | "diamond";
const CROP_INFO: Record<CropKind, { color: string; growMs: number; price: number; cost: number; label: string; icon: typeof Carrot }> = {
  carrot:   { color: "#f97316", growMs: 8000,  cost: 5,  price: 12,  label: "Carrot",  icon: Carrot },
  apple:    { color: "#dc2626", growMs: 14000, cost: 15, price: 35,  label: "Apple",   icon: Apple },
  cherry:   { color: "#be123c", growMs: 22000, cost: 40, price: 100, label: "Cherry",  icon: Cherry },
  pumpkin:  { color: "#ea580c", growMs: 35000, cost: 90, price: 240, label: "Pumpkin", icon: Sprout },
  diamond:  { color: "#22d3ee", growMs: 60000, cost: 200, price: 600, label: "Diamond Berry", icon: Cherry },
};
const CROP_KEYS: CropKind[] = ["carrot", "apple", "cherry", "pumpkin", "diamond"];

const ROW = 4;
const COL = 4;
const TILE = 1.6;
const PLOT_SIZE = ROW * TILE + 3; // including border

// 4 plots arranged on the cardinal directions, player owns plot 0
type PlotInfo = { id: number; pos: [number, number]; color: string; isPlayer: boolean; name: string };
const PLOTS: PlotInfo[] = [
  { id: 0, pos: [0, 0], color: "#22d3ee", isPlayer: true, name: "You" },
  { id: 1, pos: [22, 0], color: "#dc2626", isPlayer: false, name: "RoboRex" },
  { id: 2, pos: [-22, 0], color: "#9333ea", isPlayer: false, name: "PixelPete" },
  { id: 3, pos: [0, -22], color: "#16a34a", isPlayer: false, name: "BloxBot" },
];

const SEED_SHOP_POS: [number, number] = [10, 14];
const SELL_SHOP_POS: [number, number] = [-10, 14];

const SHOP_BOXES: AABB[] = [
  { pos: [SEED_SHOP_POS[0], 1, SEED_SHOP_POS[1]], size: [3, 2, 3] },
  { pos: [SELL_SHOP_POS[0], 1, SELL_SHOP_POS[1]], size: [3, 2, 3] },
];

type Plot = { kind: CropKind | null; plantedAt: number };
type Refs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean };
  // Each plot has its own grid; plot 0 = the player's
  plots: Plot[][][]; // [plotIdx][r][c]
  inventory: Partial<Record<CropKind, number>>; // counts of harvested crops in pocket
  seeds: Partial<Record<CropKind, number>>; // owned seeds
};

function makeRefs(initialBux: number): Refs {
  const plots: Plot[][][] = PLOTS.map(() =>
    Array.from({ length: ROW }, () =>
      Array.from({ length: COL }, () => ({ kind: null, plantedAt: 0 })),
    ),
  );
  return {
    player: { pos: new THREE.Vector3(0, 1, PLOT_SIZE), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true },
    plots,
    inventory: {},
    seeds: { carrot: 5 }, // start with 5 carrot seeds
  };
}

function plotTileWorldPos(plotIdx: number, r: number, c: number): [number, number] {
  const p = PLOTS[plotIdx];
  const x = p.pos[0] + (c - (COL - 1) / 2) * TILE;
  const z = p.pos[1] + (r - (ROW - 1) / 2) * TILE;
  return [x, z];
}

function World() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>
      {/* Plots */}
      {PLOTS.map((p) => (
        <group key={p.id} position={[p.pos[0], 0, p.pos[1]]}>
          {/* base */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[PLOT_SIZE - 1, PLOT_SIZE - 1]} />
            <meshStandardMaterial color="#3f6212" />
          </mesh>
          {/* fence corners */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map((s, i) => (
            <mesh key={i} position={[s[0] * (PLOT_SIZE / 2 - 0.4), 0.5, s[1] * (PLOT_SIZE / 2 - 0.4)]} castShadow>
              <boxGeometry args={[0.3, 1, 0.3]} />
              <meshStandardMaterial color={p.color} />
            </mesh>
          ))}
          {/* dirt tiles */}
          {Array.from({ length: ROW }).map((_, r) =>
            Array.from({ length: COL }).map((_, c) => {
              const dx = (c - (COL - 1) / 2) * TILE;
              const dz = (r - (ROW - 1) / 2) * TILE;
              return (
                <mesh key={`${r}-${c}`} position={[dx, 0.06, dz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[TILE * 0.85, TILE * 0.85]} />
                  <meshStandardMaterial color="#78350f" />
                </mesh>
              );
            })
          )}
          {/* name marker */}
          <mesh position={[0, 1.6, -PLOT_SIZE / 2 + 0.4]} castShadow>
            <boxGeometry args={[2.4, 0.5, 0.2]} />
            <meshStandardMaterial color={p.color} />
          </mesh>
        </group>
      ))}

      {/* Seed shop */}
      <group position={[SEED_SHOP_POS[0], 0, SEED_SHOP_POS[1]]}>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[3, 2, 3]} /><meshStandardMaterial color="#16a34a" /></mesh>
        <mesh position={[0, 2.4, 0]} castShadow><boxGeometry args={[3.6, 0.4, 3.6]} /><meshStandardMaterial color="#15803d" /></mesh>
        <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[2, 0.7, 0.2]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      </group>

      {/* Sell shop */}
      <group position={[SELL_SHOP_POS[0], 0, SELL_SHOP_POS[1]]}>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[3, 2, 3]} /><meshStandardMaterial color="#a16207" /></mesh>
        <mesh position={[0, 2.4, 0]} castShadow><boxGeometry args={[3.6, 0.4, 3.6]} /><meshStandardMaterial color="#facc15" /></mesh>
        <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[2, 0.7, 0.2]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      </group>
    </>
  );
}

function CropMesh({ refs, plotIdx, r, c }: { refs: RefObject<Refs>; plotIdx: number; r: number; c: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const rs = refs.current; if (!rs || !ref.current) return;
    const p = rs.plots[plotIdx][r][c];
    if (!p.kind) { ref.current.visible = false; return; }
    const info = CROP_INFO[p.kind];
    const t = Math.min(1, (performance.now() - p.plantedAt) / info.growMs);
    ref.current.visible = true;
    const s = 0.18 + t * 0.55;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshStandardMaterial).color.set(info.color);
    (ref.current.material as THREE.MeshStandardMaterial).emissive.set(t >= 1 ? info.color : "#000");
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = t >= 1 ? 0.5 : 0;
  });
  const [x, z] = plotTileWorldPos(plotIdx, r, c);
  return (
    <mesh ref={ref} position={[x, 0.6, z]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color="#000" />
    </mesh>
  );
}

function PlayerCtl({ refs, input, onShop, onSell, selectedSeed }: {
  refs: RefObject<Refs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; action: boolean; lookDX: number; lookDY: number; zoomOut: boolean }>;
  onShop: () => void;
  onSell: () => void;
  selectedSeed: CropKind;
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
    resolveBoxCollisions(p.pos, SHOP_BOXES);
    if (p.pos.y <= 1) { p.pos.y = 1; p.vel.y = 0; p.onGround = true; }

    const a = input.current.action;
    if (a && !lastAction.current) {
      // Check shops first
      if (Math.hypot(p.pos.x - SEED_SHOP_POS[0], p.pos.z - SEED_SHOP_POS[1]) < 3) {
        onShop();
      } else if (Math.hypot(p.pos.x - SELL_SHOP_POS[0], p.pos.z - SELL_SHOP_POS[1]) < 3) {
        onSell();
      } else {
        // Find nearest tile in OUR plot only
        let best: { r: number; c: number; d: number } | null = null;
        for (let rr = 0; rr < ROW; rr++) for (let cc = 0; cc < COL; cc++) {
          const [x, z] = plotTileWorldPos(0, rr, cc);
          const d = Math.hypot(p.pos.x - x, p.pos.z - z);
          if (d < 1.4 && (!best || d < best.d)) best = { r: rr, c: cc, d };
        }
        if (best) {
          const plot = r.plots[0][best.r][best.c];
          if (!plot.kind) {
            // plant if we have seed
            if ((r.seeds[selectedSeed] ?? 0) > 0) {
              plot.kind = selectedSeed;
              plot.plantedAt = performance.now();
              r.seeds[selectedSeed] = (r.seeds[selectedSeed] ?? 0) - 1;
            }
          } else {
            const info = CROP_INFO[plot.kind];
            const ready = performance.now() - plot.plantedAt >= info.growMs;
            if (ready) {
              r.inventory[plot.kind] = (r.inventory[plot.kind] ?? 0) + 1;
              plot.kind = null; plot.plantedAt = 0;
            }
          }
        }
      }
    }
    lastAction.current = a;

    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);
  });
  return null;
}

/** Bots that automatically plant + harvest on their own plots — purely visual. */
function BotsCtl({ refs }: { refs: RefObject<Refs> }) {
  const tickAcc = useRef(0);
  useFrame((_s, dt) => {
    const r = refs.current; if (!r) return;
    tickAcc.current += dt;
    if (tickAcc.current < 1) return;
    tickAcc.current = 0;
    for (let pi = 1; pi < PLOTS.length; pi++) {
      // Find an empty tile and plant a random crop
      const grid = r.plots[pi];
      const empties: [number, number][] = [];
      for (let rr = 0; rr < ROW; rr++) for (let cc = 0; cc < COL; cc++) {
        if (!grid[rr][cc].kind) empties.push([rr, cc]);
      }
      if (empties.length > 0 && Math.random() < 0.5) {
        const [rr, cc] = empties[Math.floor(Math.random() * empties.length)];
        const kind = CROP_KEYS[Math.min(CROP_KEYS.length - 1, Math.floor(Math.random() * 3))];
        grid[rr][cc] = { kind, plantedAt: performance.now() - Math.random() * CROP_INFO[kind].growMs * 0.4 };
      }
      // Harvest ready crops
      for (let rr = 0; rr < ROW; rr++) for (let cc = 0; cc < COL; cc++) {
        const t = grid[rr][cc];
        if (t.kind && performance.now() - t.plantedAt > CROP_INFO[t.kind].growMs + 4000) {
          grid[rr][cc] = { kind: null, plantedAt: 0 };
        }
      }
    }
  });
  return null;
}

function GardenPage() {
  const { user, profile, avatar, loading, addBux, setBuxLocal } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<Refs>(makeRefs(profile?.bux ?? 0));
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [seed, setSeed] = useState<CropKind>("carrot");
  const [, setTick] = useState(0);
  const [shopOpen, setShopOpen] = useState<"seed" | "sell" | null>(null);

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

  // Hotkey 1-5 for crop select
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = ["Digit1","Digit2","Digit3","Digit4","Digit5"].indexOf(e.code);
      if (idx >= 0) setSeed(CROP_KEYS[idx]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // periodic re-render so shop counts update
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const buySeed = async (kind: CropKind, qty = 1) => {
    if (!user || !profile) return;
    const cost = CROP_INFO[kind].cost * qty;
    if (profile.bux < cost) { toast.error("Not enough Bux"); return; }
    const newBux = profile.bux - cost;
    setBuxLocal(newBux);
    refs.current.seeds[kind] = (refs.current.seeds[kind] ?? 0) + qty;
    await supabase.from("profiles").update({ bux: newBux }).eq("id", user.id);
    toast.success(`+${qty} ${CROP_INFO[kind].label} seed`);
  };

  const sellAll = async () => {
    if (!user || !profile) return;
    const inv = refs.current.inventory;
    let total = 0;
    for (const k of CROP_KEYS) {
      const n = inv[k] ?? 0;
      total += n * CROP_INFO[k].price;
      inv[k] = 0;
    }
    if (total <= 0) { toast.message("Nothing to sell"); return; }
    addBux(total);
    await supabase.from("profiles").update({ bux: profile.bux + total }).eq("id", user.id);
    await supabase.from("game_scores").insert({
      user_id: user.id, username: profile.username, game: "grow-garden", score: total, bux_earned: total,
    });
    toast.success(`Sold for ${total} Bux!`);
  };

  if (!user || !profile || !avatar) return null;

  const inv = refs.current.inventory;
  const heldValue = CROP_KEYS.reduce((s, k) => s + (inv[k] ?? 0) * CROP_INFO[k].price, 0);

  return (
    <div className="min-h-screen">
      <HeaderBar location="Grow a Garden" />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, 8], fov: 75 }}>
            <Sky sunPosition={[50, 40, 30]} />
            <ambientLight intensity={0.85} />
            <directionalLight position={[10, 20, 5]} intensity={1.1} castShadow />
            <World />
            {PLOTS.map((p, pi) => (
              Array.from({ length: ROW }).map((_, r) =>
                Array.from({ length: COL }).map((_, c) => (
                  <CropMesh key={`${pi}-${r}-${c}`} refs={refs} plotIdx={pi} r={r} c={c} />
                ))
              )
            ))}
            <SelfAvatar posRef={{ current: refs.current.player }} inputRef={input} config={avatar} />
            <PlayerCtl
              refs={refs}
              input={input}
              onShop={() => { setShopOpen("seed"); document.exitPointerLock?.(); }}
              onSell={() => { setShopOpen("sell"); document.exitPointerLock?.(); }}
              selectedSeed={seed}
            />
            <BotsCtl refs={refs} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-black/60 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70"><Sprout className="h-3.5 w-3.5" /> Seed</div>
                <div className="font-display text-xl text-white">{CROP_INFO[seed].label}</div>
                <div className="text-xs text-white/70">{refs.current.seeds[seed] ?? 0} owned</div>
              </div>
              <div className="rounded-xl bg-black/60 px-4 py-3 text-right text-bux backdrop-blur">
                <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-white/70"><Coins className="h-3.5 w-3.5" /> Held</div>
                <div className="font-display text-xl">${heldValue}</div>
              </div>
            </div>

            {/* Quick seed bar */}
            <div className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 rounded-xl bg-black/60 px-3 py-2 text-white backdrop-blur">
              <div className="flex gap-1.5">
                {CROP_KEYS.map((k, i) => {
                  const Info = CROP_INFO[k];
                  const owned = refs.current.seeds[k] ?? 0;
                  return (
                    <button
                      key={k}
                      onClick={() => setSeed(k)}
                      className={`min-w-[64px] rounded-md px-2 py-1.5 text-xs ${seed === k ? "bg-primary text-primary-foreground" : "bg-white/10"}`}
                    >
                      <div className="text-[10px] opacity-70">{i + 1}</div>
                      <div className="font-bold" style={{ color: seed === k ? undefined : Info.color }}>{Info.label}</div>
                      <div className="text-[10px]">×{owned}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!locked && !shopOpen && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">Grow a Garden</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Your plot is the cyan one. Buy seeds at the green shop, sell crops at the gold shop. Walk around the other gardens too — each player gets their own plot.</p>
                  <button onClick={() => containerRef.current?.requestPointerLock?.()} className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block">
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · E plant/harvest/shop · 1-5 seed · V zoom-out</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> L-stick · RT action · R-stick look {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {/* Seed Shop modal */}
            {shopOpen === "seed" && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/70 backdrop-blur">
                <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-block">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-2xl"><ShoppingCart className="h-5 w-5" /> Seed Shop</h2>
                    <span className="rounded-full bg-bux/20 px-3 py-1 text-sm font-bold text-bux">{profile.bux} Bux</span>
                  </div>
                  <div className="space-y-2">
                    {CROP_KEYS.map((k) => {
                      const Info = CROP_INFO[k];
                      return (
                        <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md" style={{ background: Info.color }} />
                            <div>
                              <div className="font-bold">{Info.label}</div>
                              <div className="text-xs text-muted-foreground">Grows in {Math.round(Info.growMs / 1000)}s · sells for {Info.price}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{Info.cost} Bux/seed</span>
                            <button onClick={() => buySeed(k, 1)} className="rounded-md bg-success px-3 py-1.5 text-sm font-bold text-white">×1</button>
                            <button onClick={() => buySeed(k, 5)} className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">×5</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setShopOpen(null)} className="mt-4 w-full rounded-md bg-secondary py-2 font-bold">Close</button>
                </div>
              </div>
            )}

            {/* Sell Shop modal */}
            {shopOpen === "sell" && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/70 backdrop-blur">
                <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-block">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-2xl"><Store className="h-5 w-5" /> Market</h2>
                    <span className="rounded-full bg-bux/20 px-3 py-1 text-sm font-bold text-bux">{profile.bux} Bux</span>
                  </div>
                  <div className="space-y-2">
                    {CROP_KEYS.map((k) => {
                      const Info = CROP_INFO[k];
                      const n = inv[k] ?? 0;
                      return (
                        <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md" style={{ background: Info.color }} />
                            <div>
                              <div className="font-bold">{Info.label}</div>
                              <div className="text-xs text-muted-foreground">{Info.price} Bux each</div>
                            </div>
                          </div>
                          <div className="font-bold">×{n}</div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { void sellAll(); setShopOpen(null); }}
                    className="mt-4 w-full rounded-md bg-bux py-2 font-bold text-black"
                  >
                    Sell all → ${heldValue}
                  </button>
                  <button onClick={() => setShopOpen(null)} className="mt-2 w-full rounded-md bg-secondary py-2 font-bold">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
