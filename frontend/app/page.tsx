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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmotionBackground } from "@/components/emotion/EmotionBackground";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <EmotionBackground />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="brand-glow flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <MessageCircle className="h-4 w-4" />
          </span>
          EmoChat
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Start Chatting</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-1 flex-col items-center px-6 pt-16 pb-20 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm">
          <MessageCircle className="h-3.5 w-3.5" />
          Realtime messaging · N-Gram + HMM emotion intelligence
        </span>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Chat normally.
          <br />
          Understand emotions{" "}
          <span className="text-gradient-brand">intelligently.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          EmoChat combines real-time messaging with N-Gram and Hidden Markov Model
          based emotion analysis — for text and voice, in Myanmar and English.
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
      </section>

      <section className="mx-auto mb-20 grid w-full max-w-6xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard tone="bg-indigo-100 text-indigo-600" icon={<MessageCircle className="h-5 w-5" />} title="1-to-1 Messaging" description="Private, real-time conversations that feel fast and familiar." />
        <FeatureCard tone="bg-violet-100 text-violet-600" icon={<Brain className="h-5 w-5" />} title="N-Gram + HMM" description="Emotion intelligence powered by classical language models, not black boxes." />
        <FeatureCard tone="bg-sky-100 text-sky-600" icon={<Languages className="h-5 w-5" />} title="Myanmar Language" description="First-class Myanmar Unicode support alongside English and mixed text." />
        <FeatureCard tone="bg-rose-100 text-rose-600" icon={<Mic className="h-5 w-5" />} title="Voice Messages" description="Record, transcribe, and analyze voice messages with emotion insights." />
        <FeatureCard tone="bg-emerald-100 text-emerald-600" icon={<Phone className="h-5 w-5" />} title="Voice Calls" description="Simple audio calls with live emotion analysis on your conversation." />
        <FeatureCard tone="bg-fuchsia-100 text-fuchsia-600" icon={<BarChart3 className="h-5 w-5" />} title="Emotion Analytics" description="Per-conversation and per-person emotion trends and distributions." />
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        AMT Co., Ltd. &copy; {new Date().getFullYear()} All rights reserved. 
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