import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; username: string; bux: number };
export type AvatarConfig = {
  rig: "R6" | "R15";
  skin_color: string;
  shirt_color: string;
  pants_color: string;
  face: string;
  hat: string;
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
  const [loading, setLoading] = useState(true);

  const loadAll = async (uid: string) => {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("id, username, bux").eq("id", uid).maybeSingle(),
      supabase.from("avatars").select("*").eq("user_id", uid).maybeSingle(),
    ]);
    if (p) setProfile(p as Profile);
    if (a) setAvatar({
      rig: a.rig as "R6" | "R15",
      skin_color: a.skin_color,
      shirt_color: a.shirt_color,
      pants_color: a.pants_color,
      face: a.face,
      hat: a.hat,
    });
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

  return (
    <Ctx.Provider value={{ user, session, profile, avatar, loading, signUp, signIn, signOut, refreshProfile, setAvatarLocal, addBux }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
