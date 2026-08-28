"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  MessageCircle,
  Settings,
  User,
  BarChart3,
  FlaskConical,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export interface AppShellUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const links = [
    { href: "/dashboard", label: "Chats", icon: MessageCircle },
    { href: "/analytics", label: "Dashboard", icon: BarChart3 },
    { href: `/profile/${user.id}`, label: "Profile", icon: User },
    { href: "/dev/model-eval", label: "Model Eval", icon: FlaskConical },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">EmoChat</span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active =
                l.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle resolvedTheme={resolvedTheme} setTheme={setTheme} />
            <Link href={`/profile/${user.id}`}>
              <Avatar src={user.avatar_url} size="sm">
                {initialsOf(user.username)}
              </Avatar>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function ThemeToggle({
  resolvedTheme,
  setTheme,
}: {
  resolvedTheme: "light" | "dark";
  setTheme: (t: "light" | "dark" | "system") => void;
}) {
  const next: "light" | "dark" | "system" =
    resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(next)}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
