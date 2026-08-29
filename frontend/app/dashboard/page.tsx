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
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              <span className="text-glow">Your chats</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Realtime conversations with HMM emotion decoding
            </p>
          </div>
        </div>
        <ChatList
          currentUserId={user.id}
          conversations={conversations}
        />
      </div>
    </AppShell>
  );
}
