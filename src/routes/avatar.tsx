import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { toast } from "sonner";
import { useAuth, type AvatarConfig } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BlockyAvatar } from "@/components/BlockyAvatar";
import { HeaderBar } from "@/components/HeaderBar";
import { HAT_CATALOG, FACE_CATALOG, SHIRT_CATALOG, PANTS_CATALOG, HAIR_CATALOG, SHOES_CATALOG, JACKET_CATALOG, itemId } from "@/lib/shop";
import { Save, Lock, Coins, Check, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/avatar")({
  head: () => ({
    meta: [
      { title: "Avatar Editor — BloxWorld" },
      { name: "description", content: "Pick R6 or R15, buy hats, faces, and clothes with Bux. Live 3D preview." },
    ],
  }),
  component: AvatarPage,
});
  head: () => ({
    meta: [
      { title: "Avatar Editor — BloxWorld" },
      { name: "description", content: "Pick R6 or R15, buy hats, faces, and clothes with Bux. Live 3D preview." },
    ],
  }),
  component: AvatarPage,
});

const SKIN = ["#f5c896", "#e0ac69", "#c68642", "#8d5524", "#f1c27d", "#ffdbac", "#a78b6f", "#3b2f2f"];

function AvatarPage() {
  const { user, profile, avatar, inventory, loading, setAvatarLocal, setBuxLocal, addOwnedItem } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AvatarConfig | null>(avatar);
  const [saving, setSaving] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", search: { mode: "signin" } }); }, [user, loading, navigate]);
  useEffect(() => { if (avatar && !draft) setDraft(avatar); }, [avatar, draft]);

  if (!user || !profile || !draft) return null;

  const update = (patch: Partial<AvatarConfig>) => setDraft({ ...draft, ...patch });

  const isOwned = (category: string, key: string, price: number) =>
    price === 0 || inventory.has(itemId(category, key));

  const buy = async (category: string, key: string, price: number, label: string) => {
    if ((profile.bux ?? 0) < price) { toast.error("Not enough Bux"); return; }
    const id = itemId(category, key);
    setBusyItem(id);
    const { data, error } = await supabase.rpc("purchase_item", { _item_id: id, _price: price });
    setBusyItem(null);
    if (error) { toast.error(error.message); return; }
    addOwnedItem(id);
    if (typeof data === "number") setBuxLocal(data);
    toast.success(`Unlocked ${label}!`);
  };

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
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1.1fr_1fr]">
        {/* 3D preview */}
        <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-3xl border border-border shadow-block lg:sticky lg:top-20 lg:h-[78vh]">
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
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-bux backdrop-blur">
            <Coins className="h-3.5 w-3.5" /> {profile.bux} Bux
          </div>
        </div>

        {/* Controls + shop */}
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl">Avatar editor</h1>
              <p className="text-sm text-muted-foreground">Buy with Bux. Equip what you own. Save to keep it.</p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm text-primary-foreground shadow-block transition hover:translate-y-0.5 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
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
            {SKIN.map((c) => (
              <Swatch key={c} color={c} active={draft.skin_color === c} owned onClick={() => update({ skin_color: c })} />
            ))}
          </Section>

          <Section title="Shirt">
            <div className="grid grid-cols-4 gap-2">
              {SHIRT_CATALOG.map((it) => {
                const owned = isOwned("shirt", it.color, it.price);
                const equipped = draft.shirt_color === it.color;
                const id = itemId("shirt", it.color);
                return (
                  <ColorTile
                    key={it.color}
                    color={it.color}
                    label={it.label}
                    price={it.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ shirt_color: it.color })}
                    onBuy={() => buy("shirt", it.color, it.price, it.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Pants">
            <div className="grid grid-cols-4 gap-2">
              {PANTS_CATALOG.map((it) => {
                const owned = isOwned("pants", it.color, it.price);
                const equipped = draft.pants_color === it.color;
                const id = itemId("pants", it.color);
                return (
                  <ColorTile
                    key={it.color}
                    color={it.color}
                    label={it.label}
                    price={it.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ pants_color: it.color })}
                    onBuy={() => buy("pants", it.color, it.price, it.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Face">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {FACE_CATALOG.map((f) => {
                const owned = isOwned("face", f.key, f.price);
                const equipped = draft.face === f.key;
                const id = itemId("face", f.key);
                return (
                  <ItemTile
                    key={f.key}
                    label={f.label}
                    price={f.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ face: f.key })}
                    onBuy={() => buy("face", f.key, f.price, f.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Hair">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {HAIR_CATALOG.map((h) => {
                const owned = isOwned("hair", h.key, h.price);
                const equipped = draft.hair === h.key;
                const id = itemId("hair", h.key);
                return (
                  <ItemTile
                    key={h.key}
                    label={h.label}
                    price={h.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ hair: h.key })}
                    onBuy={() => buy("hair", h.key, h.price, h.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Hat">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {HAT_CATALOG.map((h) => {
                const owned = isOwned("hat", h.key, h.price);
                const equipped = draft.hat === h.key;
                const id = itemId("hat", h.key);
                return (
                  <ItemTile
                    key={h.key}
                    label={h.label}
                    price={h.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ hat: h.key })}
                    onBuy={() => buy("hat", h.key, h.price, h.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Jacket (3D)">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {JACKET_CATALOG.map((j) => {
                const owned = isOwned("jacket", j.key, j.price);
                const equipped = draft.jacket === j.key;
                const id = itemId("jacket", j.key);
                return (
                  <ItemTile
                    key={j.key}
                    label={j.label}
                    price={j.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ jacket: j.key })}
                    onBuy={() => buy("jacket", j.key, j.price, j.label)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Shoes">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {SHOES_CATALOG.map((s) => {
                const owned = isOwned("shoes", s.key, s.price);
                const equipped = draft.shoes === s.key;
                const id = itemId("shoes", s.key);
                return (
                  <ItemTile
                    key={s.key}
                    label={s.label}
                    price={s.price}
                    owned={owned}
                    equipped={equipped}
                    busy={busyItem === id}
                    onEquip={() => update({ shoes: s.key })}
                    onBuy={() => buy("shoes", s.key, s.price, s.label)}
                  />
                );
              })}
            </div>
          </Section>
        </div>
      </main>
    </div>
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

function Swatch({ color, active, owned, onClick }: { color: string; active: boolean; owned: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!owned}
      className={`h-9 w-9 rounded-md border-2 transition ${active ? "border-foreground scale-110" : "border-border"} shadow-block disabled:opacity-50`}
      style={{ backgroundColor: color }}
      aria-label={color}
    />
  );
}

function ColorTile(props: {
  color: string; label: string; price: number;
  owned: boolean; equipped: boolean; busy: boolean;
  onEquip: () => void; onBuy: () => void;
}) {
  const { color, label, price, owned, equipped, busy, onEquip, onBuy } = props;
  return (
    <div className={`relative overflow-hidden rounded-lg border-2 ${equipped ? "border-primary" : "border-border"}`}>
      <button
        onClick={owned ? onEquip : onBuy}
        disabled={busy}
        className="block h-16 w-full"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      <div className="flex items-center justify-between bg-card/90 px-2 py-1 text-[11px]">
        <span className="truncate font-semibold">{label}</span>
        {equipped ? (
          <span className="flex items-center gap-0.5 text-success"><Check className="h-3 w-3" /></span>
        ) : owned ? (
          <span className="text-muted-foreground">Own</span>
        ) : (
          <span className="flex items-center gap-0.5 text-bux"><Coins className="h-3 w-3" />{price}</span>
        )}
      </div>
      {!owned && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40">
          <Lock className="h-4 w-4 text-white/90" />
        </div>
      )}
    </div>
  );
}

function ItemTile(props: {
  label: string; price: number;
  owned: boolean; equipped: boolean; busy: boolean;
  onEquip: () => void; onBuy: () => void;
}) {
  const { label, price, owned, equipped, busy, onEquip, onBuy } = props;
  return (
    <button
      onClick={owned ? onEquip : onBuy}
      disabled={busy}
      className={`relative rounded-lg border-2 px-3 py-2 text-left text-sm font-bold capitalize transition ${
        equipped ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary hover:bg-secondary/70"
      } disabled:opacity-50`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate">{label}</span>
        {equipped ? (
          <Check className="h-3.5 w-3.5" />
        ) : owned ? (
          <span className="text-[10px] text-muted-foreground">Own</span>
        ) : (
          <span className="flex items-center gap-0.5 text-[11px] text-bux"><Coins className="h-3 w-3" />{price}</span>
        )}
      </div>
      {!owned && (
        <Lock className="absolute right-1 top-1 h-3 w-3 text-white/70" />
      )}
    </button>
  );
}
