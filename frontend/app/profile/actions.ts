"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase";

export async function updateProfile(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const username = String(formData.get("username") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "Username must be 3-24 chars (letters, numbers, underscore)" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, bio: bio || null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile/[id]");
  return { error: null };
}

export async function uploadAvatar(file: File): Promise<{ error: string | null; url: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", url: null };

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
  if (updateError) return { error: updateError.message, url: null };

  revalidatePath("/profile/[id]");
  return { error: null, url: data.publicUrl };
}
