import type { NextConfig } from "next";

function supabaseImageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!raw) return undefined;
  try {
    const { hostname } = new URL(raw);
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const supabasePattern = supabaseImageRemotePattern();

const nextConfig: NextConfig = {
  transpilePackages: ["@privy-io/react-auth", "x402"],
  images: {
    remotePatterns: supabasePattern ? [supabasePattern] : [],
  },
};

export default nextConfig;
