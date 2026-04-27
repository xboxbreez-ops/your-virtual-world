import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { FriendsPanel } from "@/components/FriendsPanel";
import { Users, Play, Lock, Cloud } from "lucide-react";

export const Route = createFileRoute("/lobby")({
  head: () => ({
    meta: [
      { title: "Lobby — BloxWorld" },
      { name: "description", content: "Pick a 3D game to play, see who's online, and earn Bux." },
    ],
  }),
  component: LobbyPage,
});

type Player = { user_id: string; username: string; location: string };

const GAMES = [
  {
    id: "natural-disaster",
    title: "Natural Disaster Survival",
    blurb: "Survive earthquakes, tornadoes, and floods on Block Island. Last one standing wins big Bux.",
    bg: "linear-gradient(135deg, #f97316, #b91c1c)",
    icon: "🌪️",
    playable: true,
    route: "/play/natural-disaster" as const,
  },
  {
    id: "rivals",
    title: "Rivals Arena",
    blurb: "Queue 1v1 / 2v2 / 3v3 with friends or bots. Pick a weapon class and rack up eliminations.",
    bg: "linear-gradient(135deg, #1e40af, #06b6d4)",
    icon: "🎯",
    playable: true,
    route: "/play/rivals" as const,
  },
  {
    id: "steal-brainrot",
    title: "Steal a Brainrot",
    blurb: "Buy brainrots from the spawning carpet. They walk to your base and pay you per second.",
    bg: "linear-gradient(135deg, #a21caf, #ec4899)",
    icon: "🧠",
    playable: true,
    route: "/play/steal-brainrot" as const,
  },
  {
    id: "grow-garden",
    title: "Grow a Garden",
    blurb: "Own a plot, buy seeds, harvest crops, and sell them at the market for stacks of Bux.",
    bg: "linear-gradient(135deg, #166534, #84cc16)",
    icon: "🌱",
    playable: true,
    route: "/play/grow-garden" as const,
  },
  {
    id: "obby-tower",
    title: "Tower of Hell",
    blurb: "Climb the spinning, lava-filled tower. Reach the top without falling for big Bux.",
    bg: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    icon: "🗼",
    playable: true,
    route: "/play/obby-tower" as const,
  },
  {
    id: "obby-speed",
    title: "Speed Run",
    blurb: "Sprint across moving planks, hop lava strips, and beat the clock to the gold pad.",
    bg: "linear-gradient(135deg, #0c4a6e, #06b6d4)",
    icon: "🏃",
    playable: true,
    route: "/play/obby-speed" as const,
  },
];

function LobbyPage() {
  const { user, profile, avatar, loading } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);

  // Auth gate
  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);

  // Heartbeat presence
  useEffect(() => {
    if (!user || !profile) return;
    const upsert = () =>
      supabase.from("presence").upsert({
        user_id: user.id,
        username: profile.username,
        location: "lobby",
        last_seen: new Date().toISOString(),
      });
    void upsert();
    const t = setInterval(upsert, 20000);
    return () => clearInterval(t);
  }, [user, profile]);

  // Live presence list
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const cutoff = new Date(Date.now() - 60_000).toISOString();
      const { data } = await supabase
        .from("presence")
        .select("user_id, username, location")
        .gte("last_seen", cutoff)
        .order("username", { ascending: true })
        .limit(50);
      if (mounted && data) setPlayers(data as Player[]);
    };
    void load();
    const t = setInterval(load, 8000);
    const ch = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, () => void load())
      .subscribe();
    return () => { mounted = false; clearInterval(t); void supabase.removeChannel(ch); };
  }, []);

  if (loading || !user || !profile) return null;

  return (
    <div className="min-h-screen">
      <HeaderBar location="Lobby" />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="font-display text-4xl">Discover</h1>
              <p className="mt-1 text-sm text-muted-foreground">Jump into a 3D world. Earn Bux. Show off your fit.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {GAMES.map((g) => (
              <article key={g.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-block">
                <div className="relative aspect-video" style={{ background: g.bg }}>
                  <div className="absolute inset-0 grid place-items-center text-7xl drop-shadow-lg">{g.icon}</div>
                  <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {Math.max(1, players.filter((p) => p.location === g.id).length + (g.playable ? 6 : 1))}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl">{g.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.blurb}</p>
                  <div className="mt-3 flex items-center justify-between">
                    {g.playable ? (
                      <Link
                        to={g.route!}
                        className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-bold text-white shadow-block transition hover:translate-y-0.5"
                      >
                        <Play className="h-4 w-4 fill-white" /> Play
                      </Link>
                    ) : (
                      <button disabled className="inline-flex items-center gap-1.5 rounded-md bg-muted px-4 py-2 text-sm font-bold text-muted-foreground">
                        <Lock className="h-4 w-4" /> Soon
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">+10–250 Bux</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-block">
            <div className="relative h-56 gradient-sky">
              {avatar && (
                <Canvas shadows camera={{ position: [3, 3, 5], fov: 40 }}>
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
                  <BlockyAvatar config={avatar} />
                  <OrbitControls enablePan={false} enableZoom={false} target={[0, 1.7, 0]} autoRotate autoRotateSpeed={1.4} />
                </Canvas>
              )}
            </div>
            <div className="p-4">
              <div className="text-sm text-muted-foreground">Logged in as</div>
              <div className="font-display text-2xl">@{profile.username}</div>
              <Link to="/avatar" className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-block">
                Customize avatar
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
            <h3 className="mb-3 font-display text-lg">Friends</h3>
            <FriendsPanel compact />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg">Online now</h3>
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">{players.length}</span>
            </div>
            <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {players.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><Cloud className="h-4 w-4" /> Just you for now.</li>
              )}
              {players.map((p) => (
                <li key={p.user_id} className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="font-semibold">@{p.username}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{p.location}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
