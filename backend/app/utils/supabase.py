"""Supabase client factory (backend / service-role).

The service role key is used ONLY on the backend via environment variables and is
never exposed to the frontend.
"""

from __future__ import annotations

from supabase import Client, create_client

from app.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    """Return a lazily-created Supabase client (service-role)."""
    global _client
    if _client is None:
        if not settings.supabase_configured:
            raise RuntimeError("Supabase not configured (missing SUPABASE_URL/SERVICE_ROLE_KEY)")
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _client


def set_supabase(client: Client) -> None:
    """Allow injecting a client for tests."""
    global _client
    _client = client
