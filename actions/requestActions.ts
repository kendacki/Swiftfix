"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { RecommendedArtisan } from "@/actions/tinyfishActions";

export async function getUserBookings(privyId: string) {
  if (!privyId?.trim()) {
    throw new Error("Missing user.");
  }

  const user = await prisma.user.findUnique({ where: { privyId } });
  if (!user) throw new Error("User not found.");

  return prisma.serviceRequest.findMany({
    where: {
      userId: user.id,
      status: { in: ["ASSIGNED", "COMPLETED"] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createServiceRequest(
  privyId: string,
  data: {
    trade: string;
    location: string;
    urgency: string;
    originalPrompt?: string;
  }
) {
  if (!privyId) throw new Error("Missing user.");

  const user = await prisma.user.findUnique({ where: { privyId } });
  if (!user) throw new Error("User not found.");

  const created = await prisma.serviceRequest.create({
    data: {
      userId: user.id,
      trade: data.trade,
      location: data.location,
      urgency: data.urgency,
      originalPrompt: data.originalPrompt ?? null,
      status: "OPEN",
    },
  });

  return { id: created.id };
}

export async function assignArtisanToRequest(
  privyId: string,
  requestId: string,
  artisan: RecommendedArtisan
) {
  if (!privyId || !requestId) throw new Error("Missing booking details.");

  const user = await prisma.user.findUnique({ where: { privyId } });
  if (!user) throw new Error("User not found.");

  const existing = await prisma.serviceRequest.findFirst({
    where: { id: requestId, userId: user.id },
  });
  if (!existing) throw new Error("Request not found.");

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: "ASSIGNED",
      assignedArtisanId: artisan.id,
      assignedArtisanJson: {
        id: artisan.id,
        name: artisan.name,
        phoneNumber: artisan.phoneNumber,
        email: artisan.email,
        address: artisan.address,
        rating: artisan.rating,
        snippet: artisan.snippet,
        ...(artisan.mapsUrl != null ? { mapsUrl: artisan.mapsUrl } : {}),
        ...(artisan.trade != null ? { trade: artisan.trade } : {}),
        ...(artisan.source != null ? { source: artisan.source } : {}),
      },
    },
  });

  revalidatePath("/request");
}
