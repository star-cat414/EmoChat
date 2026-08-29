"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase";

export type AuthState = { error: string | null; ok?: boolean };

/**
 * LOGIN — password-based (no OTP).
 */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * SIGNUP STEP 1 — send an OTP code to the email. No account is created yet.
 * The password + username are carried to the verify step via the form.
 */
export async function signupSendOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email) return { error: "Email is required" };
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "Username must be 3-24 chars (letters, numbers, underscore)" };
  }

  // Store signup intent so the verify step can complete account creation.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { username },
      shouldCreateUser: true,
    },
  });
  if (error) return { error: error.message };

  return { error: null, ok: true };
}

/**
 * SIGNUP STEP 2 — verify the OTP code, create the account, and set the password.
 */
export async function signupVerifyOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("token") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !token) return { error: "Email and code are required" };
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Verifying an email OTP with a new email creates + authenticates the user.
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };

  const user = data.user;
  if (!user) return { error: "Verification failed. Please try again." };

  // Set the password so the user can log in with it afterwards.
  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) return { error: pwError.message };

  // Apply the chosen username to the profile (created by the signup trigger).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);
  if (profileError) {
    return { error: "That username is already taken. Try another." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
