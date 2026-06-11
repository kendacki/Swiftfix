import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import {
  siteDescription,
  siteMetadata,
  siteTitle,
} from "@/lib/metadata";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  ...siteMetadata,
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    ...siteMetadata.openGraph,
    title: siteTitle,
    description: siteDescription,
    url: getSiteUrl(),
  },
  twitter: {
    ...siteMetadata.twitter,
    title: siteTitle,
    description: siteDescription,
  },
};

export default function Page() {
  return <HomePage />;
}
