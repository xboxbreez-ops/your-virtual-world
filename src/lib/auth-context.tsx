import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; username: string; bux: number };
export type AvatarConfig = {
  rig: "R6" | "R15" | "Realistic";
  skin_color: string;
  shirt_color: string;
  pants_color: string;
  face: string;
  hat: string;
  hair: string;
  shoes: string;
  jacket: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  avatar: AvatarConfig | null;
  inventory: Set<string>;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAvatarLocal: (a: AvatarConfig) => void;
  addBux: (n: number) => void;
  setBuxLocal: (n: number) => void;
  addOwnedItem: (id: string) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

// Convert username -> synthetic email so Supabase email/password auth works
const usernameToEmail = (u: string) => `${u.toLowerCase().replace(/[^a-z0-9_]/g, "")}@bloxworld.local`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [inventory, setInventory] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAll = async (uid: string) => {
    const [{ data: p }, { data: a }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("id, username, bux").eq("id", uid).maybeSingle(),
      supabase.from("avatars").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("inventory").select("item_id").eq("user_id", uid),
    ]);
    if (p) setProfile(p as Profile);
    if (a) setAvatar({
      rig: a.rig as "R6" | "R15" | "Realistic",
      skin_color: a.skin_color,
      shirt_color: a.shirt_color,
      pants_color: a.pants_color,
      face: a.face,
      hat: a.hat,
      hair: a.hair ?? "none",
      shoes: a.shoes ?? "sneakers",
      jacket: a.jacket ?? "none",
    });
    setInventory(new Set((inv ?? []).map((row: { item_id: string }) => row.item_id)));
  };

  useEffect(() => {
    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer DB calls
        setTimeout(() => { void loadAll(s.user.id); }, 0);
      } else {
        setProfile(null);
        setAvatar(null);
        setInventory(new Set());
      }
    });
    // Then existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) void loadAll(s.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Global presence heartbeat — keeps user "online" everywhere (homepage, avatar editor, etc.).
  // Game routes overwrite `location` with their own value while mounted.
  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    const beat = async () => {
      if (cancelled) return;
      // Use a lightweight default location; game routes will override with their own.
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      let loc = "lobby";
      if (path.startsWith("/play/")) loc = path.replace("/play/", "");
      else if (path === "/avatar") loc = "avatar";
      else if (path === "/") loc = "home";
      await supabase.from("presence").upsert({
        user_id: user.id,
        username: profile.username,
        location: loc,
        last_seen: new Date().toISOString(),
      });
    };
    void beat();
    const t = setInterval(beat, 20_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [user, profile]);

  const signUp = async (username: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (user) await supabase.from("presence").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => { if (user) await loadAll(user.id); };
  const setAvatarLocal = (a: AvatarConfig) => setAvatar(a);
  const addBux = (n: number) => setProfile((p) => (p ? { ...p, bux: p.bux + n } : p));
  const setBuxLocal = (n: number) => setProfile((p) => (p ? { ...p, bux: n } : p));
  const addOwnedItem = (id: string) => setInventory((s) => { const n = new Set(s); n.add(id); return n; });

  return (
    <Ctx.Provider value={{ user, session, profile, avatar, inventory, loading, signUp, signIn, signOut, refreshProfile, setAvatarLocal, addBux, setBuxLocal, addOwnedItem }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
