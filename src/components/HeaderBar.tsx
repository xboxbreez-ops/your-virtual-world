import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Coins, LogOut, Shirt, Gamepad2 } from "lucide-react";

export function HeaderBar({ location }: { location?: string }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/lobby" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary font-display text-primary-foreground shadow-block">B</div>
          <span className="font-display text-xl tracking-wide">BloxWorld</span>
          {location && <span className="ml-2 hidden rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground sm:inline">/ {location}</span>}
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/lobby" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold hover:bg-secondary sm:flex">
            <Gamepad2 className="h-4 w-4" /> Games
          </Link>
          <Link to="/avatar" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold hover:bg-secondary sm:flex">
            <Shirt className="h-4 w-4" /> Avatar
          </Link>
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-bold">
            <Coins className="h-4 w-4 text-bux" />
            <span className="text-bux">{profile?.bux ?? 0}</span>
            <span className="text-muted-foreground">Bux</span>
          </div>
          <div className="hidden rounded-md bg-secondary px-3 py-2 text-sm font-semibold sm:block">@{profile?.username}</div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-secondary"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}
