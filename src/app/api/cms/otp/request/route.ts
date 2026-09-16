import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";
import { isSmtpConfigured } from "@/lib/email";

/**
 * CMS OTP request with clearer errors + delivery status.
 * When SMTP is missing (local dev), returns the OTP so login still works.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!isAllowedAdminEmail(email)) {
      return NextResponse.json(
        { error: "This email is not authorized for CMS access." },
        { status: 403 },
      );
    }

    await auth.api.sendVerificationOTP({
      body: {
        email,
        type: "sign-in",
      },
      headers: request.headers,
    });

    const smtpReady = isSmtpConfigured();
    let devOtp: string | null = null;

    // Local/dev fallback: surface OTP in the UI when mail isn't configured
    if (!smtpReady && process.env.NODE_ENV !== "production") {
      const otpResult = await auth.api.getVerificationOTP({
        query: {
          email,
          type: "sign-in",
        },
      });
      devOtp = otpResult?.otp ?? null;
    }

    return NextResponse.json({
      success: true,
      email,
      delivery: smtpReady ? "email" : "console",
      message: smtpReady
        ? "OTP sent to your email."
        : "SMTP is not configured. Use the on-screen code (also in the server console).",
      ...(devOtp ? { devOtp } : {}),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send OTP.";
    console.error("[cms/otp]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
