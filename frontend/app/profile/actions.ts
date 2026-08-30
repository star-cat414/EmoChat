"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const BIO_MAX = 500;

function profileError(e: { message?: string; code?: string } | null): string {
  if (!e) return "Something went wrong. Please try again.";
  if (e.code === "23505") return "That username is already taken. Try another.";
  return e.message || "Something went wrong. Please try again.";
}

export async function updateProfile(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const username = String(formData.get("username") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3-24 chars (letters, numbers, underscore)" };
  }
  if (bio.length > BIO_MAX) {
    return { error: `Bio must be ${BIO_MAX} characters or fewer.` };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, bio: bio || null })
    .eq("id", user.id);
  if (error) return { error: profileError(error) };

  revalidatePath("/profile/[id]");
  return { error: null };
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export async function uploadAvatar(file: File): Promise<{ error: string | null; url: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", url: null };

  if (!file.type.startsWith("image/")) {
    return { error: "Please choose an image file (PNG, JPG, WebP, GIF).", url: null };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "Image must be 5MB or smaller.", url: null };
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message, url: null };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", user.id);
  if (updateError) return { error: profileError(updateError), url: null };

  revalidatePath("/profile/[id]");
  return { error: null, url: data.publicUrl };
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").delete().eq("id", user.id);
  if (error) return { error: profileError(error) };

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?account=deleted");
}
