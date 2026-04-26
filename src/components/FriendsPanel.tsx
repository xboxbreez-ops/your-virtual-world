import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  type Friendship,
  type FriendWithPresence,
  buildFriendsList,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  LOCATION_TO_ROUTE,
} from "@/lib/friends";
import { UserPlus, Check, X, Play, Circle } from "lucide-react";

export function FriendsPanel({ compact = false }: { compact?: boolean }) {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Friendship[]>([]);
  const [presence, setPresence] = useState<{ user_id: string; location: string }[]>([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  // Load friendships + subscribe
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, friend_username, status")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      if (mounted && data) setRows(data as Friendship[]);
    };
    void load();
    const ch = supabase
      .channel(`friend-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => void load())
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(ch); };
  }, [user]);

  // Load presence
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const cutoff = new Date(Date.now() - 60_000).toISOString();
      const { data } = await supabase
        .from("presence")
        .select("user_id, location")
        .gte("last_seen", cutoff);
      if (mounted && data) setPresence(data);
    };
    void load();
    const t = setInterval(load, 8000);
    const ch = supabase
      .channel(`presence-friends`)
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, () => void load())
      .subscribe();
    return () => { mounted = false; clearInterval(t); void supabase.removeChannel(ch); };
  }, []);

  const friends = user ? buildFriendsList(user.id, rows, presence) : [];
  const incoming = friends.filter((f) => f.status === "pending_incoming");
  const outgoing = friends.filter((f) => f.status === "pending_outgoing");
  const accepted = friends.filter((f) => f.status === "accepted");

  const onSend = async () => {
    if (!user || !profile || !search.trim()) return;
    setSending(true);
    const res = await sendFriendRequest(user.id, profile.username, search);
    setSending(false);
    if (res.ok) {
      toast.success("Friend request sent");
      setSearch("");
    } else {
      toast.error(res.error);
    }
  };

  const onAccept = async (f: FriendWithPresence) => {
    if (!user || !profile) return;
    await acceptFriendRequest(user.id, profile.username, f.friend_id, f.username);
    toast.success(`You and @${f.username} are now friends`);
  };

  const onRemove = async (f: FriendWithPresence) => {
    if (!user) return;
    await removeFriendship(user.id, f.friend_id);
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Add friend */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" /> Find friends
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void onSend(); }}
            placeholder="Username"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={onSend}
            disabled={sending || !search.trim()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {incoming.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Requests ({incoming.length})
          </div>
          <ul className="space-y-1.5">
            {incoming.map((f) => (
              <li key={f.friend_id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                <span className="font-semibold">@{f.username}</span>
                <span className="flex gap-1">
                  <button onClick={() => onAccept(f)} className="grid h-7 w-7 place-items-center rounded-md bg-success text-white" aria-label="Accept">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onRemove(f)} className="grid h-7 w-7 place-items-center rounded-md bg-destructive text-destructive-foreground" aria-label="Decline">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Friends ({accepted.length})
          </span>
          <span className="text-xs text-muted-foreground">
            {accepted.filter((f) => f.online).length} online
          </span>
        </div>
        {accepted.length === 0 && (
          <p className="text-xs text-muted-foreground">No friends yet. Search a username above to add one.</p>
        )}
        <ul className="space-y-1.5">
          {accepted.map((f) => {
            const route = f.location ? LOCATION_TO_ROUTE[f.location] : null;
            return (
              <li key={f.friend_id} className="flex items-center justify-between rounded-md bg-secondary/70 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <Circle className={`h-2 w-2 shrink-0 ${f.online ? "fill-success text-success" : "fill-muted-foreground/40 text-muted-foreground/40"}`} />
                  <span className="truncate">
                    <span className="font-semibold">@{f.username}</span>
                    {f.online && f.location && (
                      <span className="ml-2 text-xs text-muted-foreground">in {f.location}</span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {f.online && route && (
                    <Link to={route} className="inline-flex items-center gap-1 rounded-md bg-success px-2 py-1 text-xs font-bold text-white">
                      <Play className="h-3 w-3 fill-white" /> Join
                    </Link>
                  )}
                  <button onClick={() => onRemove(f)} className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label="Remove">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {outgoing.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sent ({outgoing.length})
          </div>
          <ul className="space-y-1">
            {outgoing.map((f) => (
              <li key={f.friend_id} className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-muted-foreground">
                <span>@{f.username} · pending</span>
                <button onClick={() => onRemove(f)} className="text-xs hover:text-destructive">Cancel</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
