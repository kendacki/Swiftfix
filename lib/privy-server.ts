import { PrivyClient } from "@privy-io/server-auth";

export function getPrivy(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET.");
  }
  return new PrivyClient(appId, appSecret);
}
