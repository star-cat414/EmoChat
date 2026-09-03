import Constants from "expo-constants";

function env(key: string, fallback = ""): string {
  const val = Constants.expoConfig?.extra?.[key];
  if (typeof val === "string" && val) return val;
  return (process.env["EXPO_PUBLIC_" + key] as string | undefined) ?? fallback;
}

export const SUPABASE_URL = env("SUPABASE_URL");
export const SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY");
export const API_URL = env("API_URL") || "http://localhost:8000";
