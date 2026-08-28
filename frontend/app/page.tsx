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

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Chat normally.
          <br />
          <span className="bg-gradient-to-r from-primary to-emotion-happy bg-clip-text text-transparent">
            Understand emotions
          </span>{" "}
          intelligently.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          An intelligent messaging platform that analyzes text and voice
          conversations using N-Gram language models and Hidden Markov Models.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Start Chatting <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Login
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto mb-20 grid w-full max-w-6xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon={<MessageCircle className="h-5 w-5" />} title="1-to-1 Messaging" description="Private, real-time conversations that feel fast and familiar." />
        <FeatureCard icon={<Brain className="h-5 w-5" />} title="N-Gram + HMM" description="Emotion intelligence powered by classical language models, not black boxes." />
        <FeatureCard icon={<Languages className="h-5 w-5" />} title="Myanmar Language" description="First-class Myanmar Unicode support alongside English and mixed text." />
        <FeatureCard icon={<Mic className="h-5 w-5" />} title="Voice Messages" description="Record, transcribe, and analyze voice messages with emotion insights." />
        <FeatureCard icon={<Phone className="h-5 w-5" />} title="Voice Calls" description="Simple audio calls with live emotion analysis on your conversation." />
        <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Emotion Analytics" description="Per-conversation and per-person emotion trends and distributions." />
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        EmoChat — Final Year NLP / IT Project
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
