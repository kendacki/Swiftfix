import { NextResponse } from "next/server";
import { updateUserKYCTier } from "@/actions/privy";

type KycWebhookBody = {
  userId?: string;
  verificationStatus?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KycWebhookBody;

    // TODO: Verify the cryptographic signature from the KYC provider to ensure this request isn't faked.

    const userId = body.userId;
    const verificationStatus = body.verificationStatus;

    if (verificationStatus === "APPROVED") {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Missing userId" },
          { status: 400 },
        );
      }
      const result = await updateUserKYCTier(userId, "ADVANCED");
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("KYC webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid payload or server error" },
      { status: 400 },
    );
  }
}
