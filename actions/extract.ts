"use server";

import { Groq } from "groq-sdk";
import type { ArtisanExtraction } from "@/actions/aiActions";
import { coerceUrgency } from "@/lib/urgency";
import type { RecommendedArtisan } from "@/actions/tinyfishActions";

// Initialize Groq outside the function
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type GooglePlaceResult = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  opening_hours?: { open_now?: boolean };
};

type GoogleTextSearchResponse = {
  status: string;
  results?: GooglePlaceResult[];
  error_message?: string;
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

/** Stage 1: operational (when Google sends status), enough reviews, minimum rating. */
function passesHardFilter(p: GooglePlaceResult): boolean {
  if (
    p.business_status != null &&
    p.business_status !== "OPERATIONAL"
  ) {
    return false;
  }
  return (
    (p.user_ratings_total ?? 0) > 3 &&
    (p.rating ?? 0) >= 3.5
  );
}

function mapPlaceToRecommendedArtisan(
  place: GooglePlaceResult,
  parsedData: ArtisanExtraction,
): RecommendedArtisan {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.place_id)}`;
  const rating = typeof place.rating === "number" ? place.rating : null;
  const openNow = place.opening_hours?.open_now;
  const snippetParts: string[] = [];
  if (openNow === true) snippetParts.push("Open now");
  else if (openNow === false) snippetParts.push("Closed now");
  snippetParts.push("Google Places · vetted");

  return {
    id: place.place_id,
    name: place.name,
    companyName: place.name,
    trade: parsedData.trade,
    phoneNumber: "",
    email: null,
    address: place.formatted_address ?? null,
    rating,
    snippet: snippetParts.join(" · "),
    isOpen: openNow ?? null,
    mapsUrl,
    source: "google_places",
  };
}

function orderPlacesByIdOrder(
  places: GooglePlaceResult[],
  ids: string[],
): GooglePlaceResult[] {
  const byId = new Map(places.map((p) => [p.place_id, p]));
  const ordered: GooglePlaceResult[] = [];
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

    // FAILSAFE: AI models often wrap JSON in ```json ... ``` markdown. We must strip this before parsing.
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

    console.log("🟢 [STEP 6] Searching Google Places API...");

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_PLACES_API_KEY environment variable.");
    }

    const searchQuery = `${parsedData.trade} in ${parsedData.location}, Lagos, Nigeria`;
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    const placesRes = await fetch(placesUrl, { next: { revalidate: 3600 } });
    const placesData = (await placesRes.json()) as GoogleTextSearchResponse;

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      console.error("🚨 Google API Error:", placesData);
      throw new Error("Failed to fetch results from Google.");
    }

    console.log(
      `🟢 [STEP 7] Found ${placesData.results?.length || 0} raw businesses on Google.`,
    );

    // STAGE 1: Hard filter
    const validPlaces = (placesData.results || []).filter(passesHardFilter);

    console.log(
      `🟢 [STEP 7a] After hard filter (OPERATIONAL, reviews>3, rating≥3.5): ${validPlaces.length} candidates.`,
    );

    let finalPlaces: GooglePlaceResult[] = validPlaces;

    // Skip Stage 2 if 3 or fewer survivors (save tokens)
    if (validPlaces.length > 3) {
      console.log(
        "🟢 [STEP 7b] Too many candidates. Engaging Groq for AI vetting...",
      );

      const candidates: VettingCandidate[] = validPlaces
        .slice(0, 10)
        .map((p) => ({
          id: p.place_id,
          name: p.name,
          rating: p.rating,
          reviews: p.user_ratings_total ?? 0,
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

        finalPlaces = orderPlacesByIdOrder(validPlaces, winningIds);

        if (finalPlaces.length === 0) {
          console.warn(
            "🚨 Groq vetting returned no matching IDs; falling back to top 3 from Stage 1.",
          );
          finalPlaces = validPlaces.slice(0, 3);
        } else {
          finalPlaces = finalPlaces.slice(0, 3);
        }
      } catch (e) {
        console.error(
          "🚨 Groq vetting parsing failed, falling back to top 3.",
          e,
        );
        finalPlaces = validPlaces.slice(0, 3);
      }
    } else {
      finalPlaces = validPlaces.slice(0, 3);
    }

    console.log(`🟢 [STEP 7c] Final vetted artisans: ${finalPlaces.length}`);

    const artisans: RecommendedArtisan[] = finalPlaces.map((place) =>
      mapPlaceToRecommendedArtisan(place, parsedData),
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
