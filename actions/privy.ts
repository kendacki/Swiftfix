"use server";

import { PrivyClient } from "@privy-io/server-auth";

function getPrivy(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET.");
  }
  return new PrivyClient(appId, appSecret);
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
    await privy.setCustomMetadata(claims.userId, {
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
    await privy.setCustomMetadata(claims.userId, { kycTier: tier });
    return { success: true };
  } catch (error) {
    console.error("Privy KYC metadata error:", error);
    return { success: false, error: "Failed to update KYC status" };
  }
}
