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
  opening_hours?: { open_now?: boolean };
};

type GoogleTextSearchResponse = {
  status: string;
  results?: GooglePlaceResult[];
  error_message?: string;
};

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
  snippetParts.push("Google Places");

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
    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
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
      `🟢 [STEP 7] Found ${placesData.results?.length || 0} businesses on Google.`,
    );

    const artisans: RecommendedArtisan[] = (placesData.results || [])
      .slice(0, 3)
      .map((place) => mapPlaceToRecommendedArtisan(place, parsedData));

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
