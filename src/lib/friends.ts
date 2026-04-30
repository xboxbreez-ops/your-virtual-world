import { supabase } from "@/integrations/supabase/client";

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  friend_username: string;
  status: "pending" | "accepted" | "blocked";
};

export type FriendWithPresence = {
  friend_id: string;
  username: string;
  status: "pending_outgoing" | "pending_incoming" | "accepted";
  online: boolean;
  location: string | null;
};

/** Send a friend request by username. Looks up the target's id from profiles. */
export async function sendFriendRequest(
  selfId: string,
  selfUsername: string,
  targetUsername: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = targetUsername.trim().replace(/^@/, "");
  if (!clean) return { ok: false, error: "Enter a username" };
  if (clean.toLowerCase() === selfUsername.toLowerCase()) {
    return { ok: false, error: "You can't friend yourself" };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", clean)
    .maybeSingle();
  if (!target) return { ok: false, error: "User not found" };

  // Insert two rows: my outgoing pending, their incoming pending.
  // RLS only lets each user insert their own row, so we insert ours and rely on
  // the friend's client to upgrade their own row when they accept.
  const { error } = await supabase.from("friendships").insert({
    user_id: selfId,
    friend_id: target.id,
    friend_username: target.username,
    status: "pending",
  });
  if (error && !error.message.includes("duplicate")) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Accept an incoming request. Creates the reciprocal accepted row. */
export async function acceptFriendRequest(
  selfId: string,
  selfUsername: string,
  fromUserId: string,
  fromUsername: string,
): Promise<void> {
  // Mark their outgoing as accepted (RLS: friend_id == auth.uid())
  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_id", fromUserId)
    .eq("friend_id", selfId);
  // Insert our reciprocal accepted row (idempotent)
  await supabase.from("friendships").upsert(
    {
      user_id: selfId,
      friend_id: fromUserId,
      friend_username: fromUsername,
      status: "accepted",
    },
    { onConflict: "user_id,friend_id" },
  );
}

export async function removeFriendship(selfId: string, friendId: string): Promise<void> {
  await supabase
    .from("friendships")
    .delete()
    .or(`and(user_id.eq.${selfId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${selfId})`);
}

/** Combine raw friendship rows + presence rows into a unified friends list. */
export function buildFriendsList(
  selfId: string,
  rows: Friendship[],
  presence: { user_id: string; location: string }[],
): FriendWithPresence[] {
  const presMap = new Map(presence.map((p) => [p.user_id, p.location]));
  const seen = new Set<string>();
  const out: FriendWithPresence[] = [];
  for (const r of rows) {
    const otherId = r.user_id === selfId ? r.friend_id : r.user_id;
    if (seen.has(otherId)) continue;
    seen.add(otherId);
    let status: FriendWithPresence["status"] = "accepted";
    if (r.status === "pending") {
      status = r.user_id === selfId ? "pending_outgoing" : "pending_incoming";
    }
    out.push({
      friend_id: otherId,
      username: r.friend_username,
      status,
      online: presMap.has(otherId),
      location: presMap.get(otherId) ?? null,
    });
  }
  return out;
}

export const LOCATION_TO_ROUTE: Record<string, string> = {
  lobby: "/lobby",
  "natural-disaster": "/play/natural-disaster",
  rivals: "/play/rivals",
  "steal-brainrot": "/play/steal-brainrot",
  "grow-garden": "/play/grow-garden",
  "obby-tower": "/play/obby-tower",
  "obby-speed": "/play/obby-speed",
  "obby-lava": "/play/obby-lava",
  "obby-ice": "/play/obby-ice",
};
