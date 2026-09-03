import { supabase } from "@/lib/supabase";
import type { AuthState } from "@/lib/authTypes";

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

export function describeAuthError(
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

  return e.message && e.message.trim() ? e.message : "Something went wrong. Please try again.";
}

export const isValidEmail = emailLooksValid;

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

export async function login(
  email: string,
  password: string
): Promise<AuthState> {
  const e = email.trim().toLowerCase();
  if (!e || !password) return { error: "Email and password are required", ok: false };
  if (!emailLooksValid(e)) return { error: INVALID_EMAIL_MSG, ok: false };

  const { error } = await supabase.auth.signInWithPassword({ email: e, password });
  if (error) return { error: describeAuthError(error, "login"), ok: false };
  return { error: null, ok: true };
}

export async function signupSendOtp(
  email: string,
  username: string,
  password: string
): Promise<AuthState> {
  const e = email.trim().toLowerCase();
  if (!e) return { error: "Email is required", ok: false };
  if (!emailLooksValid(e)) return { error: INVALID_EMAIL_MSG, ok: false };
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters", ok: false };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { error: "Username must be 3-24 chars (letters, numbers, underscore)", ok: false };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: e,
    options: {
      data: { username },
      shouldCreateUser: true,
    },
  });
  if (error) return { error: describeAuthError(error, "otp"), ok: false };
  return { error: null, ok: true };
}

export async function signupVerifyOtp(
  email: string,
  token: string,
  username: string,
  password: string
): Promise<AuthState> {
  const e = email.trim().toLowerCase();
  if (!e || !token) return { error: "Email and code are required", ok: false };
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters", ok: false };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: e,
    token,
    type: "email",
  });
  if (error) return { error: describeAuthError(error, "verify"), ok: false };

  const user = data.user;
  if (!user) return { error: "Verification failed. Please request a new code and try again.", ok: false };

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) return { error: describeAuthError(pwError, "verify"), ok: false };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);
  if (profileError) {
    return { error: "That username is already taken. Try another.", ok: false };
  }

  return { error: null, ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}
