"use client";

import { useMemo, useState, useTransition } from "react";
import { MapPin, Phone, Sparkles, Star, Timer, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { parseArtisanRequest, type ArtisanExtraction } from "@/actions/aiActions";
import {
  fetchArtisans,
  type TinyfishArtisan,
} from "@/actions/tinyfishActions";
import { payArtisan } from "@/actions/paymentActions";

function urgencyBadgeClasses(urgency: ArtisanExtraction["urgency"]) {
  if (urgency === "High") return "border-red-200 bg-red-50 text-red-700";
  if (urgency === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function urgencyLabel(urgency: ArtisanExtraction["urgency"]) {
  return urgency === "High" ? "High" : urgency === "Medium" ? "Medium" : "Low";
}

export default function RequestPage() {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ArtisanExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artisans, setArtisans] = useState<TinyfishArtisan[]>([]);
  const [isFetchingArtisans, setIsFetchingArtisans] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<TinyfishArtisan | null>(null);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setArtisans([]);

    if (!prompt.trim()) return;

    try {
      setIsAnalyzing(true);
      const extracted = await parseArtisanRequest(prompt);
      setResult(extracted);

      setIsFetchingArtisans(true);
      const tinyfishResults = await fetchArtisans(
        extracted.trade,
        extracted.location
      );
      setArtisans(tinyfishResults);
    } catch {
      setError(
        "Sorry—something went wrong while analyzing your request. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
      setIsFetchingArtisans(false);
    }
  };

  const openPaymentModal = (artisan: TinyfishArtisan) => {
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
              We’ll automatically extract Trade, Location, and Urgency.
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
            Next: we’ll search your area and show recommended artisans.
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
                Curated professionals based on your request.
              </div>
            </div>
          </div>

          {isFetchingArtisans ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="min-h-[120px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="h-4 w-2/3 rounded bg-zinc-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-zinc-200" />
                  <div className="mt-4 h-3 w-full rounded bg-zinc-200" />
                  <div className="mt-4 h-9 w-full rounded-xl bg-zinc-200" />
                </div>
              ))}
            </div>
          ) : artisans.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              No artisans found yet. Try refining your trade or location in the prompt.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artisans.map((artisan) => (
                <article
                  key={`${artisan.name}-${artisan.phone}`}
                  className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {artisan.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{artisan.rating.toFixed(1)}</span>
                      <span className="text-zinc-400">•</span>
                      <span>Top rated {result.trade || "artisan"}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-600">
                      {artisan.snippet}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        alert(`Contact ${artisan.name}: ${artisan.phone}`)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Contact Now
                    </button>

                    <button
                      type="button"
                      onClick={() => openPaymentModal(artisan)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Book &amp; Pay
                    </button>
                  </div>
                </article>
              ))}
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

