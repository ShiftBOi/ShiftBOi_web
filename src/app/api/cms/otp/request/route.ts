import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { isSmtpConfigured } from "@/lib/email";
import {
  clientIp,
  pruneRateLimits,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

/**
 * CMS OTP request — always targets the locked admin email.
 * Client-supplied email is ignored so outsiders cannot probe other inboxes.
 * OTP is never returned in the HTTP body.
 */
export async function POST(request: NextRequest) {
  try {
    pruneRateLimits();
    const limited = rateLimit(`otp:${clientIp(request)}`, 5, 60 * 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }

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

    return NextResponse.json({
      success: true,
      delivery: smtpReady ? "email" : "console",
      message: smtpReady
        ? "OTP sent to the admin inbox."
        : "SMTP is not configured. Check the server console for the code.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send OTP.";
    console.error("[cms/otp]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
