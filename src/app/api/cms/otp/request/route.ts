import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { isSmtpConfigured } from "@/lib/email";

/**
 * CMS OTP request — always targets the locked admin email.
 * Client-supplied email is ignored so outsiders cannot probe other inboxes.
 */
export async function POST(request: NextRequest) {
  try {
    // Discard body email if present; only the system admin address is used.
    await request.json().catch(() => null);
    const email = ADMIN_EMAIL;

    await auth.api.sendVerificationOTP({
      body: {
        email,
        type: "sign-in",
      },
      headers: request.headers,
    });

    const smtpReady = isSmtpConfigured();
    let devOtp: string | null = null;

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
      delivery: smtpReady ? "email" : "console",
      message: smtpReady
        ? "OTP sent to the admin inbox."
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
