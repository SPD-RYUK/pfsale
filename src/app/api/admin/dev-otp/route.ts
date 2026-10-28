// GET /api/admin/dev-otp — DEV ONLY.
// Returns the current 6-digit TOTP for the seeded admin so the panel is testable
// without a real authenticator app. Hard-gated on NODE_ENV !== "production".
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devCurrentOtp, ADMIN_EMAIL } from "@/lib/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const admin = await db.adminUser.findUnique({
      where: { email: ADMIN_EMAIL.toLowerCase() },
    });
    if (!admin || !admin.mfaSecret) {
      return NextResponse.json({ error: "No seeded admin found" }, { status: 404 });
    }
    const otp = await devCurrentOtp(admin.mfaSecret);
    return NextResponse.json({ otp });
  } catch (e) {
    console.error("dev-otp error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
