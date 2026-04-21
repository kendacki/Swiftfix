import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import { DEFAULT_POLYGON_RPC_URL } from "@/lib/constants/polygon";

export const polygonPublicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || DEFAULT_POLYGON_RPC_URL),
});

