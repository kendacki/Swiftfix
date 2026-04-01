"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Camera } from "lucide-react";
import { uploadAvatar } from "@/actions/avatarActions";

type PrivyUpdateUserFn = (updates: { customMetadata?: Record<string, unknown> }) => Promise<unknown>;

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
  const { ready, authenticated, user } = usePrivy();

  const updateUser = (usePrivy() as unknown as { updateUser?: PrivyUpdateUserFn })
    .updateUser;

  const existingAvatarUrl = useMemo(() => {
    const meta = (user as unknown as { customMetadata?: Record<string, unknown> })
      ?.customMetadata;
    const v = meta?.avatarUrl;
    return typeof v === "string" && v.length > 0 ? v : null;
  }, [user]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(existingAvatarUrl);
  }, [existingAvatarUrl]);

  const onPick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (file: File | null) => {
    setError(null);

    if (!file) return;
    if (!ready || !authenticated) {
      setError("Please sign in to upload an avatar.");
      return;
    }
    if (!updateUser) {
      setError("Profile update is unavailable. Please try again.");
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const { publicUrl } = await uploadAvatar(user?.id ?? "", form);

      const existingMeta =
        (user as unknown as { customMetadata?: Record<string, unknown> })
          ?.customMetadata ?? {};

      await updateUser({
        customMetadata: {
          ...existingMeta,
          avatarUrl: publicUrl,
        },
      });

      setAvatarUrl(publicUrl);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar"
              fill
              className={[
                "object-cover transition",
                isUploading ? "scale-[1.02] blur-[1px] brightness-75" : "",
              ].join(" ")}
            />
          ) : (
            <div
              className={[
                "flex h-full w-full items-center justify-center text-zinc-500 transition",
                isUploading ? "blur-[1px] brightness-75" : "",
              ].join(" ")}
            >
              <Camera className="h-6 w-6" />
            </div>
          )}

          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center">
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
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          void onFileSelected(f);
        }}
      />

      {error ? (
        <div className="text-xs font-medium text-red-700">{error}</div>
      ) : null}
    </div>
  );
}

export default ProfileAvatarUpload;

