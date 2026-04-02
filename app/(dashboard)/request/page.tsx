"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Calendar,
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

export type UserBooking = {
  id: string;
  trade: string;
  date: string;
  artisanName: string;
  phoneNumber: string;
  status: string;
};

/**
 * Mock bookings loader — replace with a real API when ready.
 */
async function fetchUserBookings(userId: string): Promise<UserBooking[]> {
  await new Promise((r) => setTimeout(r, 450));
  if (!userId) return [];
  return [
    {
      id: "mock-1",
      trade: "Plumber",
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      artisanName: "Ade & Sons Plumbing",
      phoneNumber: "08012345678",
      status: "COMPLETED",
    },
    {
      id: "mock-2",
      trade: "Electrician",
      date: new Date(Date.now() - 9 * 86400000).toISOString(),
      artisanName: "BrightWire Electricals",
      phoneNumber: "08098765432",
      status: "ASSIGNED",
    },
  ];
}

function formatBookingDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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

type RequestTab = "new_request" | "bookings";

export default function RequestPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>("new_request");
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [remoteBookingsLoaded, setRemoteBookingsLoaded] = useState(false);

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

  const { ready, authenticated, user, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    setRemoteBookingsLoaded(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "bookings" || !ready || !authenticated || !user?.id) return;
    if (remoteBookingsLoaded) return;

    let cancelled = false;
    setBookingsLoading(true);
    void fetchUserBookings(user.id)
      .then((remote) => {
        if (cancelled) return;
        setBookings((prev) => {
          const local = prev.filter((b) => b.id.startsWith("local-"));
          return [...local, ...remote];
        });
      })
      .catch((err) => {
        console.error("fetchUserBookings:", err);
      })
      .finally(() => {
        if (cancelled) return;
        setRemoteBookingsLoaded(true);
        setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, ready, authenticated, user?.id, remoteBookingsLoaded]);

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && !isAnalyzing,
    [prompt, isAnalyzing]
  );

  const handleBook = async (artisan: RecommendedArtisan): Promise<boolean> => {
    if (!serviceRequestId || !user?.id) return false;
    try {
      await assignArtisanToRequest(user.id, serviceRequestId, artisan);
      return true;
    } catch (e) {
      console.error("assignArtisanToRequest:", e);
      return false;
    }
  };

  const appendLocalBooking = (artisan: RecommendedArtisan) => {
    const entry: UserBooking = {
      id: `local-${globalThis.crypto.randomUUID()}`,
      trade: result?.trade?.trim() || "Service",
      date: new Date().toISOString(),
      artisanName: artisan.name,
      phoneNumber: artisan.phoneNumber,
      status: "ASSIGNED",
    };
    setBookings((prev) => [entry, ...prev]);
  };

  const onBookAndCall = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    artisan: RecommendedArtisan,
    tel: string
  ) => {
    e.preventDefault();
    const assigned = await handleBook(artisan);
    if (assigned) appendLocalBooking(artisan);
    window.location.href = tel;
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
    } catch (error) {
      console.error("GROQ EXTRACTION ERROR:", error);
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

      <div
        className="inline-flex w-full rounded-full border border-zinc-200 bg-zinc-100/80 p-1 shadow-inner sm:w-auto"
        role="tablist"
        aria-label="Request sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "new_request"}
          onClick={() => setActiveTab("new_request")}
          className={[
            "min-w-0 flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none",
            activeTab === "new_request"
              ? "bg-zinc-900 text-white shadow-md"
              : "bg-transparent text-zinc-600 hover:text-zinc-900",
          ].join(" ")}
        >
          New Request
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "bookings"}
          onClick={() => setActiveTab("bookings")}
          className={[
            "min-w-0 flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none",
            activeTab === "bookings"
              ? "bg-zinc-900 text-white shadow-md"
              : "bg-transparent text-zinc-600 hover:text-zinc-900",
          ].join(" ")}
        >
          My Bookings
        </button>
      </div>

      {activeTab === "new_request" ? (
        <>
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
                const tradeLabel = (result?.trade ?? "").trim().toUpperCase() || "SERVICE";
                const matchScore =
                  artisan.rating != null
                    ? Math.max(0, Math.min(100, Math.round((artisan.rating / 5) * 100)))
                    : 78;
                const badgeClass =
                  matchScore >= 85
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : matchScore >= 70
                      ? "border-violet-200 bg-violet-50 text-violet-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700";
                return (
                  <article
                    key={artisan.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {tradeLabel}
                        </div>
                        <div className="mt-1 text-base font-bold text-zinc-900">
                          {artisan.name}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                            {artisan.address ?? result.location ?? "Local area"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            {artisan.phoneNumber}
                          </span>
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                          badgeClass,
                        ].join(" ")}
                      >
                        {matchScore}% Match
                      </span>
                    </div>

                    <a
                      href={tel}
                      onClick={(e) => void onBookAndCall(e, artisan, tel)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:w-auto"
                    >
                      <Phone className="h-4 w-4" />
                      Book Now
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
        </>
      ) : null}

      {activeTab === "bookings" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900">My Bookings</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Past requests and who you booked—call again anytime.
            </p>
          </div>

          {!ready ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
              Loading…
            </div>
          ) : !authenticated ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
              <p className="text-sm font-medium text-zinc-800">
                Log in to see your past bookings.
              </p>
              <button
                type="button"
                onClick={() => login()}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Log in
              </button>
            </div>
          ) : bookingsLoading && bookings.length === 0 ? (
            <div className="grid gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
                >
                  <div className="h-4 w-1/3 rounded bg-zinc-200" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-zinc-100" />
                  <div className="mt-4 h-10 w-full rounded-xl bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm">
              No bookings yet. Start a new request and use{" "}
              <span className="font-semibold text-zinc-800">Book &amp; Call</span>{" "}
              to save one here.
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((b) => {
                const tel = phoneToTelHref(b.phoneNumber);
                return (
                  <article
                    key={b.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-md transition hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {b.trade}
                        </div>
                        <div className="mt-1 text-base font-bold text-zinc-900">
                          {b.artisanName}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            {formatBookingDate(b.date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            {b.phoneNumber}
                          </span>
                        </div>
                      </div>
                      <span
                        className={[
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                          b.status === "ASSIGNED"
                            ? "border-violet-200 bg-violet-50 text-violet-800"
                            : b.status === "COMPLETED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700",
                        ].join(" ")}
                      >
                        {b.status}
                      </span>
                    </div>
                    <a
                      href={tel}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:w-auto"
                    >
                      <Phone className="h-4 w-4" />
                      Call Again
                    </a>
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
