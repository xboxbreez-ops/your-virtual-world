import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Place not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This server doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground shadow-block">Back to lobby</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BloxWorld" },
      { name: "description", content: "A Roblox-style sandbox: customize your R6/R15 avatar, earn Bux, and play 3D multiplayer games like Natural Disaster Survival." },
      { property: "og:title", content: "BloxWorld" },
      { name: "twitter:title", content: "BloxWorld" },
      { property: "og:description", content: "A Roblox-style sandbox: customize your R6/R15 avatar, earn Bux, and play 3D multiplayer games like Natural Disaster Survival." },
      { name: "twitter:description", content: "A Roblox-style sandbox: customize your R6/R15 avatar, earn Bux, and play 3D multiplayer games like Natural Disaster Survival." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9df50997-cbde-4344-913a-7d39ea6817e7" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9df50997-cbde-4344-913a-7d39ea6817e7" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
