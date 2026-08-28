"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserSearchModal } from "@/components/chat/UserSearchModal";
import { emotionToMeta } from "@/lib/emotions";
import { messagePreview, relativeTime } from "@/lib/utils";

export interface ChatListConversation {
  id: string;
  other: { id: string; username: string | null; avatar_url: string | null };
  last_message: {
    id: string;
    message_type: string;
    content: string | null;
    transcript: string | null;
    sender_id: string;
    created_at: string;
  } | null;
  last_emotion: { emotion: string; confidence: number } | null;
  unread: number;
}

export function ChatList({
  currentUserId,
  conversations,
}: {
  currentUserId: string;
  conversations: ChatListConversation[];
}) {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = conversations.filter((c) =>
    (c.other.username ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowSearch(true)}>
          <Plus className="h-4 w-4" /> New Chat
        </Button>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new chat.
          </div>
        )}
        {filtered.map((c) => {
          const emotion = c.last_emotion
            ? emotionToMeta(c.last_emotion.emotion)
            : null;
          const preview = c.last_message
            ? messagePreview(c.last_message)
            : "No messages yet";
          return (
            <Link
              key={c.id}
              href={`/chats/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <Avatar src={c.other.avatar_url}>
                {initialsOf(c.other.username)}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{c.other.username}</span>
                  {c.last_message && (
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {relativeTime(c.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {emotion && c.last_emotion && (
                    <span className="flex shrink-0 items-center gap-1 text-xs">
                      <span>{emotion.emoji}</span>
                      <span className={emotion.softText}>{emotion.name}</span>
                    </span>
                  )}
                  <span className="truncate text-sm text-muted-foreground">
                    {preview}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showSearch && (
        <UserSearchModal
          currentUserId={currentUserId}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
