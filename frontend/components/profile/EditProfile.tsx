"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { updateProfile, uploadAvatar } from "@/app/profile/actions";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EditProfile({
  username,
  bio,
  avatarUrl,
}: {
  username: string;
  bio: string;
  avatarUrl?: string | null;
}) {
  const [formUsername, setFormUsername] = useState(username);
  const [formBio, setFormBio] = useState(bio);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(avatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("username", formUsername);
    fd.set("bio", formBio);
    const res = await updateProfile(fd);
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      window.location.reload();
    }
  };

  const onAvatar = async (file: File) => {
    setError(null);
    const res = await uploadAvatar(file);
    if (res.error) {
      setError(res.error);
    } else if (res.url) {
      setAvatar(res.url);
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <Avatar src={avatar} size="lg">
              {initialsOf(username)}
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Change avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatar(f);
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a profile picture.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              placeholder="Tell people about yourself"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
