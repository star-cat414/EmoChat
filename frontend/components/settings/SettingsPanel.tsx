"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bell, Globe, Lock, Moon, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface SettingsUser {
  username: string | null;
  email: string | null;
}

export function SettingsPanel({ user }: { user: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emotionInsights, setEmotionInsights] = useState(true);
  const [privacy, setPrivacy] = useState(true);

  return (
    <div className="space-y-6">
      <SettingsSection
        icon={<User className="h-4 w-4" />}
        title="Account"
        description={`Signed in as ${user.email ?? "you"}`}
      >
        <p className="text-sm text-muted-foreground">
          Username: <span className="font-medium text-foreground">{user.username}</span>
        </p>
      </SettingsSection>

      <SettingsSection
        icon={<Moon className="h-4 w-4" />}
        title="Appearance"
        description="Choose how EmoChat looks"
      >
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                theme === t
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Bell className="h-4 w-4" />}
        title="Notifications"
        description="Manage what you get notified about"
      >
        <Toggle
          label="Message notifications"
          checked={notifications}
          onChange={setNotifications}
        />
        <Toggle
          label="Emotion insights"
          checked={emotionInsights}
          onChange={setEmotionInsights}
        />
      </SettingsSection>

      <SettingsSection
        icon={<Globe className="h-4 w-4" />}
        title="Language"
        description="Interface language"
      >
        <div className="flex gap-2">
          {["English", "Myanmar"].map((l) => (
            <Button
              key={l}
              variant={l === "English" ? "default" : "outline"}
              size="sm"
            >
              {l}
            </Button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Lock className="h-4 w-4" />}
        title="Privacy"
        description="Control your profile visibility"
      >
        <Toggle
          label="Allow others to find me by username"
          checked={privacy}
          onChange={setPrivacy}
        />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <CardTitle>{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
