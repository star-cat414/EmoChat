"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";

import { signupSendOtp, signupVerifyOtp } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { EmotionBackground } from "@/components/emotion/EmotionBackground";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reqError, setReqError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async (fd: FormData) => {
    setSending(true);
    setReqError(null);
    const state = await signupSendOtp({ error: null }, fd);
    setSending(false);
    if (state.error) {
      setReqError(state.error);
      return;
    }
    setEmail(String(fd.get("email") || ""));
    setUsername(String(fd.get("username") || ""));
    setPassword(String(fd.get("password") || ""));
    setStep("code");
  };

  const verify = async (fd: FormData) => {
    setVerifying(true);
    setVerifyError(null);
    const state = await signupVerifyOtp({ error: null }, fd);
    if (state.error) {
      setVerifying(false);
      setVerifyError(state.error);
      return;
    }
    // On success signupVerifyOtp redirect()s; this line is not reached.
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <EmotionBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="brand-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white">
            <MessageCircle className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Create your EmoChat account</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Verify your email with a code, then sign in with a
            password.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold text-foreground">
              {step === "form" ? "Sign up" : "Enter your code"}
            </h2>
          </div>
          <div>
            {step === "form" ? (
              <form action={sendCode} className="space-y-4">
                {reqError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {reqError}
                  </p>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" required autoComplete="email" className="border-border bg-muted" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <Input id="username" name="username" required autoComplete="username" className="border-border bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    3-24 chars, letters/numbers/underscore. How others find you.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className="border-border bg-muted"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {sending ? "Sending code…" : "Send me a code"}
                </button>
              </form>
            ) : (
              <form action={verify} className="space-y-4">
                {verifyError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {verifyError}
                  </p>
                )}
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Code sent to <span className="font-medium">{email}</span>. Enter the 6-digit code
                  below to finish signing up.
                </p>
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="username" value={username} />
                <input type="hidden" name="password" value={password} />
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium text-foreground">
                    Verification code
                  </label>
                  <Input
                    id="token"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    required
                    className="border-border bg-muted text-center text-lg tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Verify & create account"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Change email
                </button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
