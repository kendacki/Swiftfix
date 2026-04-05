"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

function hasDisplayNameInMetadata(user: ReturnType<typeof usePrivy>["user"]): boolean {
  const meta = (user as unknown as { customMetadata?: Record<string, unknown> } | null)
    ?.customMetadata;
  const dn = meta?.displayName;
  return typeof dn === "string" && dn.trim().length > 0;
}

function hasEmailLinked(user: ReturnType<typeof usePrivy>["user"]): boolean {
  if (!user) return false;
  if (user.email?.address) return true;
  const linked = user.linkedAccounts ?? [];
  return linked.some((a) => a.type === "email");
}

function hasPhoneLinked(user: ReturnType<typeof usePrivy>["user"]): boolean {
  if (!user) return false;
  if (user.phone?.number) return true;
  const linked = user.linkedAccounts ?? [];
  return linked.some((a) => a.type === "phone");
}


/**
 * Derives Basic vs Advanced KYC status from Privy user + custom metadata.
 * Basic: linked email, linked phone, and display name in custom metadata.
 * Advanced: `customMetadata.kycTier === "ADVANCED"`.
 */
export function useKYC() {
  const { user } = usePrivy();

  const { hasEmail, hasPhone, hasName, isBasicVerified, isAdvancedVerified } = useMemo(() => {
    const he = hasEmailLinked(user);
    const hp = hasPhoneLinked(user);
    const hn = hasDisplayNameInMetadata(user);
    const meta = (user as unknown as { customMetadata?: Record<string, unknown> } | null)
      ?.customMetadata;
    const tier = meta?.kycTier;
    const advancedVerified =
      tier === "ADVANCED" || tier === "advanced";
    return {
      hasEmail: he,
      hasPhone: hp,
      hasName: hn,
      isBasicVerified: he && hp && hn,
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
