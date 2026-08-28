"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { openOrCreateConversation } from "@/app/chats/actions";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function StartChatButton({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string;
  otherUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const { conversationId } = await openOrCreateConversation(
        currentUserId,
        otherUserId
      );
      router.push(`/chats/${conversationId}`);
    } catch {
      setBusy(false);
    }
  };

  return (
    <Button onClick={start} disabled={busy}>
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      {busy ? "Opening..." : "Start chat"}
    </Button>
  );
}
