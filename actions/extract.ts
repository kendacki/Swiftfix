"use server";

import { Groq } from "groq-sdk";
import type { ArtisanExtraction } from "@/actions/aiActions";
import { coerceUrgency } from "@/lib/urgency";
import type { RecommendedArtisan } from "@/actions/tinyfishActions";

// Initialize Groq outside the function
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/** Raw SerpApi `google_local` local_results item */
type SerpLocalResult = {
  position?: number;
  title?: string;
  place_id?: string | number;
  rating?: number;
  reviews?: number;
  address?: string;
  hours?: string;
  type?: string;
  phone?: string;
  phone_number?: string;
  local_phone?: string;
};

type SerpApiResponse = {
  search_metadata?: { status?: string };
  error?: string;
  local_results?: SerpLocalResult[];
};

/** Normalized place for Stage 1 / 2 / UI mapping */
type VettedPlace = {
  id: string;
  name: string;
  formatted_address: string | null;
  rating: number | null;
  user_ratings_total: number;
  /** Present when SerpApi returned a phone (Stage 1 requires it for candidates). */
  phone: string;
  business_status?: string | null;
  opening_hours?: { open_now?: boolean };
};

type VettingCandidate = {
  id: string;
  name: string;
  rating: number | undefined;
  reviews: number;
};

