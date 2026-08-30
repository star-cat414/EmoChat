"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { openOrCreateConversation, searchUsers } from "@/app/chats/actions";
import { Avatar, initialsOf } from "@/components/ui/avatar";

interface SearchUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function UserSearchModal({
  currentUserId,
  onClose,
}: {
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchUsers(query, currentUserId).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [query, currentUserId]);

  const open = async (otherId: string) => {
    setBusy(otherId);
    try {
      const { conversationId } = await openOrCreateConversation(
        currentUserId,
        otherId
      );
      onClose();
      router.push(`/chats/${conversationId}`);
    } catch {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">New Chat</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative p-4">
          <Search className="pointer-events-none absolute left-8 top-[26px] h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username…"
            className="h-11 w-full rounded-xl border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        <div className="glass-scroll max-h-80 overflow-y-auto pb-2">
          {loading && (
            <p className="px-5 py-3 text-sm text-muted-foreground">Searching…</p>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <p className="px-5 py-3 text-sm text-muted-foreground">No users found.</p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => open(u.id)}
              disabled={busy !== null}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <Avatar src={u.avatar_url} size="sm">
                {initialsOf(u.username)}
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{u.username}</p>
                {u.bio && (
                  <p className="truncate text-sm text-muted-foreground">{u.bio}</p>
                )}
              </div>
              {busy === u.id && (
                <span className="ml-auto text-xs text-muted-foreground">Opening…</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
