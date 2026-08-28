import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ConversationAnalytics } from "@/components/analytics/ConversationAnalytics";
import { getChatContext } from "@/lib/chatContext";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationAnalyticsPage({ params }: PageProps) {
  const { conversationId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { other, isMember } = await getChatContext(conversationId, user.id);
  if (!isMember || !other) notFound();

  return (
    <AppShell user={user}>
      <ConversationAnalytics
        currentUserId={user.id}
        conversationId={conversationId}
        other={{
          id: other.id,
          username: other.username ?? "",
          avatar_url: other.avatar_url,
        }}
      />
    </AppShell>
  );
}
