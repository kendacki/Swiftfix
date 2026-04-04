"use server";

import { Groq } from "groq-sdk";
import { coerceUrgency } from "@/lib/urgency";

// Initialize the Groq client. It automatically picks up process.env.GROQ_API_KEY
const groq = new Groq();

export type ArtisanExtraction = {
  trade: string;
  location: string;
  urgency: "High" | "Medium" | "Low";
};

export async function parseArtisanRequest(
  userPrompt: string
): Promise<ArtisanExtraction> {
  const fallback: ArtisanExtraction = {
    trade: "General",
    location: "Unknown",
    urgency: "Medium",
  };

  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

  // 1) Groq call
  let responseContent = "{}";
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a premium artisan booking app called SwiftFix.
Your job is to extract exactly three pieces of information from the user's request:
1. "trade": The type of artisan needed (e.g., Plumber, Electrician, AC Technician, Mechanic).
2. "location": The specific location mentioned (e.g., Yaba, Lekki, Ikeja). If none is mentioned, return "Not specified".
3. "urgency": Assess the urgency as "High", "Medium", or "Low" based on the phrasing.

You MUST return the output strictly as a valid JSON object with the keys: "trade", "location", "urgency".
Do not include any markdown formatting, backticks, or conversational text. Just the raw JSON object.`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "openai/gpt-oss-120b", // Swap to "llama3-70b-8192" if Groq rejects this model name
      stream: false,
      temperature: 0.1,
      max_tokens: 150,
    });

    responseContent = chatCompletion.choices[0]?.message?.content || "{}";
  } catch (error) {
    console.error("Groq extraction failed:", error);
    return fallback;
  }

  // 2) Parse Groq JSON output
  try {
    const parsed = JSON.parse(responseContent) as Partial<ArtisanExtraction>;

    const trade =
      typeof parsed.trade === "string" ? parsed.trade.trim() : fallback.trade;
    const location =
      typeof parsed.location === "string" && parsed.location.trim().length > 0
        ? parsed.location.trim()
        : fallback.location;
    const urgency = coerceUrgency(parsed.urgency);

    return { trade, location, urgency };
  } catch (error) {
    console.error("Tinyfish parse failed:", error);
    return fallback;
  }
}

export async function buildArtisanSearchQuery(
  trade: string,
  location: string,
  options?: { latitude?: number; longitude?: number }
): Promise<string> {
  const safeTrade = trade?.trim() || "artisan services";
  const safeLocation = location?.trim() || "Lagos, Nigeria";

  try {
    const coordLine =
      options?.latitude != null && options?.longitude != null
        ? `GPS coordinates (use to refine locality): ${options.latitude}, ${options.longitude}`
        : "";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You write ONE line of plain text: a highly specific web search query to find real local businesses in Nigeria (Google Maps / business directories) that list phone numbers.
Rules:
- Output ONLY the query string. No quotes, markdown, JSON, or explanation.
- Include trade/service + place names. Prefer "near [area]" phrasing when helpful.`,
        },
        {
          role: "user",
          content: [
            `Trade/service: ${safeTrade}`,
            `Location context: ${safeLocation}`,
            coordLine,
            "Return the single best search query.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.15,
      max_tokens: 120,
    });

    const raw = chatCompletion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length < 8) {
      throw new Error("Query too short");
    }

    return cleaned.slice(0, 400);
  } catch (error) {
    console.error("Groq search query error:", error);
    const coord =
      options?.latitude != null && options?.longitude != null
        ? ` near ${options.latitude},${options.longitude}`
        : "";
    return `Top rated ${safeTrade} in ${safeLocation} Nigeria phone number contact${coord}`.slice(
      0,
      400
    );
  }
}

