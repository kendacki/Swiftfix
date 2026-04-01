"use server";

import { buildArtisanSearchQuery } from "@/actions/aiActions";

export type RecommendedArtisan = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  rating: number | null;
  snippet: string | null;
};

/** @deprecated Use RecommendedArtisan */
export type TinyfishArtisan = RecommendedArtisan;

const TINYFISH_ENDPOINT = "https://api.tinyfish.ai/search";

function extractEmail(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function extractPhoneFromText(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.match(/(\+?\d[\d\s().-]{8,}\d)/);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").trim();
}

function normalizeRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0 || value > 5) return null;
  return Math.round(value * 10) / 10;
}

/**
 * Fetches up to 3 artisans via Groq-formatted query + Tinyfish search.
 */
export async function fetchArtisans(
  trade: string,
  location: string,
  options?: { latitude?: number; longitude?: number }
): Promise<RecommendedArtisan[]> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    console.error("Missing TINYFISH_API_KEY in environment variables");
    return [];
  }

  const locationForSearch = (() => {
    const t = location?.trim() || "Lagos";
    if (/nigeria/i.test(t)) return t;
    return `${t}, Nigeria`;
  })();

  let query: string;
  try {
    query = await buildArtisanSearchQuery(trade, locationForSearch, {
      latitude: options?.latitude,
      longitude: options?.longitude,
    });
  } catch {
    query = `Top rated ${trade || "artisan"} in ${locationForSearch} phone number`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(TINYFISH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("TinyFish API error:", response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        name?: string;
        phone?: string;
        snippet?: string;
        rating?: number;
        address?: string;
        location?: string;
        email?: string;
      }>;
    };

    const items = data.results ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const mapped: RecommendedArtisan[] = [];

    for (let index = 0; index < items.length && mapped.length < 3; index++) {
      const item = items[index];
      const name = (item.name || item.title || trade || "Artisan").trim();
      const snippet = item.snippet?.trim() ?? null;

      const phoneFromField = item.phone?.trim() ?? "";
      const phoneFromSnippet = extractPhoneFromText(snippet ?? "") ?? "";
      const phoneNumber = phoneFromField || phoneFromSnippet;

      if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 8) {
        continue;
      }

      const email =
        (typeof item.email === "string" && item.email.includes("@")
          ? item.email.trim()
          : null) || extractEmail(snippet ?? "");

      const address =
        (typeof item.address === "string" && item.address.trim().length > 0
          ? item.address.trim()
          : null) ||
        (typeof item.location === "string" && item.location.trim().length > 0
          ? item.location.trim()
          : null) ||
        null;

      const rating =
        normalizeRating(item.rating) ??
        (() => {
          const m = snippet?.match(/(\d+(?:\.\d+)?)\s*(?:\/5|stars?)/i);
          return m ? normalizeRating(Number(m[1])) : null;
        })();

      mapped.push({
        id: globalThis.crypto.randomUUID(),
        name,
        phoneNumber,
        email,
        address,
        rating,
        snippet,
      });
    }

    return mapped;
  } catch (error) {
    clearTimeout(timeout);
    console.error("TinyFish API fetch error:", error);
    return [];
  }
}
