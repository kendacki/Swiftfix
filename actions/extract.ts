"use server";

import { Prisma } from "@prisma/client";
import { Groq } from "groq-sdk";
import type { ArtisanExtraction } from "@/actions/aiActions";
import { coerceUrgency } from "@/lib/urgency";
import type { RecommendedArtisan } from "@/actions/tinyfishActions";
import { prisma } from "@/lib/prisma";

// Initialize Groq outside the function
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function toRecommendedArtisan(row: {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  rating: number | null;
  snippet: string | null;
}): RecommendedArtisan {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phoneNumber,
    email: row.email,
    address: row.address,
    rating: row.rating,
    snippet: row.snippet,
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

    // Schema: model Artisan { trade, location, ... } — client delegate prisma.artisan
    console.log("🟢 [STEP 6] Searching Database for matches...");

    const where: Prisma.ArtisanWhereInput = {};
    if (tradeQ) {
      where.trade = { contains: tradeQ, mode: "insensitive" };
    }
    if (locationQ) {
      where.location = { contains: locationQ, mode: "insensitive" };
    }

    const matchedArtisans =
      Object.keys(where).length === 0
        ? []
        : await prisma.artisan.findMany({
            where,
            take: 3,
          });

    console.log(`🟢 [STEP 7] Found ${matchedArtisans.length} Artisans.`);

    const artisans = matchedArtisans.map(toRecommendedArtisan);

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(
        "🚨 [Prisma] code:",
        error.code,
        "meta:",
        JSON.stringify(error.meta),
      );
    }
    return { success: false as const, error: "Analysis failed. Please try again." };
  }
}
