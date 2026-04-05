"use server";

/**
 * Avatar files go to Supabase Storage only. The public URL is saved to Privy
 * `customMetadata.avatarUrl` on the client (see ProfileAvatarUpload) — no DB.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadAvatar(privyId: string, formData: FormData) {
  if (!privyId) throw new Error("Missing Privy ID.");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file selected.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image is too large (max 5MB).");
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "avatars";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${privyId}/${Date.now()}-${safeName}`;

  const supabase = getSupabaseClient();

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error("Upload failed. Please try again.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return { publicUrl: data.publicUrl, path, bucket };
}

