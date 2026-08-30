"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";

import { login, type AuthState } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { EmotionBackground } from "@/components/emotion/EmotionBackground";

const emptyState: AuthState = { error: null };

function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, emptyState);
  const searchParams = useSearchParams();
  const accountDeleted = searchParams.get("account") === "deleted";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <EmotionBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="brand-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white">
            <MessageCircle className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Welcome back to EmoChat</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Chat normally, understand emotions.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {accountDeleted && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Your account was deleted. You can sign up again anytime.
            </p>
          )}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold text-foreground">Sign in with password</h2>
          </div>
          <div>
            <form action={action} className="space-y-4">
              {state?.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input id="email" name="email" type="email" required autoComplete="email" className="border-border bg-muted" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="border-border bg-muted"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              New to EmoChat?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
