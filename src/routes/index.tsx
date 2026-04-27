import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Canvas } from "@react-three/fiber";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { Gamepad2, Sparkles, Coins, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloxWorld — Build, Play, Survive" },
      { name: "description", content: "Sign up free, customize your blocky avatar, and jump into 3D multiplayer games. Earn Bux as you play." },
      { property: "og:title", content: "BloxWorld — Build, Play, Survive" },
      { property: "og:description", content: "Customize R6/R15 avatars and play Natural Disaster Survival in your browser." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && user) void navigate({ to: "/lobby" }); }, [user, loading, navigate]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(1_0_0/0.15),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-16 pb-24 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Free to play · Multiplayer · 3D
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] text-white drop-shadow-lg sm:text-7xl">
              Build it.<br />Play it.<br /><span className="text-bux">Survive it.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/90">
              Make your blocky avatar your own — pick R6 or R15 rigs, swap shirts, hats and faces — then jump into a world of 3D games and earn Bux.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-lg bg-white px-6 py-3 font-display text-lg text-primary shadow-block transition hover:translate-y-0.5">
                Play free
              </Link>
              <Link to="/auth" search={{ mode: "signin" }} className="rounded-lg border-2 border-white/80 bg-transparent px-6 py-3 font-display text-lg text-white hover:bg-white/10">
                Log in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Xbox controller supported</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /> See live players</div>
              <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-bux" /> Earn Bux every match</div>
            </div>
          </div>

          {/* 3D preview */}
          <div className="relative h-[440px] rounded-3xl border-4 border-white/20 bg-black/30 shadow-block backdrop-blur">
            <Canvas shadows camera={{ position: [4, 3, 6], fov: 45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <BlockyAvatar
                config={{ rig: "R15", skin_color: "#f5c896", shirt_color: "#7c3aed", pants_color: "#1e3a8a", face: "kawaii", hat: "fire", hair: "long", shoes: "goldenkicks", jacket: "wings" }}
              />
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[6, 32]} />
                <meshStandardMaterial color="#0a0a14" />
              </mesh>
            </Canvas>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80">Live preview</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="font-display text-4xl">Everything you'd expect.</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">A full sandbox of customization and games — not a static demo.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { t: "Avatar editor", d: "R6 & R15 rigs, body parts, shirts, pants, faces, hats, hair, shoes, jackets. Real 3D preview that animates while you tweak.", icon: "👕" },
            { t: "6 real games", d: "Disasters, shooter arena, brainrot tycoon, garden sim, plus Tower of Hell + Speed Run obbys. All 3D, all playable now.", icon: "🎮" },
            { t: "Bux economy", d: "Survive, fight, harvest, and climb to stack Bux. Spend on hats, hair, shoes, and jackets in the avatar shop.", icon: "🪙" },
            { t: "Friends + presence", d: "Search a username, send a request, and jump into whatever game your friends are playing — one click.", icon: "👥" },
            { t: "Controller ready", d: "Full Xbox / generic gamepad support. Move, jump, look around, and toggle third-person zoom with the right stick.", icon: "🎯" },
            { t: "Username + password", d: "Make an account in seconds — no email required.", icon: "🔐" },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-6 shadow-block">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES STRIP */}
      <section className="border-t border-border bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-4xl">Six games. One avatar.</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Hop between worlds and your fit comes with you.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { t: "Natural Disaster", icon: "🌪️", bg: "linear-gradient(135deg,#f97316,#b91c1c)" },
              { t: "Rivals Arena", icon: "🎯", bg: "linear-gradient(135deg,#1e40af,#06b6d4)" },
              { t: "Steal Brainrot", icon: "🧠", bg: "linear-gradient(135deg,#a21caf,#ec4899)" },
              { t: "Grow Garden", icon: "🌱", bg: "linear-gradient(135deg,#166534,#84cc16)" },
              { t: "Tower of Hell", icon: "🗼", bg: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
              { t: "Speed Run", icon: "🏃", bg: "linear-gradient(135deg,#0c4a6e,#06b6d4)" },
            ].map((g) => (
              <div key={g.t} className="rounded-xl border border-border p-4 text-center shadow-block" style={{ background: g.bg }}>
                <div className="text-4xl drop-shadow">{g.icon}</div>
                <div className="mt-2 text-sm font-bold text-white">{g.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        BloxWorld is a fan-made parody. Not affiliated with Roblox Corporation.
      </footer>
    </div>
  );
}