function stripJsonFence(raw: string): string {
  return raw.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function stablePlaceId(r: SerpLocalResult): string {
  if (r.place_id != null && String(r.place_id).length > 0) {
    return String(r.place_id);
  }
  const t = (r.title ?? "place").replace(/\s+/g, " ").trim();
  const pos = r.position ?? 0;
  return `serp-${pos}-${t.slice(0, 48).replace(/[^\w-]+/g, "_")}`;
}

/** Infer open state from SerpApi `hours` string (no Google business_status). */
function inferOpenFromHours(hours?: string): boolean | null {
  if (!hours) return null;
  const h = hours.toLowerCase();
  if (h.includes("permanently closed")) return false;
  if (h.startsWith("open") || h.includes("open 24")) return true;
  if (h.includes("closed") && !h.startsWith("open")) return false;
  return null;
}

function normalizeSerpLocal(
  raw: SerpLocalResult,
): VettedPlace | null {
  const title = raw.title?.trim();
  if (!title) return null;

  const id = stablePlaceId(raw);
  const reviews = typeof raw.reviews === "number" ? raw.reviews : 0;
  const rating = typeof raw.rating === "number" ? raw.rating : null;
  const openNow = inferOpenFromHours(raw.hours);

  const phone =
    typeof raw.phone === "string" ? raw.phone.trim() : "";

  return {
    id,
    name: title,
    formatted_address: raw.address?.trim() ?? null,
    rating,
    user_ratings_total: reviews,
    phone,
    opening_hours:
      openNow === null ? undefined : { open_now: openNow },
  };
}

function mapVettedPlaceToRecommendedArtisan(
  place: VettedPlace,
  parsedData: ArtisanExtraction,
): RecommendedArtisan {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}`;
  const rating = typeof place.rating === "number" ? place.rating : null;
  const openNow = place.opening_hours?.open_now;
  const snippetParts: string[] = [];
  if (openNow === true) snippetParts.push("Open now");
  else if (openNow === false) snippetParts.push("Closed now");
  snippetParts.push("SerpApi · vetted");

  return {
    id: place.id,
    name: place.name,
    companyName: place.name,
    trade: parsedData.trade,
    phoneNumber: place.phone,
    email: null,
    address: place.formatted_address,
    rating,
    snippet: snippetParts.join(" · "),
    isOpen: openNow ?? null,
    mapsUrl,
    source: "serpapi_google_local",
  };
}

function orderPlacesByIdOrder(
  places: VettedPlace[],
  ids: string[],
): VettedPlace[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  const ordered: VettedPlace[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p) ordered.push(p);
  }
  return ordered;
}

export async function extractRequestDetails(promptText: string) {
  console.log("🟢 [STEP 1] Starting extraction for prompt:", promptText);

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from environment variables.");
    }

    console.log("🟢 [STEP 2] Calling Groq API (openai/gpt-oss-120b)...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a data extractor. Extract the Trade, Location, and Urgency from the user's prompt. Return ONLY valid JSON. Do not use markdown formatting.",
        },
        { role: "user", content: promptText },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0, // 0 is required for strict JSON data extraction
      stream: false,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log("🟢 [STEP 3] Raw Groq Response:", rawResponse);

    const cleanedResponse = stripJsonFence(rawResponse);
    console.log(
      "🟢 [STEP 4] Cleaned Response (Ready for Tinyfish):",
      cleanedResponse,
    );

    const parsedRaw = JSON.parse(cleanedResponse);
    console.log("🟢 [STEP 5] Successfully Parsed Data:", parsedRaw);

    const o = parsedRaw as Record<string, unknown>;
    const tradeQ = String(o.Trade ?? o.trade ?? "")
      .trim();
    const locationQ = String(o.Location ?? o.location ?? "")
      .trim();
    const urgency = coerceUrgency(o.Urgency ?? o.urgency);

    const parsedData: ArtisanExtraction = {
      trade: tradeQ || "Not specified",
      location: locationQ || "Not specified",
      urgency,
    };

    console.log("🟢 [STEP 6] Searching Google via SerpApi...");

    // Check for both possible Vercel variable names
    const apiKey = process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY;

    if (!apiKey) {
      console.error(
        "🚨 FATAL: SerpApi key is missing. Available Vercel Variables:",
        Object.keys(process.env)
          .filter((k) => !k.startsWith("npm_"))
          .join(", "),
      );
      throw new Error(
        "Missing SerpApi environment variable. Please check Vercel settings.",
      );
    }

    const searchQuery = `${parsedData.trade} in ${parsedData.location}, Lagos, Nigeria`;
    const serpParams = new URLSearchParams({
      engine: "google_local",
      q: searchQuery,
      api_key: apiKey,
      hl: "en",
      gl: "ng",
      google_domain: "google.com",
    });

    const serpUrl = `https://serpapi.com/search.json?${serpParams.toString()}`;
    const serpRes = await fetch(serpUrl, { next: { revalidate: 3600 } });
    const serpData = (await serpRes.json()) as SerpApiResponse;

    if (serpData.error) {
      console.error("🚨 SerpApi Error:", serpData.error);
      throw new Error("Failed to fetch results from SerpApi.");
    }

    const status = serpData.search_metadata?.status;
    if (status && status !== "Success") {
      console.error("🚨 SerpApi search_metadata.status:", status, serpData);
      throw new Error("SerpApi search did not succeed.");
    }

    const localResults = serpData.local_results ?? [];
    console.log(
      `🟢 [STEP 7] SerpApi returned ${localResults.length} local_results (raw).`,
    );

    console.log(
      "🟢 [STEP 7a] Stage 1: Hard Filtering & Normalizing data...",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SerpApi row shape varies; we normalize phone keys below.
    const validPlaces = localResults.filter((p: any) => {
      const hasGoodReviews = (p.reviews || 0) >= 5;
      const hasGoodRating = (p.rating || 0) >= 3.5;

      // NORMALIZATION: Grab the number whether SerpApi calls it 'phone', 'phone_number', or 'local_phone'
      const normalizedPhone = p.phone || p.phone_number || p.local_phone;

      // Strict check on the normalized variable
      const hasValidPhone =
        typeof normalizedPhone === "string" && normalizedPhone.trim() !== "";

      // If valid, explicitly map it back to 'p.phone' so the UI mapping doesn't break
      if (hasValidPhone) {
        p.phone = normalizedPhone;
      }

      return hasGoodReviews && hasGoodRating && hasValidPhone;
    });

    const normalized: VettedPlace[] = [];
    for (const raw of validPlaces) {
      const n = normalizeSerpLocal(raw as SerpLocalResult);
      if (n) normalized.push(n);
    }

    console.log(
      `🟢 [STEP 7a] After hard filter (reviews≥5, rating≥3.5, phone required): ${normalized.length} candidates.`,
    );

    let finalPlaces: VettedPlace[] = normalized;

    if (normalized.length > 3) {
      console.log(
        "🟢 [STEP 7b] Too many candidates. Engaging Groq for AI vetting...",
      );

      const candidates: VettingCandidate[] = normalized
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          name: p.name,
          rating: p.rating ?? undefined,
          reviews: p.user_ratings_total,
        }));

      const vettingCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an elite Quality Assurance AI for a Nigerian home services app. Analyze this JSON list of businesses. Your job is to select the absolute best 3. Favor businesses with a high trust factor (good rating + high number of reviews). Ignore generic, spammy, or suspicious business names. Return ONLY a valid JSON array of the 3 selected 'id' strings. Do not use markdown.",
          },
          { role: "user", content: JSON.stringify(candidates) },
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0,
        stream: false,
      });

      const rawIds = vettingCompletion.choices[0]?.message?.content || "[]";
      const cleanedIds = stripJsonFence(rawIds);

      try {
        const parsed = JSON.parse(cleanedIds) as unknown;
        const winningIds = Array.isArray(parsed)
          ? parsed.filter((x): x is string => typeof x === "string")
          : [];

        finalPlaces = orderPlacesByIdOrder(normalized, winningIds);

        if (finalPlaces.length === 0) {
          console.warn(
            "🚨 Groq vetting returned no matching IDs; falling back to top 3 from Stage 1.",
          );
          finalPlaces = normalized.slice(0, 3);
        } else {
          finalPlaces = finalPlaces.slice(0, 3);
        }
      } catch (e) {
        console.error(
          "🚨 Groq vetting parsing failed, falling back to top 3.",
          e,
        );
        finalPlaces = normalized.slice(0, 3);
      }
    } else {
      finalPlaces = normalized.slice(0, 3);
    }

    console.log(`🟢 [STEP 7c] Final vetted artisans: ${finalPlaces.length}`);

    const artisans: RecommendedArtisan[] = finalPlaces.map((place) =>
      mapVettedPlaceToRecommendedArtisan(place, parsedData),
    );

    return {
      success: true as const,
      data: parsedData,
      artisans,
    };
  } catch (error: unknown) {
    console.error("🚨 [EXTRACTION FATAL ERROR]:", error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return { success: false as const, error: "Analysis failed. Please try again." };
  }
}
