"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

type UserWithMeta = {
  phone?: { number?: string | null };
  email?: { address?: string | null };
  linkedAccounts?: { type?: string }[];
  customMetadata?: {
    phone?: unknown;
    displayName?: unknown;
    kycTier?: unknown;
  };
};

function readCustomMetadata(user: ReturnType<typeof usePrivy>["user"]) {
  return (user as unknown as UserWithMeta | null | undefined)?.customMetadata;
}

/**
 * Derives Basic vs Advanced KYC status from Privy user + custom metadata.
 * Basic: email (any Privy source), phone (including customMetadata.phone), displayName in custom metadata.
 * Advanced: `customMetadata.kycTier === "ADVANCED"`.
 */
export function useKYC() {
  const { user } = usePrivy();

  const { hasEmail, hasPhone, hasName, isBasicVerified, isAdvancedVerified } = useMemo(() => {
    const meta = readCustomMetadata(user);

    const hasEmail =
      !!user?.email?.address ||
      (user?.linkedAccounts?.some((acc) => acc.type === "email") ?? false);

    const phoneFromMeta = meta?.phone;
    const hasPhoneFromMeta =
      typeof phoneFromMeta === "string"
        ? phoneFromMeta.trim().length > 0
        : phoneFromMeta != null && String(phoneFromMeta).trim().length > 0;

    const hasPhone =
      !!user?.phone?.number ||
      (user?.linkedAccounts?.some((acc) => acc.type === "phone") ?? false) ||
      hasPhoneFromMeta;

    const displayName = meta?.displayName;
    const hasName = !!(
      typeof displayName === "string" &&
      displayName.trim().length > 0
    );

    const tier = meta?.kycTier;
    const advancedVerified = tier === "ADVANCED" || tier === "advanced";

    return {
      hasEmail,
      hasPhone,
      hasName,
      isBasicVerified: hasPhone && hasEmail && hasName,
      isAdvancedVerified: advancedVerified,
    };
  }, [user]);

  return {
    isBasicVerified,
    isAdvancedVerified,
    hasEmail,
    hasPhone,
    hasName,
    user,
  };
}
