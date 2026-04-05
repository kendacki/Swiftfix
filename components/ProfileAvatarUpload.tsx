"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { usePrivy, useUser } from "@privy-io/react-auth";
import { updateUserMetadata } from "@/actions/privy";
import { DEFAULT_AVATAR_PATH } from "@/hooks/useUserDisplay";

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 animate-spin text-zinc-600"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function ProfileAvatarUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { refreshUser } = useUser();

  const existingAvatarUrl = useMemo(() => {
    const meta = (user as unknown as { customMetadata?: Record<string, unknown> })
      ?.customMetadata;
    const v = meta?.avatarUrl;
    return typeof v === "string" && v.length > 0 ? v : null;
  }, [user]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(existingAvatarUrl);
  }, [existingAvatarUrl]);

  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(id);
  }, [success]);

  const onPick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    setSuccess(null);

    if (!ready || !authenticated) {
      setError("Please sign in to upload an avatar.");
      return;
    }

    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!preset || !cloudName) {
      setError("Cloudinary is not configured (missing NEXT_PUBLIC_CLOUDINARY_* env vars).");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("folder", "avatars");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        secure_url?: string;
        error?: { message?: string } | string;
      };

      if (!response.ok) {
        const msg =
          typeof data.error === "object" && data.error?.message
            ? data.error.message
            : typeof data.error === "string"
              ? data.error
              : "Cloudinary upload failed";
        throw new Error(msg);
      }

      const newAvatarUrl = data.secure_url;
      if (!newAvatarUrl) {
        throw new Error("Cloudinary did not return a secure URL.");
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error("Could not get session. Please sign in again.");
      }

      const privyRes = await updateUserMetadata(token, { avatarUrl: newAvatarUrl });
      if (!privyRes.success) {
        throw new Error(privyRes.error ?? "Failed to save to profile");
      }

      await getAccessToken();
      await refreshUser();
      setAvatarUrl(newAvatarUrl);
      setSuccess("Profile photo updated!");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displaySrc = avatarUrl ?? DEFAULT_AVATAR_PATH;

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-3">
        <button
          type="button"
          onClick={onPick}
          disabled={isUploading}
          className={[
            "relative h-20 w-20 overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 shadow-sm transition",
            isUploading ? "cursor-not-allowed" : "hover:bg-zinc-100",
          ].join(" ")}
          aria-label="Upload profile avatar"
        >
          <Image
            src={displaySrc}
            alt="Profile avatar"
            fill
            className={[
              "object-cover transition",
              isUploading ? "scale-[1.02] blur-[1px] brightness-75" : "",
            ].join(" ")}
            sizes="80px"
          />

          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
              <Spinner />
            </div>
          ) : null}
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900">
            Profile picture
          </div>
          <button
            type="button"
            onClick={onPick}
            disabled={isUploading}
            className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Upload New
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleImageUpload(e)}
      />

      {success ? (
        <div className="text-xs font-medium text-emerald-700">{success}</div>
      ) : null}
      {error ? (
        <div className="text-xs font-medium text-red-700">{error}</div>
      ) : null}
    </div>
  );
}

export default ProfileAvatarUpload;
