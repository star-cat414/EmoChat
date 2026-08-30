import Link from "next/link";
import type { ReactNode } from "react";
import {
  MessageCircle,
  Brain,
  Languages,
  Mic,
  Phone,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmotionBackground } from "@/components/emotion/EmotionBackground";
import { EMOTIONS, EMOTION_META } from "@/lib/emotions";
import { cn } from "@/lib/utils";

const DEMO_DECODE: Record<(typeof EMOTIONS)[number], number> = {
  happy: 0.82,
  surprise: 0.09,
  neutral: 0.04,
  sad: 0.03,
  angry: 0.01,
  fear: 0.01,
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <EmotionBackground />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="brand-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">EmoChat</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                HMM · N-Gram
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Start Chatting</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-14 pb-16 text-center sm:pt-20">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {EMOTIONS.map((e) => (
            <span
              key={e}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm",
                e === "happy" && "ring-2 ring-emotion-happy/30"
              )}
            >
              <span>{EMOTION_META[e].emoji}</span>
              <span
                className="tabular-nums"
                style={{ color: `var(--emotion-${e})` }}
              >
                {EMOTION_META[e].name}
              </span>
            </span>
          ))}
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Chat normally.
          <br />
          Understand emotions{" "}
          <span className="text-primary">intelligently.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          EmoChat combines real-time messaging with N-Gram and Hidden Markov
          Model based emotion analysis — for text and voice, in Myanmar and
          English.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Start Chatting <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/80">
              Login
            </Button>
          </Link>
        </div>

        {/* Live decode demo */}
        <div className="mt-14 grid w-full max-w-4xl gap-4 text-left lg:grid-cols-2">
          <div className="flex flex-col justify-end gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-accent px-4 py-2.5 text-[15px] leading-relaxed">
                Congrats on the promotion! 🎉
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
                Thank you! I&apos;m so happy right now 😄
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-accent px-4 py-2.5 text-[15px] leading-relaxed">
                We&apos;re celebrating tonight!
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Zap className="h-3 w-3 text-emotion-happy" />
              Realtime HMM emotion decode
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Live emotion decode</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emotion-happy-bg px-2.5 py-1 text-xs font-semibold text-emotion-happy">
                {EMOTION_META.happy.emoji} Happy 82%
              </span>
            </div>
            <div className="space-y-2.5">
              {EMOTIONS.map((e) => {
                const p = DEMO_DECODE[e];
                return (
                  <div key={e} className="flex items-center gap-2.5">
                    <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">
                      {EMOTION_META[e].name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          background: `var(--emotion-${e})`,
                          width: `${Math.max(p * 100, 3)}%`,
                        }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {(p * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              N-Gram + HMM · Myanmar & English
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard tone="bg-indigo-100 text-indigo-600" icon={<MessageCircle className="h-5 w-5" />} title="1-to-1 Messaging" description="Private, real-time conversations that feel fast and familiar." />
        <FeatureCard tone="bg-violet-100 text-violet-600" icon={<Brain className="h-5 w-5" />} title="N-Gram + HMM" description="Emotion intelligence powered by classical language models, not black boxes." />
        <FeatureCard tone="bg-sky-100 text-sky-600" icon={<Languages className="h-5 w-5" />} title="Myanmar Language" description="First-class Myanmar Unicode support alongside English and mixed text." />
        <FeatureCard tone="bg-rose-100 text-rose-600" icon={<Mic className="h-5 w-5" />} title="Voice Messages" description="Record, transcribe, and analyze voice messages with emotion insights." />
        <FeatureCard tone="bg-emerald-100 text-emerald-600" icon={<Phone className="h-5 w-5" />} title="Voice Calls" description="Simple audio calls with live emotion analysis on your conversation." />
        <FeatureCard tone="bg-fuchsia-100 text-fuchsia-600" icon={<BarChart3 className="h-5 w-5" />} title="Emotion Analytics" description="Per-conversation and per-person emotion trends and distributions." />
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Every message has an emotion. Start understanding them today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Free accounts, no black boxes. Just clean, explainable emotion
            analysis on every conversation.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emotion-sad" />
          AMT Co., Ltd. &copy; {new Date().getFullYear()} All rights reserved.
        </span>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone: string;
}) {
  return (
    <Card className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        {icon}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}