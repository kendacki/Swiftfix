"use server";

import Groq from "groq-sdk";

export type ArtisanExtraction = {
  trade: string;
  location: string;
  urgency: "High" | "Medium" | "Low";
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function coerceUrgency(value: unknown): ArtisanExtraction["urgency"] {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  if (normalized === "low") return "Low";
  return "Medium";
}

export async function parseArtisanRequest(
  userPrompt: string
): Promise<ArtisanExtraction> {
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
      temperature: 0.1,
      max_tokens: 150,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseContent) as Partial<ArtisanExtraction>;

    const trade =
      typeof parsed.trade === "string" ? parsed.trade.trim() : "Not specified";
    const location =
      typeof parsed.location === "string" && parsed.location.trim().length > 0
        ? parsed.location.trim()
        : "Not specified";
    const urgency = coerceUrgency(parsed.urgency);

    return { trade, location, urgency };
  } catch (error) {
    console.error("Groq AI Error:", error);
    throw new Error("Failed to analyze request. Please try again.");
  }
}

