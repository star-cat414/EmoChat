"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase";

export type AuthState = { error: string | null; ok?: boolean };

type AuthErrorLike = { message?: string; status?: number; code?: string };

function isNetworkError(e: AuthErrorLike): boolean {
  return (
    e.code === "fetch" ||
    (typeof e.status === "number" && e.status === 0) ||
    /failed to fetch|(network|socket) (error|hang|change)|offline|fetch failed/i.test(
      e.message ?? ""
    )
  );
}

const NETWORK_MSG =
  "Cannot reach the server. Check your internet connection and try again.";
const RATE_LIMIT_MSG = "Too many attempts. Please wait a moment and try again.";
const INVALID_EMAIL_MSG = "Please enter a valid email address.";

function describeAuthError(
  e: AuthErrorLike | null,
  scope: "login" | "otp" | "verify"
): string {
  if (!e) return "Something went wrong. Please try again.";
  if (isNetworkError(e)) {
    return scope === "login"
      ? "Incorrect email or password, or the server could not be reached. Check your connection and try again."
      : NETWORK_MSG;
  }

  const code = e.code ?? "";
  const msg = (e.message ?? "").toLowerCase();

  if (/\b(rate.?limit|over_request_rate_limit)\b/.test(code + " " + msg)) {
    return RATE_LIMIT_MSG;
  }

  if (code === "invalid_email" || msg.includes("invalid email")) {
    return INVALID_EMAIL_MSG;
  }

  switch (scope) {
    case "login":
      if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
        return "Incorrect email or password.";
      }
      if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
        return "Please confirm your email before signing in.";
      }
      if (code === "weak_password" || msg.includes("password")) {
        return "Password must be at least 6 characters.";
      }
      break;
    case "otp":
      if (code === "signup_disabled" || msg.includes("signups disabled") || msg.includes("signup.disabled")) {
        return "New signups are currently disabled. Please try again later.";
      }
      if (msg.includes("already registered") || code === "user_already_exists") {
        return "An account with this email already exists. Try signing in instead.";
      }
      break;
    case "verify":
      if (
        code === "otp_expired" ||
        msg.includes("expired") ||
        msg.includes("invalid token") ||
        msg.includes("invalid otp") ||
        msg.includes("otp code")
      ) {
        return "The verification code is invalid or expired. Please request a new one.";
      }
      if (code === "weak_password" || msg.includes("weak password") || msg.includes("password should be at least")) {
        return "Password must be at least 6 characters.";
      }
      break;
  }

  return e.message ?? "Something went wrong. Please try again.";
}

/**
 * LOGIN — password-based (no OTP).
 */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: describeAuthError(error, "login") };

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
  if (error) return { error: describeAuthError(error, "otp") };

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
  if (error) return { error: describeAuthError(error, "verify") };

  const user = data.user;
  if (!user) return { error: "Verification failed. Please request a new code and try again." };

  // Set the password so the user can log in with it afterwards.
  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) return { error: describeAuthError(pwError, "verify") };

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
