"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, BadgeCheck, Sparkles } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { generateSmileSignature } from "@/actions/smile";
import { useKYC } from "@/hooks/useKYC";

const SmileCamera = dynamic(
  () =>
    import("@smile_identity/smart-camera-web").then(() => {
      function SmileCameraLoader() {
        return null;
      }
      return SmileCameraLoader;
    }),
  { ssr: false },
);

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-white/95">
      <span className="select-none" aria-hidden>
        {ok ? "✅" : "❌"}
      </span>
      <span>{label}</span>
    </li>
  );
}

export default function KycPage() {
  const { user } = usePrivy();
  const { isBasicVerified, isAdvancedVerified, hasEmail, hasPhone, hasName } = useKYC();
  const [advancedToast, setAdvancedToast] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState(false);
  const [isSmileIdOpen, setIsSmileIdOpen] = useState(false);
  const [isAdvancedKycLoading, setIsAdvancedKycLoading] = useState(false);
  const cameraRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!advancedToast) return;
    const id = window.setTimeout(() => {
      setAdvancedToast(null);
      setToastSuccess(false);
    }, 5000);
    return () => window.clearTimeout(id);
  }, [advancedToast]);

  useLayoutEffect(() => {
    if (!isSmileIdOpen) return;
    const el = cameraRef.current;
    if (!el) return;

    const onImagesComputed = async (e: Event) => {
      const detail = (e as CustomEvent<{ images?: unknown[] }>).detail;
      const images = detail?.images;
      const userId = user?.id;
      if (!userId) {
        setToastSuccess(false);
        setAdvancedToast("Sign in required to submit verification.");
        return;
      }
      try {
        const res = await fetch("/api/webhooks/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            images,
            verificationStatus: "CAPTURED",
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || res.statusText);
        }
        setToastSuccess(true);
        setAdvancedToast("Images submitted successfully.");
        setIsSmileIdOpen(false);
      } catch (err) {
        console.error("KYC capture submit:", err);
        setToastSuccess(false);
        setAdvancedToast("Could not submit verification. Try again.");
      }
    };

    el.addEventListener("imagesComputed", onImagesComputed as EventListener);
    return () =>
      el.removeEventListener("imagesComputed", onImagesComputed as EventListener);
  }, [isSmileIdOpen, user?.id]);

  async function handleStartAdvancedKYC() {
    setIsAdvancedKycLoading(true);
    setToastSuccess(false);
    try {
      await import("@smile_identity/smart-camera-web");
      const result = await generateSmileSignature();
      if (result.success) {
        setIsSmileIdOpen(true);
      } else {
        setAdvancedToast(result.error);
      }
    } catch (err) {
      console.error("handleStartAdvancedKYC:", err);
      setAdvancedToast("Could not start verification. Try again.");
    } finally {
      setIsAdvancedKycLoading(false);
    }
  }

  const advancedLocked = !isBasicVerified;

  if (isSmileIdOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <SmileCamera />
        <smart-camera-web ref={cameraRef} capture-id="true" />
        <button
          type="button"
          onClick={() => setIsSmileIdOpen(false)}
          className="absolute top-4 right-4 text-white"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Identity Verification</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Please provide some information about yourself. We use this information to
          protect your account and give you access to additional services.
        </p>
      </div>

      {advancedToast ? (
        <div
          role="status"
          className={[
            "mb-4 rounded-xl border px-4 py-3 text-sm font-medium",
            toastSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950",
          ].join(" ")}
        >
          {advancedToast}
        </div>
      ) : null}

      {/* Basic KYC */}
      <div
        className={[
          "relative overflow-hidden rounded-2xl p-5 text-white shadow-md",
          isBasicVerified ? "bg-slate-900" : "bg-slate-800",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Basic KYC</h2>
            {isBasicVerified ? (
              <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-300/60">
                Verified
              </span>
            ) : null}
          </div>
          {isBasicVerified ? (
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/20">
              <BadgeCheck className="h-7 w-7 text-white" />
              <span className="text-[8px] font-bold uppercase tracking-tighter text-emerald-100">
                Verified
              </span>
            </div>
          ) : null}
        </div>

        <ul className="mt-3 list-none space-y-1.5 text-sm text-white/90">
          <li className="text-white/80">Account security basics, standard limits</li>
          <li className="text-white/80">Verify your basic details to secure your account</li>
        </ul>

        {!isBasicVerified ? (
          <div className="mt-4 rounded-xl bg-black/20 p-3 ring-1 ring-white/15">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Complete these steps
            </p>
            <ul className="mt-2 space-y-2">
              <CheckRow ok={hasEmail} label="Link email" />
              <CheckRow ok={hasPhone} label="Link phone number" />
              <CheckRow ok={hasName} label="Set display name" />
            </ul>
            <Link
              href="/profile"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
            >
              Go to Profile to complete
            </Link>
          </div>
        ) : null}
      </div>

      {/* Advanced KYC */}
      <div
        className={[
          "mt-4 rounded-2xl border-2 p-5 shadow-sm transition",
          advancedLocked ? "pointer-events-none border-zinc-200 bg-zinc-100/80 opacity-50" : "",
          !advancedLocked && isAdvancedVerified
            ? "border-emerald-400 bg-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/60"
            : "",
          !advancedLocked && !isAdvancedVerified
            ? "border-amber-200 bg-amber-50/90"
            : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={[
                "text-lg font-bold",
                advancedLocked ? "text-slate-600" : "text-slate-900",
              ].join(" ")}
            >
              Advanced KYC
            </h2>
            {isAdvancedVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Unlocked &amp; Verified
              </span>
            ) : !advancedLocked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900">
                <AlertCircle className="h-3.5 w-3.5" />
                Not Started
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-600">
                Locked
              </span>
            )}
          </div>
        </div>
        <ul
          className={[
            "mt-2 list-inside list-disc text-sm",
            advancedLocked ? "text-slate-500" : isAdvancedVerified ? "text-emerald-900" : "text-slate-700",
          ].join(" ")}
        >
          <li>Full platform access, increased limits</li>
          <li>Complete advanced verification to unlock the full experience</li>
        </ul>

        {isBasicVerified && !isAdvancedVerified ? (
          <button
            type="button"
            disabled={isAdvancedKycLoading}
            onClick={() => void handleStartAdvancedKYC()}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdvancedKycLoading ? "Starting…" : "Start Advanced Verification"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
