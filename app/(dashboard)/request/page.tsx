"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Timer,
  Wrench,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { type ArtisanExtraction } from "@/actions/aiActions";
import { extractRequestDetails } from "@/actions/extract";
import type { RecommendedArtisan } from "@/actions/tinyfishActions";
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

type RequestTab = "new_request" | "bookings";

type ActiveBookingPayload = {
  trade?: string;
  companyName: string;
  phone: string;
};

export default function RequestPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>("new_request");
  const [activeBooking, setActiveBooking] = useState<ActiveBookingPayload | null>(
    null,
  );
  const [isCopied, setIsCopied] = useState(false);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [remoteBookingsLoaded, setRemoteBookingsLoaded] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ArtisanExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artisans, setArtisans] = useState<RecommendedArtisan[]>([]);
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null);

  const { ready, authenticated, user, login } = usePrivy();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("swiftfix_active_booking");
      if (stored) {
        setActiveBooking(JSON.parse(stored) as ActiveBookingPayload);
      }
    } catch {
      /* ignore invalid JSON */
    }
  }, []);

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

  const handleCopyNumber = () => {
    if (activeBooking?.phone) {
      void navigator.clipboard.writeText(activeBooking.phone);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleBookNowClick = async (artisan: RecommendedArtisan) => {
    const assigned = await handleBook(artisan);
    if (!assigned) return;

    const payload: ActiveBookingPayload = {
      trade: (artisan.trade ?? result?.trade ?? "Service").trim(),
      companyName: artisan.companyName ?? artisan.name,
      phone: artisan.phoneNumber?.trim() ?? "",
    };
    localStorage.setItem("swiftfix_active_booking", JSON.stringify(payload));
    setActiveBooking(payload);
    setActiveTab("bookings");
  };

  const bookingsWithoutActiveDuplicate = useMemo(() => {
    if (!activeBooking?.phone) return bookings;
    const a = activeBooking.phone.replace(/\D/g, "");
    if (!a) return bookings;
    return bookings.filter(
      (b) => b.phoneNumber.replace(/\D/g, "") !== a,
    );
  }, [bookings, activeBooking]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setArtisans([]);

    setServiceRequestId(null);

    if (!prompt.trim()) return;

    if (!ready || !authenticated || !user?.id) {
      setError("Please sign in to find and book artisans.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const extraction = await extractRequestDetails(prompt);
      if (!extraction.success) {
        throw new Error(extraction.error ?? "Analysis failed");
      }

      const extracted = extraction.data;
      const dbArtisans = extraction.artisans;

      const resolved = await resolveSearchLocation(extracted.location);

      const { id: newRequestId } = await createServiceRequest(user.id, {
        trade: extracted.trade,
        location: resolved.text,
        urgency: extracted.urgency,
        originalPrompt: prompt.trim(),
      });
      setServiceRequestId(newRequestId);
      setResult(extracted);
      setArtisans(dbArtisans);
    } catch (error) {
      console.error("GROQ EXTRACTION ERROR:", error);
      setError(
        "Sorry—something went wrong while analyzing your request. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
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
            Live Google Maps listings (via SerpApi) appear below (up to three).
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
                Top vetted matches for your trade and area (up to three).
              </div>
            </div>
          </div>

          {!isAnalyzing && artisans.length === 0 ? (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm leading-relaxed text-zinc-700">
              No artisans found in this area.
            </div>
          ) : !isAnalyzing && artisans.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {artisans.map((artisan) => {
                const tradeLabel =
                  (artisan.trade ?? result?.trade ?? "").trim().toUpperCase() ||
                  "SERVICE";
                const displayName = artisan.companyName ?? artisan.name;
                const badge =
                  artisan.isOpen === true
                    ? {
                        label: "Open now",
                        className:
                          "border-emerald-200 bg-emerald-50 text-emerald-800",
                      }
                    : artisan.isOpen === false
                      ? {
                          label: "Closed",
                          className:
                            "border-amber-200 bg-amber-50 text-amber-900",
                        }
                      : {
                          label: "Google",
                          className:
                            "border-blue-200 bg-blue-50 text-blue-800",
                        };
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
                          {displayName}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                            {artisan.address ?? result.location ?? "Local area"}
                          </span>
                          {artisan.rating != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                              {artisan.rating.toFixed(1)} / 5
                            </span>
                          ) : null}
                          {artisan.phoneNumber.trim() ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              {artisan.phoneNumber}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Phone not listed</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={[
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                          badge.className,
                        ].join(" ")}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleBookNowClick(artisan)}
                      className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:w-auto"
                    >
                      <Phone className="h-4 w-4" />
                      Book Now
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
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

          {activeBooking && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {activeBooking.trade || "SERVICE EXPERT"}
                </span>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-700">
                  Just Assigned
                </span>
              </div>

              <h3 className="mt-2 text-lg font-bold text-gray-900">
                {activeBooking.companyName}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Assigned Just Now</span>
                </div>
                {activeBooking.phone ? (
                  <div className="flex items-center gap-1.5 font-medium text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{activeBooking.phone}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {activeBooking.phone ? (
                  <a
                    href={`tel:${activeBooking.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2 rounded-lg bg-[#0b9e84] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#09806a]"
                  >
                    <Phone className="h-4 w-4" />
                    Call Artisan
                  </a>
                ) : (
                  <span className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-500">
                    No Phone Available
                  </span>
                )}

                {activeBooking.phone ? (
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {isCopied ? "Number Copied!" : "Copy Number"}
                  </button>
                ) : null}
              </div>
            </div>
          )}

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
          ) : bookingsLoading &&
            bookingsWithoutActiveDuplicate.length === 0 &&
            !activeBooking ? (
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
          ) : bookingsWithoutActiveDuplicate.length === 0 && !activeBooking ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm">
              No bookings yet. Start a new request and use{" "}
              <span className="font-semibold text-zinc-800">Book &amp; Call</span>{" "}
              to save one here.
            </div>
          ) : (
            <div className="grid gap-4">
              {bookingsWithoutActiveDuplicate.map((b) => {
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

    </div>
  );
}
