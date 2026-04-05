"use server";

import crypto from "crypto";

export type GenerateSmileSignatureResult =
  | { success: true; signature: string; timestamp: string; partnerId: string }
  | { success: false; error: string };

/**
 * Smile ID REST API signature (HMAC-SHA256 over timestamp + partner_id + "sid_request", base64).
 * @see https://docs.usesmileid.com/integration-options/rest-api/signing-your-api-request/generate-signature
 */
export async function generateSmileSignature(): Promise<GenerateSmileSignatureResult> {
  const partnerId = process.env.SMILE_PARTNER_ID?.trim();
  const apiKey = process.env.SMILE_API_KEY?.trim();

  if (!partnerId || !apiKey) {
    return {
      success: false,
      error: "Smile ID is not configured (SMILE_PARTNER_ID / SMILE_API_KEY).",
    };
  }

  const timestamp = new Date().toISOString();
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(timestamp, "utf8");
  hmac.update(partnerId, "utf8");
  hmac.update("sid_request", "utf8");
  const signature = hmac.digest("base64");

  return { success: true, signature, timestamp, partnerId };
}
