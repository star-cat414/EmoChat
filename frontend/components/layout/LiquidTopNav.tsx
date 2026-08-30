"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  FlaskConical,
  MessageCircle,
  LogOut,
  Settings,
  Activity,
  Fingerprint,
} from "lucide-react";

import { logout } from "@/app/auth/actions";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { EMOTION_META, type EmotionLabel } from "@/lib/emotions";
import { cn } from "@/lib/utils";

export interface LiquidTopNavUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export interface LiveHmmState {
  emotion: EmotionLabel;
  confidence: number;
}

export function LiquidTopNav({
  user,
  liveState,
  onToggleDebug,
  debugOpen,
}: {
  user: LiquidTopNavUser;
  liveState: LiveHmmState | null;
  onToggleDebug: () => void;
  debugOpen: boolean;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Chats", icon: MessageCircle },
    { href: "/analytics", label: "Mood", icon: BarChart3 },
    { href: "/dev/model-eval", label: "Model", icon: FlaskConical },
  ];

  const navActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="brand-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">EmoChat</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Fingerprint className="h-3 w-3" /> HMM · N-Gram
            </span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = navActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
              >
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Live HMM state */}
          <AnimatePresence mode="wait">
            {liveState ? (
              <motion.div
                key={liveState.emotion + liveState.confidence}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 sm:flex"
              >
                <span className="pulse-dot h-2 w-2 rounded-full" style={{ color: EMOTION_META[liveState.emotion].color }}>
                  <span className="block h-2 w-2 rounded-full bg-current" />
                </span>
                <span className="text-xs font-medium" style={{ color: EMOTION_META[liveState.emotion].color }}>
                  {EMOTION_META[liveState.emotion].name}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {(liveState.confidence * 100).toFixed(0)}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">State: idle</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Debug drawer toggle */}
          <button
            onClick={onToggleDebug}
            aria-label="Toggle model metrics drawer"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              debugOpen && "bg-accent text-primary"
            )}
          >
            <Activity className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <Link href={`/profile/${user.id}`} className="ml-1">
            <Avatar src={user.avatar_url} size="sm">
              {initialsOf(user.username)}
            </Avatar>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            aria-label="Settings"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="flex items-center gap-1 border-t border-border bg-card px-2 py-1.5 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              navActive(l.href)
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <l.icon className="h-4 w-4" />
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </header>
  );
}
