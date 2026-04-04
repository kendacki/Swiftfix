import type { ArtisanExtraction } from "@/actions/aiActions";

export function coerceUrgency(
  value: unknown,
): ArtisanExtraction["urgency"] {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  if (normalized === "low") return "Low";
  return "Medium";
}
