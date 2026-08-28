import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ChatView } from "@/components/messages/ChatView";
import { getChatContext } from "@/lib/chatContext";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { other, isMember } = await getChatContext(conversationId, user.id);
  if (!isMember || !other) notFound();

  return (
    <AppShell user={user}>
      <ChatView
        conversationId={conversationId}
        currentUserId={user.id}
        other={{
          id: other.id,
          username: other.username ?? "",
          avatar_url: other.avatar_url,
        }}
      />
    </AppShell>
  );
}
