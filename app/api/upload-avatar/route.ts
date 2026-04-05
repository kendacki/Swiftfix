import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy-server";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "Server is not configured for file uploads (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  let userId: string;
  try {
    const privy = getPrivy();
    const claims = await privy.verifyAuthToken(token);
    userId = claims.userId;
  } catch {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 5MB)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const pathname = `avatars/${userId}/${Date.now()}-${safeName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await put(pathname, buffer, {
      access: "public",
      token: blobToken,
      contentType: file.type || "application/octet-stream",
    });
    return NextResponse.json({ url: uploaded.url });
  } catch (e) {
    console.error("Blob upload error:", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
