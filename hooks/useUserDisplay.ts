"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

/** Public path for when the user has no custom avatar in Privy metadata. */
export const DEFAULT_AVATAR_PATH = "/avatar-placeholder.svg";

function readMetadata(user: ReturnType<typeof usePrivy>["user"]): Record<string, unknown> | undefined {
  return (user as unknown as { customMetadata?: Record<string, unknown> } | null)?.customMetadata;
}

/**
 * Wraps `usePrivy` and adds `displayName` and `avatarUrl` with sensible fallbacks.
 */
export function useUserDisplay() {
  const privy = usePrivy();

  const displayName = useMemo(() => {
    const meta = readMetadata(privy.user);
    const fromMeta = meta?.displayName;
    if (typeof fromMeta === "string" && fromMeta.trim().length > 0) {
      return fromMeta.trim();
    }
    const legacyName = meta?.name;
    if (typeof legacyName === "string" && legacyName.trim().length > 0) {
      return legacyName.trim();
    }
    if (privy.user?.email?.address) return privy.user.email.address;
    if (privy.user?.phone?.number) return privy.user.phone.number;
    return "User";
  }, [privy.user]);

  const avatarUrl = useMemo(() => {
    const meta = readMetadata(privy.user);
    const v = meta?.avatarUrl;
    if (typeof v === "string" && v.length > 0) return v;
    return DEFAULT_AVATAR_PATH;
  }, [privy.user]);

  return { ...privy, displayName, avatarUrl };
}
