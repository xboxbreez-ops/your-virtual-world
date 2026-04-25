import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "signup" ? "signup" : "signin") as "signup" | "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — BloxWorld" },
      { name: "description", content: "Create your free BloxWorld account or log back in to keep building." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and _ only"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Too long"),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && user) void navigate({ to: "/lobby" }); }, [user, loading, navigate]);

  const isSignup = mode === "signup";

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ username, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(parsed.data.username, parsed.data.password);
        toast.success(`Welcome, @${parsed.data.username}! +100 Bux`);
      } else {
        await signIn(parsed.data.username, parsed.data.password);
        toast.success(`Welcome back, @${parsed.data.username}`);
      }
      void navigate({ to: "/lobby" });
    } catch (err) {
      const msg = (err as Error).message || "Something went wrong";
      if (msg.toLowerCase().includes("invalid")) toast.error("Wrong username or password");
      else if (msg.toLowerCase().includes("registered")) toast.error("That username is taken");
      else toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-block">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary font-display text-primary-foreground shadow-block">B</div>
          <span className="font-display text-2xl">BloxWorld</span>
        </Link>

        <h1 className="font-display text-3xl">{isSignup ? "Create account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup ? "Pick a username and password — no email required." : "Log in to your blocky world."}
        </p>

        <form onSubmit={handle} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cool_builder42"
              autoComplete="username"
              maxLength={20}
              className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 font-medium outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              maxLength={72}
              className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 font-medium outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-3 font-display text-lg text-primary-foreground shadow-block transition hover:translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? "..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link
            to="/auth"
            search={{ mode: isSignup ? "signin" : "signup" }}
            className="font-bold text-accent hover:underline"
          >
            {isSignup ? "Log in" : "Create one"}
          </Link>
        </div>
      </div>
    </div>
  );
}
