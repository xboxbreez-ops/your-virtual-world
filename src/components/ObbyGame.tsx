import { Link, useNavigate } from "@tanstack/react-router";
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
import { applyPlayerCamera } from "@/lib/camera";
import { type Platform, platformGround, platformWorldPos } from "@/lib/obby";
import { Flag, Timer, Coins, Keyboard, Gamepad2, RefreshCcw } from "lucide-react";

type Refs = {
  player: { pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number; onGround: boolean };
  spawn: THREE.Vector3;
  finished: boolean;
  startedAt: number;
  finishTime: number;
};

function makeRefs(spawn: THREE.Vector3): Refs {
  return {
    player: {
      pos: spawn.clone(),
      vel: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      onGround: true,
    },
    spawn: spawn.clone(),
    finished: false,
    startedAt: performance.now() / 1000,
    finishTime: 0,
  };
}

function PlatformsMesh({ platforms }: { platforms: Platform[] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < platforms.length; i++) {
      const c = g.children[i];
      if (!c) continue;
      const wp = platformWorldPos(platforms[i], t);
      c.position.copy(wp);
    }
  });
  return (
    <group ref={groupRef}>
      {platforms.map((p, i) => (
        <mesh key={i} castShadow receiveShadow position={p.pos}>
          <boxGeometry args={p.size} />
          <meshStandardMaterial
            color={p.color}
            emissive={p.killer ? "#7f1d1d" : p.finish ? "#fbbf24" : p.checkpoint ? "#22d3ee" : "#000"}
            emissiveIntensity={p.killer ? 0.4 : p.finish ? 0.5 : p.checkpoint ? 0.3 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

function PlayerController({
  refs,
  input,
  platforms,
  onCheckpoint,
  onFinish,
  onDeath,
}: {
  refs: RefObject<Refs>;
  input: RefObject<{ f: boolean; b: boolean; l: boolean; r: boolean; jump: boolean; sprint: boolean; lookDX: number; lookDY: number; zoomOut: boolean }>;
  platforms: Platform[];
  onCheckpoint: () => void;
  onFinish: () => void;
  onDeath: () => void;
}) {
  const { camera } = useThree();
  const lastCheckpointRef = useRef<Platform | null>(null);

  useFrame((state, dt) => {
    const r = refs.current;
    if (!r) return;
    const p = r.player;
    if (r.finished) {
      applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);
      return;
    }

    // look
    p.yaw -= input.current.lookDX;
    p.pitch -= input.current.lookDY;
    p.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, p.pitch));
    input.current.lookDX = 0;
    input.current.lookDY = 0;

    // movement
    const speed = input.current.sprint ? 9 : 6;
    const forward = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const move = new THREE.Vector3();
    if (input.current.f) move.add(forward);
    if (input.current.b) move.sub(forward);
    if (input.current.r) move.add(right);
    if (input.current.l) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);
    p.vel.x = move.x;
    p.vel.z = move.z;

    if (input.current.jump && p.onGround) {
      p.vel.y = 8.5;
      p.onGround = false;
    }
    p.vel.y -= 22 * dt;

    p.pos.addScaledVector(p.vel, dt);

    // platform ground check
    const t = state.clock.getElapsedTime();
    const hit = platformGround(p.pos, p.vel.y, platforms, t);
    if (hit.standing) {
      if (p.pos.y <= hit.groundY + 0.05) {
        p.pos.y = hit.groundY;
        p.vel.y = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }
      if (hit.standing.killer) {
        // die
        onDeath();
        const sp = lastCheckpointRef.current
          ? new THREE.Vector3(...lastCheckpointRef.current.pos).add(new THREE.Vector3(0, 1.5, 0))
          : r.spawn.clone();
        p.pos.copy(sp);
        p.vel.set(0, 0, 0);
        return;
      }
      if (hit.standing.checkpoint && lastCheckpointRef.current !== hit.standing) {
        lastCheckpointRef.current = hit.standing;
        onCheckpoint();
      }
      if (hit.standing.finish) {
        r.finished = true;
        r.finishTime = performance.now() / 1000 - r.startedAt;
        onFinish();
      }
    } else {
      p.onGround = false;
    }

    // fall reset
    if (p.pos.y < -25) {
      onDeath();
      const sp = lastCheckpointRef.current
        ? new THREE.Vector3(...lastCheckpointRef.current.pos).add(new THREE.Vector3(0, 1.5, 0))
        : r.spawn.clone();
      p.pos.copy(sp);
      p.vel.set(0, 0, 0);
    }

    applyPlayerCamera(camera, p.pos, p.yaw, p.pitch, input.current.zoomOut);
  });

  return null;
}

/** Bridges Refs.player into the shape SelfAvatar expects. */
function SelfAvatarBridge({
  refs,
  input,
  config,
}: {
  refs: RefObject<Refs>;
  input: RefObject<{ zoomOut: boolean }>;
  config: import("@/lib/auth-context").AvatarConfig;
}) {
  const posRef = useRef<{ pos: THREE.Vector3; yaw: number }>({
    pos: refs.current?.player.pos ?? new THREE.Vector3(),
    yaw: 0,
  });
  useFrame(() => {
    const p = refs.current?.player;
    if (!p) return;
    posRef.current.pos = p.pos;
    posRef.current.yaw = p.yaw;
  });
  return <SelfAvatar posRef={posRef} inputRef={input} config={config} />;
}

export function ObbyGame({
  game,
  title,
  platforms,
  spawn,
  bgFar,
  bgNear,
  rewardPerSec,
  baseReward,
}: {
  game: string;
  title: string;
  platforms: Platform[];
  spawn: [number, number, number];
  bgFar: string;
  bgNear: string;
  rewardPerSec: number; // bonus for finishing fast (max-time)
  baseReward: number;
}) {
  const { user, profile, avatar, loading, addBux } = useAuth();
  const navigate = useNavigate();
  const refs = useRef<Refs>(makeRefs(new THREE.Vector3(...spawn)));
  const containerRef = useRef<HTMLDivElement>(null);
  const { input, usingPad, locked } = useGameInput(containerRef);
  const [elapsed, setElapsed] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reward, setReward] = useState(0);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () =>
      supabase.from("presence").upsert({
        user_id: user.id,
        username: profile.username,
        location: game,
        last_seen: new Date().toISOString(),
      });
    void upsert();
    const t = setInterval(upsert, 20000);
    return () => clearInterval(t);
  }, [user, profile, game]);

  // simple HUD timer
  useEffect(() => {
    const i = setInterval(() => {
      const r = refs.current;
      if (!r || r.finished) return;
      setElapsed(performance.now() / 1000 - r.startedAt);
    }, 100);
    return () => clearInterval(i);
  }, []);

  const onFinish = async () => {
    if (!user || !profile) return;
    if (finished) return;
    const seconds = refs.current.finishTime;
    // reward: base + bonus that decreases linearly with time, min 5
    const bonus = Math.max(0, Math.floor(rewardPerSec - seconds * 0.5));
    const earned = baseReward + bonus;
    setReward(earned);
    setFinished(true);
    addBux(earned);
    await supabase.from("game_scores").insert({
      user_id: user.id,
      username: profile.username,
      game,
      score: Math.floor(seconds),
      bux_earned: earned,
    });
    await supabase.from("profiles").update({ bux: (profile.bux ?? 0) + earned }).eq("id", user.id);
    toast.success(`Finished in ${seconds.toFixed(1)}s — +${earned} Bux!`);
  };

  const onDeath = () => setDeaths((d) => d + 1);
  const onCheckpoint = () => toast.success("Checkpoint!", { duration: 1200 });

  const restart = () => {
    refs.current = makeRefs(new THREE.Vector3(...spawn));
    setElapsed(0);
    setDeaths(0);
    setFinished(false);
    setReward(0);
    containerRef.current?.requestPointerLock?.();
  };

  if (!user || !profile || !avatar) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location={title} />
      <div className="relative mx-auto max-w-7xl px-4 py-4">
        <div ref={containerRef} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-2xl border border-border shadow-block">
          <Canvas shadows camera={{ position: [0, 1.6, 6], fov: 75 }}>
            <Sky sunPosition={[100, 40, 100]} turbidity={2} />
            <fog attach="fog" args={[bgFar, 30, 120]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[20, 40, 20]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -30, 0]} receiveShadow>
              <planeGeometry args={[400, 400]} />
              <meshStandardMaterial color={bgNear} />
            </mesh>
            <PlatformsMesh platforms={platforms} />
            <PlayerController
              refs={refs}
              input={input}
              platforms={platforms}
              onCheckpoint={onCheckpoint}
              onFinish={onFinish}
              onDeath={onDeath}
            />
            <SelfAvatarBridge refs={refs} input={input} config={avatar} />
          </Canvas>

          <SettingsPanel />

          <div className="pointer-events-none absolute inset-0 p-4">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
                  <Timer className="h-3.5 w-3.5" /> Time
                </div>
                <div className="font-display text-2xl text-white">{elapsed.toFixed(1)}s</div>
              </div>
              <div className="rounded-xl bg-black/55 px-4 py-3 text-right backdrop-blur">
                <div className="text-xs uppercase tracking-wider text-white/70">Deaths</div>
                <div className="font-display text-2xl text-white">{deaths}</div>
              </div>
            </div>

            {!locked && !finished && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <h2 className="font-display text-3xl">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Reach the gold finish pad. Don't fall, don't touch lava.</p>
                  <button
                    onClick={() => containerRef.current?.requestPointerLock?.()}
                    className="mt-5 w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block"
                  >
                    Click to start
                  </button>
                  <div className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Keyboard className="h-4 w-4" /> WASD · Space · Shift · V zoom</div>
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Sticks · A · LB sprint {usingPad && <span className="ml-1 rounded-full bg-success/20 px-1.5 text-[10px] text-success">Pad</span>}</div>
                  </div>
                  <Link to="/lobby" className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground">← Back to lobby</Link>
                </div>
              </div>
            )}

            {finished && (
              <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/75 backdrop-blur-sm">
                <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-block">
                  <Flag className="mx-auto h-10 w-10 text-bux" />
                  <h2 className="mt-2 font-display text-3xl text-primary">Finished!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{refs.current.finishTime.toFixed(1)}s · {deaths} deaths</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bux/15 px-4 py-2 text-bux">
                    <Coins className="h-5 w-5" /> <span className="font-display text-xl">+{reward} Bux</span>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button onClick={restart} className="flex-1 rounded-lg bg-primary py-3 font-display text-primary-foreground shadow-block">
                      <RefreshCcw className="mr-1 inline h-4 w-4" /> Again
                    </button>
                    <Link to="/lobby" className="flex-1 rounded-lg bg-secondary py-3 font-display shadow-block">Lobby</Link>
                  </div>
                </div>
              </div>
            )}

            {locked && !finished && (
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
