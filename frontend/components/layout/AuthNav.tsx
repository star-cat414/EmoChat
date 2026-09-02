import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AuthNav({ mode }: { mode: "login" | "register" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="brand-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">EmoChat</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              HMM · N-Gram
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/about">
            <Button variant="ghost">About</Button>
          </Link>
          {mode === "login" ? (
            <Link href="/register">
              <Button>Start Chatting</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}