import { notFound, redirect } from "next/navigation";
import { Calendar } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EditProfile } from "@/components/profile/EditProfile";
import { StartChatButton } from "@/components/profile/StartChatButton";
import { getCurrentUser } from "@/lib/data";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(id, user.id);
  if (!profile) notFound();

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar src={profile.avatar_url} size="lg">
                {initialsOf(profile.username)}
              </Avatar>
              <h1 className="mt-3 text-2xl font-bold">{profile.username}</h1>
              {profile.bio && (
                <p className="mt-1 text-muted-foreground">{profile.bio}</p>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Joined {joined}
              </p>
            </div>
          </CardContent>
        </Card>

        {profile.isSelf ? (
          <div className="mt-6">
            <EditProfile
              username={profile.username ?? ""}
              bio={profile.bio ?? ""}
              avatarUrl={profile.avatar_url}
            />
          </div>
        ) : (
          <div className="mt-6 flex justify-center">
            <StartChatButton
              currentUserId={user.id}
              otherUserId={profile.id}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
