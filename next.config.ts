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
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false, crypto: false };
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "lokijs", "encoding", "@solana/web3.js");
    }
    return config;
  },
  images: {
    remotePatterns: supabasePattern ? [supabasePattern] : [],
  },
};

export default nextConfig;
