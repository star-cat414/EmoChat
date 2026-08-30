"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";

import { Avatar, initialsOf } from "@/components/ui/avatar";
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
    <div className="space-y-4">
      {/* Search + New chat */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-11 w-full rounded-xl border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Chat
        </button>
      </div>

      {/* Room rail */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new chat.
          </div>
        )}
        {filtered.map((c, i) => {
          const emotion = c.last_emotion ? emotionToMeta(c.last_emotion.emotion) : null;
          const preview = c.last_message ? messagePreview(c.last_message) : "No messages yet";
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                href={`/chats/${c.id}`}
                className="group flex items-center gap-3 border-b border-border px-3 py-3 transition-colors last:border-0 hover:bg-muted"
              >
                <Avatar src={c.other.avatar_url} size="md">
                  {initialsOf(c.other.username)}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {c.other.username}
                    </span>
                    {c.last_message && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {relativeTime(c.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {emotion && c.last_emotion && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium" style={{ color: emotion.color }}>
                        {emotion.emoji} {emotion.name}
                      </span>
                    )}
                    <span className="truncate text-sm text-muted-foreground">{preview}</span>
                  </div>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white shadow-sm">
                    {c.unread}
                  </span>
                )}
              </Link>
            </motion.div>
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
