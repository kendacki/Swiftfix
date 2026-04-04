"use client";

import { useCallback, useState } from "react";
import { AlertCircle, BadgeCheck, CheckCircle2, Loader2 } from "lucide-react";

export default function KycPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const simulateBasicVerification = useCallback(() => {
    if (pending || isVerified) return;
    setPending(true);
    setSuccessMessage(null);
    window.setTimeout(() => {
      setIsVerified(true);
      setPending(false);
      setSuccessMessage("Basic verification completed successfully.");
      window.alert("Basic verification completed successfully.");
    }, 1500);
  }, [pending, isVerified]);

  return (
    <div className="mx-auto w-full max-w-lg pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Identity Verification</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Please provide some information about yourself. We use this information to
          protect your account and give you access to additional services.
        </p>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {/* Basic KYC */}
      <div
        className={[
          "relative overflow-hidden rounded-2xl p-5 text-white shadow-md",
          isVerified ? "bg-slate-900" : "bg-slate-800",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Basic KYC</h2>
            {isVerified ? (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white">
                Current Tier
              </span>
            ) : null}
          </div>
          {isVerified ? (
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/20">
              <BadgeCheck className="h-7 w-7 text-white" />
              <span className="text-[8px] font-bold uppercase tracking-tighter text-emerald-100">
                Verified
              </span>
            </div>
          ) : null}
        </div>
        <ul className="mt-3 list-inside list-disc text-sm text-white/90">
          <li>Account security basics, standard limits</li>
          <li>Verify your basic details to secure your account</li>
        </ul>
        {!isVerified ? (
          <button
            type="button"
            onClick={simulateBasicVerification}
            disabled={pending}
            className="mt-4 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20 disabled:opacity-60"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              "Verify Now"
            )}
          </button>
        ) : null}
      </div>

      {/* Advanced KYC */}
      <div
        className={[
          "mt-4 rounded-2xl border-2 p-5 shadow-sm transition",
          isVerified
            ? "border-emerald-300 bg-emerald-50/80"
            : "pointer-events-none border-amber-200 bg-amber-50/90 opacity-75",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={[
                "text-lg font-bold",
                isVerified ? "text-slate-900" : "text-slate-800",
              ].join(" ")}
            >
              Advanced KYC
            </h2>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900">
                <AlertCircle className="h-3.5 w-3.5" />
                Not Started
              </span>
            )}
          </div>
        </div>
        <ul
          className={[
            "mt-2 list-inside list-disc text-sm",
            isVerified ? "text-slate-800" : "text-slate-700",
          ].join(" ")}
        >
          <li>Full platform access, increased limits</li>
          <li>Complete advanced verification to unlock the full experience</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={simulateBasicVerification}
        disabled={pending || isVerified}
        className="mt-8 w-full rounded-full bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Please wait…
          </span>
        ) : isVerified ? (
          "Verified"
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}
