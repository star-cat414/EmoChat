import Link from "next/link";
import {
  MessageCircle,
  Brain,
  Languages,
  Mic,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
  Lock,
  AudioWaveform,
  Boxes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmotionBackground } from "@/components/emotion/EmotionBackground";
import { EMOTIONS, EMOTION_META } from "@/lib/emotions";
import { cn } from "@/lib/utils";

const EMOTION_BLURB: Record<(typeof EMOTIONS)[number], string> = {
  happy: "Content, joyful, or enthusiastic",
  sad: "Down, disappointed, or grieving",
  angry: "Frustrated, annoyed, or furious",
  fear: "Anxious, worried, or afraid",
  surprise: "Unexpected, amazed, or startled",
  neutral: "Even, composed, or matter-of-fact",
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <EmotionBackground />

      {/* Nav */}
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
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>
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
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-16 pb-12 text-center sm:pt-20">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          About the project
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          What is EmoChat?
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          EmoChat is an intelligent messaging platform that reads the emotion
          behind every message — in real time, for both{" "}
          <span className="font-medium text-foreground">text</span> and{" "}
          <span className="font-medium text-foreground">voice</span>, in{" "}
          <span className="font-medium text-foreground">Myanmar</span> and{" "}
          <span className="font-medium text-foreground">English</span>.
        </p>
      </section>

      {/* What it does */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Real-time messaging"
            tone="bg-indigo-100 text-indigo-600"
            body="Private one-to-one conversations that feel instant. Messages stream in as they are sent, powered by live database subscriptions."
          />
          <InfoCard
            icon={<Brain className="h-5 w-5" />}
            title="Explainable emotion AI"
            tone="bg-violet-100 text-violet-600"
            body="Instead of a black-box neural network, EmoChat uses classical N-Gram language models and a Hidden Markov Model — so every prediction is explainable, fast, and runs on your own hardware."
          />
          <InfoCard
            icon={<Mic className="h-5 w-5" />}
            title="Voice with emotion"
            tone="bg-rose-100 text-rose-600"
            body="Record a voice message and EmoChat transcribes it and decodes its emotion. Speech recognition runs locally on-device, so it keeps working even without cloud credits."
          />
          <InfoCard
            icon={<Languages className="h-5 w-5" />}
            title="Myanmar & English"
            tone="bg-sky-100 text-sky-600"
            body="First-class support for Myanmar (Burmese) Unicode alongside English, including mixed-language and code-switched text."
          />
          <InfoCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Emotion analytics"
            tone="bg-fuchsia-100 text-fuchsia-600"
            body="Per-conversation and per-person dashboards that show emotion trends over time — how moods shift through a conversation."
          />
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Private by default"
            tone="bg-emerald-100 text-emerald-600"
            body="Emotion analysis and speech transcription can run entirely offline and locally, keeping your messages and voice private."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">How it works</h2>
        <p className="mb-6 text-muted-foreground">
          Three layers work together to decode emotion from message to mood.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            step="1"
            title="Language detection & tokenization"
            body={`Every message is routed by language. Myanmar text is tokenized with a dedicated tokenizer and analyzed against a Myanmar-specific model, while English uses its own model — so mixed chats behave correctly.`}
            tone="bg-sky-100 text-sky-600"
          />
          <StepCard
            step="2"
            title="N-Gram emotion model"
            body={`Character and word n-grams are scored against six emotion classes: ${EMOTIONS.map((e) => EMOTION_META[e].name).join(", ")}. The most likely class for a single message is chosen directly from these scores.`}
            tone="bg-violet-100 text-violet-600"
          />
          <StepCard
            step="3"
            title="Hidden Markov Model"
            body={`Conversations are sequences, not singles. A Hidden Markov Model decodes the whole history of emotions in a chat — so context and transitions between moods refine each prediction over time.`}
            tone="bg-fuchsia-100 text-fuchsia-600"
          />
        </div>
      </section>

      {/* The emotions */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          The emotions we decode
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMOTIONS.map((e) => (
            <div
              key={e}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: `var(--emotion-${e}-bg)`, color: `var(--emotion-${e})` }}
              >
                {EMOTION_META[e].emoji}
              </span>
              <div>
                <p className="font-semibold">{EMOTION_META[e].name}</p>
                <p className="text-xs text-muted-foreground">{EMOTION_BLURB[e]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voice pipeline */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Voice pipeline</h2>
        <p className="mb-6 max-w-3xl text-muted-foreground">
          Sending a voice message triggers a speech-to-text decode followed by
          the same emotion stack. Everything shown is explainable.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PipeCard icon={<AudioWaveform className="h-5 w-5" />} title="1. Record" body="Capture audio in the browser with the built-in recorder." tone="bg-indigo-100 text-indigo-600" />
          <PipeCard icon={<Mic className="h-5 w-5" />} title="2. Transcribe" body="Whisper speech recognition turns speech into text — locally when cloud is unavailable." tone="bg-rose-100 text-rose-600" />
          <PipeCard icon={<Brain className="h-5 w-5" />} title="3. Decode" body="N-Gram and HMM predict the emotion from the transcript." tone="bg-violet-100 text-violet-600" />
          <PipeCard icon={<BarChart3 className="h-5 w-5" />} title="4. Analyze" body="The emotion feeds your conversation and analytics dashboards." tone="bg-fuchsia-100 text-fuchsia-600" />
        </div>
      </section>

      {/* Tech stack */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Built with</h2>
        <p className="mb-6 max-w-3xl text-muted-foreground">
          A lightweight, self-contained stack — no heavy cloud dependencies required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TechCard icon={<Boxes className="h-5 w-5" />} title="Next.js" body="React framework for the app, API routes, and SSR." />
          <TechCard icon={<Boxes className="h-5 w-5" />} title="FastAPI" body="Python backend serving the emotion and transcription APIs." />
          <TechCard icon={<Lock className="h-5 w-5" />} title="Supabase" body="Postgres, auth, storage, and realtime subscriptions." />
          <TechCard icon={<AudioWaveform className="h-5 w-5" />} title="Faster-Whisper" body="Local CPU speech-to-text fallback that never needs credits." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See your emotions come to life.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up free and start chatting — every message gets decoded.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4 text-emotion-sad" />
          EmoChat
        </span>
        <span className="mx-2">·</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emotion-sad" />
          AMT Co., Ltd. &copy; {new Date().getFullYear()} All rights reserved.
        </span>
      </footer>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Card className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", tone)}>
        {icon}
      </div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}

function StepCard({
  step,
  title,
  body,
  tone,
}: {
  step: string;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Card className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold", tone)}>
        {step}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}

function PipeCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", tone)}>
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}

function TechCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}
