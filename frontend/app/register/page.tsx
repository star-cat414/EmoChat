"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";

import { otpRequest, otpVerify } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [reqError, setReqError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async (fd: FormData) => {
    setSending(true);
    setReqError(null);
    const state = await otpRequest({ error: null }, fd);
    setSending(false);
    if (state.error) {
      setReqError(state.error);
      return;
    }
    setEmail(String(fd.get("email") || ""));
    setUsername(String(fd.get("username") || ""));
    setStep("code");
  };

  const verify = async (fd: FormData) => {
    setVerifying(true);
    setVerifyError(null);
    const state = await otpVerify({ error: null }, fd);
    if (state.error) {
      setVerifying(false);
      setVerifyError(state.error);
      return;
    }
    // On success otpVerify redirect()s; this line is not reached.
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Create your EmoChat account</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> No password needed — just a code to your inbox.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === "form" ? "Sign up" : "Enter your code"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <form action={sendCode} className="space-y-4">
                {reqError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {reqError}
                  </p>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input id="username" name="username" required autoComplete="username" />
                  <p className="text-xs text-muted-foreground">
                    3-24 chars, letters/numbers/underscore. How others find you.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending code..." : "Send me a code"}
                </Button>
              </form>
            ) : (
              <form action={verify} className="space-y-4">
                {verifyError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {verifyError}
                  </p>
                )}
                <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                  Code sent to <span className="font-medium">{email}</span>. Enter the 6-digit code
                  below.
                </p>
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="username" value={username} />
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium">
                    Verification code
                  </label>
                  <Input
                    id="token"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify & continue"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
                  Change email
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
