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
const LOGIN_NETWORK_MSG =
  "Cannot reach the server, or the email or password is incorrect. Check your connection and try again.";
const RATE_LIMIT_MSG =
  "Too many attempts on this account or from this device. Please wait a few minutes and try again.";
const INVALID_EMAIL_MSG = "Please enter a valid email address.";

const emailLooksValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

function describeAuthError(
  e: AuthErrorLike | null,
  scope: "login" | "otp" | "verify"
): string {
  if (!e) return "Something went wrong. Please try again.";

  if (isNetworkError(e)) {
    return scope === "login" ? LOGIN_NETWORK_MSG : NETWORK_MSG;
  }

  const code = e.code ?? "";
  const status = e.status;
  const msg = (e.message ?? "").toLowerCase();
  const has = (...pats: string[]) =>
    pats.some((p) => p === code || msg.includes(p));

  // Any scope: rate limited by Supabase (HTTP 429 or known codes/messages).
  if (
    status === 429 ||
    has(
      "rate limit",
      "too many requests",
      "over_email_send_rate_limit",
      "over_request_rate_limit",
      "email_send_rate_limit"
    )
  ) {
    return RATE_LIMIT_MSG;
  }

  // Any scope: malformed email address.
  if (has("invalid email", "invalid_email", "email_address_invalid")) {
    return INVALID_EMAIL_MSG;
  }

  switch (scope) {
    case "login":
      if (
        has(
          "invalid login credentials",
          "invalid_credentials",
          "incorrect email or password",
          "email or password is incorrect"
        )
      ) {
        return "Incorrect email or password. Please check both and try again.";
      }
      if (has("not confirmed", "email_not_confirmed", "unverified")) {
        return "This email hasn't been verified yet. Check your inbox for the confirmation link.";
      }
      if (has("banned", "user_banned", "suspended", "disabled account")) {
        return "This account has been suspended. Please contact support.";
      }
      if (has("user not found", "user_not_found", "no user found")) {
        return "No account exists with this email. Consider signing up first.";
      }
      if (
        has(
          "email is not allowed",
          "email_not_allowed",
          "domain not allowed"
        )
      ) {
        return "This email address is not allowed to sign in. Try a different email.";
      }
      if (has("weak password", "weak_password", "password should be at least")) {
        return "Password must be at least 6 characters.";
      }
      if (has("captcha")) {
        return "Human verification failed. Please try again.";
      }
      break;

    case "otp":
      if (
        has(
          "already registered",
          "already been registered",
          "user_already_exists",
          "account already exists"
        )
      ) {
        return "An account with this email already exists. Try signing in instead.";
      }
      if (
        has(
          "signups not allowed",
          "signup disabled",
          "signups disabled",
          "signup_disabled",
          "signup not allowed"
        )
      ) {
        return "New signups are currently disabled. Please try again later.";
      }
      if (has("email is not allowed", "email_not_allowed", "domain not allowed")) {
        return "This email address is not allowed to sign up. Try a different email.";
      }
      if (
        has(
          "database error saving new user",
          "database error",
          "db_error"
        )
      ) {
        return "Could not create an account right now. Please try again shortly.";
      }
      break;

    case "verify":
      if (
        has(
          "token has expired",
          "otp expired",
          "otp_expired",
          "expired",
          "invalid token",
          "invalid otp",
          "unable to validate",
          "otp code",
          "wrong otp"
        )
      ) {
        return "The verification code is invalid or expired. Please request a new one.";
      }
      if (has("weak password", "weak_password", "password should be at least")) {
        return "Password must be at least 6 characters.";
      }
      if (has("already registered", "already been registered", "user_already_exists")) {
        return "An account with this email already exists. Try signing in instead.";
      }
      break;
  }

  // Unknown error: surface the exact message so nothing is hidden.
  return e.message && e.message.trim() ? e.message : "Something went wrong. Please try again.";
}

/**
 * LOGIN — password-based (no OTP).
 */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required" };
  if (!emailLooksValid(email)) return { error: INVALID_EMAIL_MSG };

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
  if (!emailLooksValid(email)) return { error: INVALID_EMAIL_MSG };
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
