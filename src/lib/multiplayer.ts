import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AvatarConfig } from "@/lib/auth-context";

/**
 * Real-time multiplayer using Supabase Realtime broadcast channels.
 *
 * Each game route opens a channel "room:<game>" and:
 *  - broadcasts its own player state (pos/yaw/anim/hp) ~10x/sec
 *  - tracks presence so we know who's in the room
 *  - receives every other player's state and exposes a ref consumed by R3F
 *
 * Avatar configs are loaded lazily from the `avatars` table the first time
 * we see a new userId. Resolved configs are cached for the lifetime of the
 * hook.
 */

export type RemoteState = {
  user_id: string;
  username: string;
  px: number; py: number; pz: number;
  yaw: number;
  anim: "idle" | "walk" | "shoot" | "jump";
  hp: number;
  team?: "ally" | "enemy" | null;
  ts: number;
};

export type RemotePlayer = RemoteState & {
  avatar: AvatarConfig | null;
};

const SEND_HZ = 10;
const STALE_MS = 4000;

export function useRoomPlayers(opts: {
  game: string;
  selfUserId: string | null;
  selfUsername: string | null;
  // Provide a getter so we always read current state per send tick.
  getSelfState: () => Omit<RemoteState, "user_id" | "username" | "ts">;
}) {
  const { game, selfUserId, selfUsername, getSelfState } = opts;
  // ref-mapped players (game loops read this without re-rendering)
  const playersRef = useRef<Map<string, RemotePlayer>>(new Map());
  // version for HUD player counts
  const [version, setVersion] = useState(0);
  const avatarCacheRef = useRef<Map<string, AvatarConfig>>(new Map());

  useEffect(() => {
    if (!selfUserId || !selfUsername) return;
    const channel = supabase.channel(`room:${game}`, {
      config: { broadcast: { ack: false, self: false }, presence: { key: selfUserId } },
    });

    const loadAvatar = async (uid: string) => {
      if (avatarCacheRef.current.has(uid)) return;
      const { data } = await supabase
        .from("avatars")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (!data) return;
      avatarCacheRef.current.set(uid, {
        rig: (data.rig as "R6" | "R15") ?? "R15",
        skin_color: data.skin_color,
        shirt_color: data.shirt_color,
        pants_color: data.pants_color,
        face: data.face,
        hat: data.hat,
        hair: data.hair ?? "none",
        shoes: data.shoes ?? "sneakers",
        jacket: data.jacket ?? "none",
      });
      const p = playersRef.current.get(uid);
      if (p) {
        p.avatar = avatarCacheRef.current.get(uid)!;
        setVersion((v) => v + 1);
      }
    };

    channel
      .on("broadcast", { event: "state" }, ({ payload }) => {
        const s = payload as RemoteState;
        if (s.user_id === selfUserId) return;
        const existing = playersRef.current.get(s.user_id);
        const avatar = avatarCacheRef.current.get(s.user_id) ?? existing?.avatar ?? null;
        playersRef.current.set(s.user_id, { ...s, avatar });
        if (!avatar) void loadAvatar(s.user_id);
        if (!existing) setVersion((v) => v + 1);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        let changed = false;
        for (const p of leftPresences as { user_id?: string }[]) {
          if (p.user_id) {
            playersRef.current.delete(p.user_id);
            changed = true;
          }
        }
        if (changed) setVersion((v) => v + 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: selfUserId, username: selfUsername });
        }
      });

    // Send loop
    const sendInt = window.setInterval(() => {
      const s = getSelfState();
      void channel.send({
        type: "broadcast",
        event: "state",
        payload: {
          ...s,
          user_id: selfUserId,
          username: selfUsername,
          ts: Date.now(),
        } satisfies RemoteState,
      });
    }, 1000 / SEND_HZ);

    // Stale prune
    const pruneInt = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [uid, p] of playersRef.current) {
        if (now - p.ts > STALE_MS) {
          playersRef.current.delete(uid);
          changed = true;
        }
      }
      if (changed) setVersion((v) => v + 1);
    }, 1500);

    return () => {
      window.clearInterval(sendInt);
      window.clearInterval(pruneInt);
      void supabase.removeChannel(channel);
    };
  }, [game, selfUserId, selfUsername, getSelfState]);

  return { playersRef, version };
}

/** Broadcast a one-shot event (shot fired, hit, brainrot purchase, etc.) on the room channel. */
export function useRoomBroadcast(game: string, selfUserId: string | null) {
  const send = useRef<((event: string, payload: unknown) => void) | null>(null);
  const onRef = useRef<Map<string, ((p: unknown, fromId: string) => void)[]>>(new Map());

  useEffect(() => {
    if (!selfUserId) return;
    const channel = supabase.channel(`room:${game}:events`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "event" }, ({ payload }) => {
      const p = payload as { event: string; data: unknown; from: string };
      const handlers = onRef.current.get(p.event);
      if (handlers) for (const h of handlers) h(p.data, p.from);
    });
    channel.subscribe();
    send.current = (event, data) => {
      void channel.send({ type: "broadcast", event: "event", payload: { event, data, from: selfUserId } });
    };
    return () => { send.current = null; void supabase.removeChannel(channel); };
  }, [game, selfUserId]);

  return {
    send: (event: string, data: unknown) => send.current?.(event, data),
    on: (event: string, handler: (p: unknown, fromId: string) => void) => {
      const list = onRef.current.get(event) ?? [];
      list.push(handler);
      onRef.current.set(event, list);
      return () => {
        const cur = onRef.current.get(event) ?? [];
        onRef.current.set(event, cur.filter((h) => h !== handler));
      };
    },
  };
}
