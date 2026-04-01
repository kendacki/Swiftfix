"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Timer,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { parseArtisanRequest, type ArtisanExtraction } from "@/actions/aiActions";
import {
  fetchArtisans,
  type RecommendedArtisan,
} from "@/actions/tinyfishActions";
import { payArtisan } from "@/actions/paymentActions";
import {
  assignArtisanToRequest,
  createServiceRequest,
} from "@/actions/requestActions";

function urgencyBadgeClasses(urgency: ArtisanExtraction["urgency"]) {
  if (urgency === "High") return "border-red-200 bg-red-50 text-red-700";
  if (urgency === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function urgencyLabel(urgency: ArtisanExtraction["urgency"]) {
  return urgency === "High" ? "High" : urgency === "Medium" ? "Medium" : "Low";
}

function isVagueLocation(location: string): boolean {
  const t = location.trim().toLowerCase();
  return t.length < 2 || t === "not specified" || t === "n/a";
}

function withLocalityHint(location: string): string {
  const t = location.trim();
  if (!t || isVagueLocation(t)) return "Lagos, Nigeria";
  if (/nigeria/i.test(t)) return t;
  if (/lagos|ikeja|lekki|yaba|vi\b|victoria island|surulere|abuja|port harcourt/i.test(t))
    return `${t}, Nigeria`;
  return `${t}, Lagos, Nigeria`;
}

async function resolveSearchLocation(rawLocation: string): Promise<{
  text: string;
  latitude?: number;
  longitude?: number;
}> {
  if (!isVagueLocation(rawLocation)) {
    return { text: withLocalityHint(rawLocation) };
  }

  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ text: "Lagos, Nigeria" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          text: "Lagos, Nigeria",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve({ text: "Lagos, Nigeria" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  if (digits.startsWith("234")) return `tel:+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `tel:+234${digits.slice(1)}`;
  if (digits.length === 10) return `tel:+234${digits}`;
  return `tel:+${digits}`;
}

function InitialsAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
      : (name.slice(0, 2) || "SF").toUpperCase();
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-base font-bold text-white shadow-md ring-4 ring-white">
      {initials}
    </div>
  );
}

function ArtisanSkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-zinc-100 bg-white p-5 shadow-md">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-full bg-zinc-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-zinc-200" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
      </div>
      <div className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-violet-200 to-fuchsia-200" />
    </div>
  );
}

export default function RequestPage() {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ArtisanExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artisans, setArtisans] = useState<RecommendedArtisan[]>([]);
  const [isFetchingArtisans, setIsFetchingArtisans] = useState(false);
  const [artisanFetchFailed, setArtisanFetchFailed] = useState(false);
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null);
  const [selectedArtisan, setSelectedArtisan] =
    useState<RecommendedArtisan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [isPaying, startPaymentTransition] = useTransition();

  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && !isAnalyzing,
    [prompt, isAnalyzing]
  );

  const handleBook = async (artisan: RecommendedArtisan) => {
    if (!serviceRequestId || !user?.id) return;
    try {
      await assignArtisanToRequest(user.id, serviceRequestId, artisan);
    } catch (e) {
      console.error("assignArtisanToRequest:", e);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setArtisans([]);
    setArtisanFetchFailed(false);
    setServiceRequestId(null);

    if (!prompt.trim()) return;

    if (!ready || !authenticated || !user?.id) {
      setError("Please sign in to find and book artisans.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const extracted = await parseArtisanRequest(prompt);

      const resolved = await resolveSearchLocation(extracted.location);

      const { id: newRequestId } = await createServiceRequest(user.id, {
        trade: extracted.trade,
        location: resolved.text,
        urgency: extracted.urgency,
        originalPrompt: prompt.trim(),
      });
      setServiceRequestId(newRequestId);
      setResult(extracted);

      setIsAnalyzing(false);
      setIsFetchingArtisans(true);
      const tinyfishResults = await fetchArtisans(
        extracted.trade,
        resolved.text,
        {
          latitude: resolved.latitude,
          longitude: resolved.longitude,
        }
      );
      setArtisans(tinyfishResults);
      setArtisanFetchFailed(tinyfishResults.length === 0);
    } catch {
      setError(
        "Sorry—something went wrong while analyzing your request. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
      setIsFetchingArtisans(false);
    }
  };

  const openPaymentModal = (artisan: RecommendedArtisan) => {
    setSelectedArtisan(artisan);
    setPaymentAmount("");
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const onConfirmPayment = () => {
    if (!selectedArtisan) return;

    setPaymentError(null);
    setPaymentSuccess(null);

    if (!ready || !authenticated || !user?.id) {
      setPaymentError("Please sign in to complete payment.");
      return;
    }

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid amount to pay.");
      return;
    }

    startPaymentTransition(async () => {
      try {
        await payArtisan(user.id, selectedArtisan.name, amount);
        setPaymentSuccess("Payment completed successfully.");
        setTimeout(() => {
          setIsPaymentModalOpen(false);
          router.push("/transactions");
        }, 800);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Payment failed. Please try again.";
        setPaymentError(message);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Request</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tell us what needs fixing—SwiftFix will extract the essentials and recommend artisans.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-zinc-800">
              What do you need fixing today?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., I need a generator mechanic in Yaba"
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
            />
            <div className="mt-2 text-xs text-zinc-500">
              We’ll automatically extract Trade, Location, and Urgency. If your area is vague, we may ask your browser for location to improve matches.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
                canSubmit
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-500",
              ].join(" ")}
            >
              <Sparkles className="h-4 w-4" />
              {isAnalyzing ? "Analyzing your request..." : "Find Artisan"}
            </button>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Timer className="h-4 w-4" />
              Response is instant once we finish parsing your prompt.
            </div>
          </div>

          {isAnalyzing ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Analyzing your request...
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Extracting trade, location, and urgency with precision.
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full w-1/2 animate-pulse bg-zinc-900" />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>
      </form>

      {result ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Request Parsed
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                We extracted the exact parameters below.
              </div>
            </div>

            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                urgencyBadgeClasses(result.urgency),
              ].join(" ")}
            >
              <Timer className="h-4 w-4" />
              Urgency: {urgencyLabel(result.urgency)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <Wrench className="h-4 w-4" />
                Trade
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-900">
                {result.trade || "Not specified"}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-900">
                {result.location || "Not specified"}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <Timer className="h-4 w-4" />
                Urgency
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-900">
                {result.urgency}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Recommended artisans load below from live local listings.
          </div>
        </div>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Recommended Artisans
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Top matches for your trade and area (up to three).
              </div>
            </div>
          </div>

          {isFetchingArtisans ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <ArtisanSkeletonCard key={i} />
              ))}
            </div>
          ) : artisanFetchFailed ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm leading-relaxed text-amber-950">
              We couldn&apos;t find available artisans in that exact area right now. Try
              expanding your search location!
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {artisans.map((artisan) => {
                const tel = phoneToTelHref(artisan.phoneNumber);
                return (
                  <article
                    key={artisan.id}
                    className="flex h-full flex-col rounded-xl border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <InitialsAvatar name={artisan.name} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-tight text-zinc-900">
                          {artisan.name}
                        </h3>
                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-zinc-500">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="line-clamp-2">
                            {artisan.address ?? result.location ?? "Local area"}
                          </span>
                        </div>
                        {artisan.rating != null ? (
                          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {artisan.rating.toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                      <a
                        href={tel}
                        className="flex items-center gap-2 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">{artisan.phoneNumber}</span>
                      </a>
                      {artisan.email ? (
                        <a
                          href={`mailto:${artisan.email}`}
                          className="flex items-center gap-2 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                          <span className="truncate">{artisan.email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span>No email listed</span>
                        </div>
                      )}
                    </div>

                    {artisan.snippet ? (
                      <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-zinc-500">
                        {artisan.snippet}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="mt-5 flex flex-col gap-2">
                      <a
                        href={tel}
                        onClick={(e) => {
                          e.preventDefault();
                          void (async () => {
                            await handleBook(artisan);
                            window.location.href = tel;
                          })();
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
                      >
                        <Phone className="h-4 w-4" />
                        Book &amp; Call
                      </a>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(artisan)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Book &amp; Pay
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {isPaymentModalOpen && selectedArtisan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">
                  Book &amp; Pay
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  You are about to pay{" "}
                  <span className="font-semibold">{selectedArtisan.name}</span>.
                </div>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-zinc-700">
                Amount to Pay (₦)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter agreed amount"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            {paymentError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {paymentError}
              </div>
            ) : null}

            {paymentSuccess ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                {paymentSuccess}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onConfirmPayment}
              disabled={isPaying}
              className={[
                "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
                isPaying
                  ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                  : "bg-zinc-900 text-white hover:bg-zinc-800",
              ].join(" ")}
            >
              {isPaying ? "Processing Payment..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
