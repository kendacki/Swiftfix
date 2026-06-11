const PRODUCTION_SITE_URL = "https://swiftfixs.app";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return PRODUCTION_SITE_URL;
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteUrl()}/`);
}
