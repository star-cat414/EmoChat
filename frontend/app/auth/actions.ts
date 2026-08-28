"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase";

export type AuthState = { error: string | null; ok?: boolean };

/**
 * Request an OTP (one-time code) for the given email. Used by both login and
 * register flows. If `username` is provided (registration), it is stored in
 * user metadata so the signup trigger can set a friendly username.
 */
export async function otpRequest(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = String(formData.get("username") || "").trim();

  if (!email) return { error: "Email is required" };
  if (username && !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "Username must be 3-24 chars (letters, numbers, underscore)" };
  }

  const options: { emailRedirectTo?: string; data?: { username?: string } } = {};
  if (username) options.data = { username };

  const { error } = await supabase.auth.signInWithOtp({ email, options });
  if (error) return { error: error.message };

  return { error: null, ok: true };
}

/**
 * Verify the OTP code the user received by email. If successful, the user is
 * authenticated. Optionally set a display username for new users.
 */
export async function otpVerify(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("token") || "").trim();
  const username = String(formData.get("username") || "").trim();

  if (!email || !token) return { error: "Email and code are required" };

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };

  const user = data.user;
  if (!user) return { error: "Verification failed. Please try again." };

  // If the user supplied a username (registration), apply it to their profile.
  if (username) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);
    if (profileError) {
      return { error: "That username is already taken. Try another." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
