import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ChatList } from "@/components/chat/ChatList";
import { getCurrentUser } from "@/lib/data";
import { listConversations } from "@/lib/conversations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversations = await listConversations(user.id);

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chats</h1>
        </div>
        <ChatList
          currentUserId={user.id}
          conversations={conversations}
        />
      </div>
    </AppShell>
  );
}
