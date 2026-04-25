import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { toast } from "sonner";
import { useAuth, type AvatarConfig } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar, FACES, HATS } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { Save } from "lucide-react";

export const Route = createFileRoute("/avatar")({
  head: () => ({
    meta: [
      { title: "Avatar Editor — BloxWorld" },
      { name: "description", content: "Pick R6 or R15, swap shirts, pants, faces, and hats. Live 3D preview." },
    ],
  }),
  component: AvatarPage,
});

const SKIN = ["#f5c896", "#e0ac69", "#c68642", "#8d5524", "#f1c27d", "#ffdbac", "#a78b6f", "#3b2f2f"];
const SHIRT = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#f59e0b", "#ec4899", "#0ea5e9", "#111827"];
const PANTS = ["#1f2937", "#1e3a8a", "#3f6212", "#78350f", "#581c87", "#0f172a", "#374151", "#7c2d12"];

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 w-9 rounded-md border-2 transition ${active ? "border-foreground scale-110" : "border-border"} shadow-block`}
      style={{ backgroundColor: color }}
      aria-label={color}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function AvatarPage() {
  const { user, avatar, loading, setAvatarLocal } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AvatarConfig | null>(avatar);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);
  useEffect(() => { if (avatar && !draft) setDraft(avatar); }, [avatar, draft]);

  if (!user || !draft) return null;

  const update = (patch: Partial<AvatarConfig>) => setDraft({ ...draft, ...patch });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("avatars").upsert({ user_id: user.id, ...draft });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setAvatarLocal(draft);
    toast.success("Avatar saved!");
  };

  return (
    <div className="min-h-screen">
      <HeaderBar location="Avatar" />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1.2fr_1fr]">
        {/* 3D preview */}
        <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-3xl border border-border shadow-block lg:h-[78vh]">
          <Canvas shadows camera={{ position: [4, 3, 6], fov: 45 }}>
            <color attach="background" args={["#0a1029"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
            <Environment preset="city" />
            <BlockyAvatar config={draft} />
            <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
            <OrbitControls enablePan={false} target={[0, 1.7, 0]} minDistance={3} maxDistance={10} />
          </Canvas>
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            Drag to rotate · scroll to zoom
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-block">
          <div>
            <h1 className="font-display text-3xl">Avatar editor</h1>
            <p className="text-sm text-muted-foreground">Click anything. Save when you're happy.</p>
          </div>

          <Section title="Rig">
            {(["R6", "R15"] as const).map((r) => (
              <button
                key={r}
                onClick={() => update({ rig: r })}
                className={`rounded-md border-2 px-4 py-2 font-display ${draft.rig === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary"}`}
              >
                {r}
              </button>
            ))}
            <div className="ml-1 self-center text-xs text-muted-foreground">
              {draft.rig === "R6" ? "Classic 6-limb body" : "15-piece articulated body"}
            </div>
          </Section>

          <Section title="Skin">
            {SKIN.map((c) => <Swatch key={c} color={c} active={draft.skin_color === c} onClick={() => update({ skin_color: c })} />)}
          </Section>

          <Section title="Shirt">
            {SHIRT.map((c) => <Swatch key={c} color={c} active={draft.shirt_color === c} onClick={() => update({ shirt_color: c })} />)}
          </Section>

          <Section title="Pants">
            {PANTS.map((c) => <Swatch key={c} color={c} active={draft.pants_color === c} onClick={() => update({ pants_color: c })} />)}
          </Section>

          <Section title="Face">
            {FACES.map((f) => (
              <button
                key={f}
                onClick={() => update({ face: f })}
                className={`rounded-md border-2 px-3 py-1.5 text-sm font-bold capitalize ${draft.face === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary"}`}
              >
                {f}
              </button>
            ))}
          </Section>

          <Section title="Hat">
            {HATS.map((h) => (
              <button
                key={h}
                onClick={() => update({ hat: h })}
                className={`rounded-md border-2 px-3 py-1.5 text-sm font-bold capitalize ${draft.hat === h ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary"}`}
              >
                {h}
              </button>
            ))}
          </Section>

          <button
            onClick={save}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block transition hover:translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-5 w-5" /> {saving ? "Saving..." : "Save avatar"}
          </button>
        </div>
      </main>
    </div>
  );
}
