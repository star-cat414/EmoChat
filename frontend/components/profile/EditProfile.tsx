"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { deleteAccount, updateProfile, uploadAvatar } from "@/app/profile/actions";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BIO_MAX = 500;

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

  // Delete-account confirmation state.
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(formUsername)) {
      setError("Username must be 3-24 chars (letters, numbers, underscore)");
      return;
    }
    if (formBio.length > BIO_MAX) {
      setError(`Bio must be ${BIO_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
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

  const onDelete = async () => {
    setError(null);
    setDeleting(true);
    const res = await deleteAccount();
    if (res.error) {
      setError(res.error);
      setDeleting(false);
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
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90"
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
            <div className="flex items-center justify-between">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio <span className="text-muted-foreground">— tell about yourself</span>
              </label>
              <span
                className={cn(
                  "text-xs",
                  formBio.length > BIO_MAX
                    ? "font-semibold text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {formBio.length}/{BIO_MAX}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formBio}
              onChange={(e) => setFormBio(e.target.value.slice(0, BIO_MAX))}
              maxLength={BIO_MAX}
              rows={3}
              placeholder="Tell people about yourself"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Trash2 className="h-4 w-4" /> Danger zone
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting your account permanently removes your profile, avatar and all
            conversations. This cannot be undone.
          </p>

          {!confirmDelete ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </Button>
          ) : (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-foreground">
                To confirm, type <span className="font-semibold">DELETE</span> below.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
                  onClick={onDelete}
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleting ? "Deleting..." : "Permanently delete my account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmDelete(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
