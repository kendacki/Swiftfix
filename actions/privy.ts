"use server";

import type { PrivyClient } from "@privy-io/server-auth";
import { getPrivy } from "@/lib/privy-server";

type MetadataPatch = Record<string, string | number | boolean>;

async function mergeCustomMetadata(
  privy: PrivyClient,
  userId: string,
  patch: MetadataPatch,
): Promise<void> {
  const existingUser = await privy.getUser(userId);
  const prev =
    (existingUser as { customMetadata?: MetadataPatch }).customMetadata ?? {};
  await privy.setCustomMetadata(userId, { ...prev, ...patch });
}

/**
 * Updates Privy custom metadata for the authenticated user (merges with existing keys).
 * Pass the user's Privy **access token** from `getAccessToken()`.
 */
export async function updateUserMetadata(
  accessToken: string,
  updates: MetadataPatch,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const privy = getPrivy();
    const claims = await privy.verifyAuthToken(accessToken);
    await mergeCustomMetadata(privy, claims.userId, updates);
    return { success: true };
  } catch (error) {
    console.error("Privy updateUserMetadata error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Updates withdrawal 2FA preference in Privy custom metadata.
 * Pass the user's Privy **access token** from `getAccessToken()` — the server verifies it
 * and applies changes only for that user.
 */
export async function toggleWithdrawal2FA(
  accessToken: string,
  isEnabled: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const privy = getPrivy();
    const claims = await privy.verifyAuthToken(accessToken);
    await mergeCustomMetadata(privy, claims.userId, {
      withdrawal2FAEnabled: isEnabled,
    });
    return { success: true };
  } catch (error) {
    console.error("Privy Metadata Error:", error);
    return { success: false, error: "Failed to update security settings" };
  }
}

/**
 * For SmileID / Sumsub webhooks or internal tools — updates KYC tier in custom metadata.
 * Verifies the caller via Privy access token.
 */
export async function updateUserKYCTier(
  accessToken: string,
  tier: "BASIC" | "ADVANCED",
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const privy = getPrivy();
    const claims = await privy.verifyAuthToken(accessToken);
    await mergeCustomMetadata(privy, claims.userId, { kycTier: tier });
    return { success: true };
  } catch (error) {
    console.error("Privy KYC metadata error:", error);
    return { success: false, error: "Failed to update KYC status" };
  }
}
