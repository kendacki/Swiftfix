"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useKYC } from "@/hooks/useKYC";

export type KYCGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Restricts children until the user has Basic KYC (`isBasicVerified`).
 * Use for high-risk actions (send, swap); leave deposits and read-only UI outside the gate.
 */
export function KYCGate({ children, fallback }: KYCGateProps) {
  const router = useRouter();
  const { isBasicVerified } = useKYC();

  if (isBasicVerified) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-5 shadow-sm sm:p-6"
      data-basic-verified={isBasicVerified ? "true" : "false"}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(24,24,27,0.06),_transparent_55%)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
          <Lock className="h-5 w-5 text-zinc-700" strokeWidth={2.25} />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-900">
          Verification Required
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
          You must complete Identity Verification to unlock this feature.
        </p>
        <button
          type="button"
          onClick={() => router.push("/kyc")}
          className="mt-5 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Verify Identity
        </button>
      </div>
    </div>
  );
}

export default KYCGate;
