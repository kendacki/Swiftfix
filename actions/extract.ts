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

/** Maps `ServiceRequest.assignedArtisanJson` (see requestActions) to RecommendedArtisan. */
function assignedArtisanJsonToRecommended(
  json: Prisma.JsonValue | null | undefined,
): RecommendedArtisan | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const j = json as Record<string, unknown>;
  const id = typeof j.id === "string" ? j.id : "";
  const name = typeof j.name === "string" ? j.name : "Artisan";
  const phoneNumber = typeof j.phoneNumber === "string" ? j.phoneNumber : "";
  if (!id || !phoneNumber) return null;
  return {
    id,
    name,
    phoneNumber,
    email: typeof j.email === "string" ? j.email : null,
    address: typeof j.address === "string" ? j.address : null,
    rating: typeof j.rating === "number" ? j.rating : null,
    snippet: typeof j.snippet === "string" ? j.snippet : null,
  };
}

/**
 * Fallback when `Artisan` table is missing (P2021) or empty: use prior bookings that
 * match trade/location and have `assignedArtisanJson` populated.
 * Schema: model ServiceRequest { trade, location, assignedArtisanJson, ... }
 */
async function findArtisansFromServiceRequests(
  tradeQ: string,
  locationQ: string,
): Promise<RecommendedArtisan[]> {
  if (!tradeQ && !locationQ) return [];

  const where: Prisma.ServiceRequestWhereInput = {
    assignedArtisanJson: { not: Prisma.DbNull },
  };
  if (tradeQ) {
    where.trade = { contains: tradeQ, mode: "insensitive" };
  }
  if (locationQ) {
    where.location = { contains: locationQ, mode: "insensitive" };
  }

  const rows = await prisma.serviceRequest.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  const seen = new Set<string>();
  const out: RecommendedArtisan[] = [];
  for (const r of rows) {
    const rec = assignedArtisanJsonToRecommended(r.assignedArtisanJson);
    if (!rec || seen.has(rec.id)) continue;
    seen.add(rec.id);
    out.push(rec);
    if (out.length >= 3) break;
  }
  return out;
}

/**
 * Optional catalog table `Artisan` (see schema). Fails with P2021 until migration is applied.
 */
async function findArtisansFromCatalog(
  tradeQ: string,
  locationQ: string,
): Promise<RecommendedArtisan[]> {
  const where: Prisma.ArtisanWhereInput = {};
  if (tradeQ) {
    where.trade = { contains: tradeQ, mode: "insensitive" };
  }
  if (locationQ) {
    where.location = { contains: locationQ, mode: "insensitive" };
  }
  if (Object.keys(where).length === 0) return [];

  const rows = await prisma.artisan.findMany({
    where,
    take: 3,
  });
  return rows.map(toRecommendedArtisan);
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

    // Schema (prisma/schema.prisma): model Artisan { trade, location, name, phoneNumber, ... }
    // User has no trade/location — use prisma.artisan, not prisma.user.
    console.log("🟢 [STEP 6] Searching Database for matches...");

    let artisans: RecommendedArtisan[] = [];
    const hasSearch = Boolean(tradeQ || locationQ);

    if (hasSearch) {
      try {
        // Case-insensitive contains on trade + location (see findArtisansFromCatalog)
        artisans = await findArtisansFromCatalog(tradeQ, locationQ);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2021"
        ) {
          console.warn(
            "[STEP 6] Artisan catalog table missing (P2021); falling back to ServiceRequest.assignedArtisanJson.",
          );
        } else {
          throw err;
        }
      }

      if (artisans.length === 0) {
        artisans = await findArtisansFromServiceRequests(tradeQ, locationQ);
      }
    }

    console.log(`🟢 [STEP 7] Found ${artisans.length} Artisans.`);

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
