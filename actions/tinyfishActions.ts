"use server";

export type TinyfishArtisan = {
  name: string;
  phone: string;
  rating: number;
  snippet: string;
};

const TINYFISH_ENDPOINT = "https://api.tinyfish.ai/search";

export async function fetchArtisans(
  trade: string,
  location: string
): Promise<TinyfishArtisan[]> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    console.error("Missing TINYFISH_API_KEY in environment variables");
    return [];
  }

  const resolvedTrade = trade?.trim() || "artisan";
  const resolvedLocation = location?.trim() || "Lagos";
  const query = `Top rated ${resolvedTrade}s in ${resolvedLocation}, Nigeria contact number`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

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
      results?:
        | Array<{
            title?: string;
            name?: string;
            phone?: string;
            snippet?: string;
            rating?: number;
          }>
        | undefined;
    };

    const items = data.results ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.slice(0, 9).map((item, index) => {
      const name = (item.name || item.title || resolvedTrade).trim();

      const phoneFromField = item.phone ?? "";
      const phoneFromSnippet =
        item.snippet?.match(/(\+?\d[\d\s\-]{7,}\d)/)?.[1] ?? "";
      const phone =
        phoneFromField.trim() ||
        phoneFromSnippet.trim() ||
        `+234-000-000-${String(index).padStart(3, "0")}`;

      const snippet =
        item.snippet?.trim() ||
        `Highly rated ${resolvedTrade} in ${resolvedLocation}.`;

      const ratingValue =
        typeof item.rating === "number" && item.rating > 0 && item.rating <= 5
          ? item.rating
          : 4 + (index % 2 === 0 ? 0.5 : 0); // mock rating: 4.0–4.5

      return {
        name,
        phone,
        snippet,
        rating: ratingValue,
      };
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error("TinyFish API fetch error:", error);
    return [];
  }
}

