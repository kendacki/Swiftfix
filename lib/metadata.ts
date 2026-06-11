import type { Metadata } from "next";
import { getMetadataBase, getSiteUrl } from "@/lib/site";

export const siteTitle = "SwiftFix — Control Your Savings. The Swift Way.";
export const siteShortTitle = "SwiftFix";
export const siteDescription =
  "Seamlessly request trusted artisans, and pay them in Naira or USDT. Swap, pay, and grow your money with zero hidden fees.";

const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: siteTitle,
  type: "image/png",
} as const;

export const siteMetadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteTitle,
    template: `%s | ${siteShortTitle}`,
  },
  description: siteDescription,
  applicationName: siteShortTitle,
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    type: "website",
    siteName: siteShortTitle,
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
    url: getSiteUrl(),
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage.url],
  },
};
