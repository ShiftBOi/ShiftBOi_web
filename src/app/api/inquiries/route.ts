import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import { sendInquiryEmails } from "@/lib/email";
import {
  clientIp,
  pruneRateLimits,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(4000).optional().nullable(),
  source: z.string().trim().max(64).optional(),
  /** Honeypot — bots fill this; humans leave it empty */
  website: z.string().max(200).optional().nullable(),
});

export async function POST(request: NextRequest) {
  pruneRateLimits();
  const ip = clientIp(request);
  const limited = rateLimit(`inquiry:${ip}`, 5, 60 * 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid name, email, and message are required." },
      { status: 400 },
    );
  }

  /* Silent success for honeypot fills — don't tip off bots */
  if (parsed.data.website?.trim()) {
    return NextResponse.json({ ok: true, emailed: false, confirmed: false });
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const message = parsed.data.message?.trim() || null;
  const source = parsed.data.source?.slice(0, 64) || "get-in-touch";

  if (!message) {
    return NextResponse.json(
      { error: "Please include a short message." },
      { status: 400 },
    );
  }

  try {
    await prisma.inquiry.create({
      data: { email, name, message, source },
    });

    const site = await getSiteContent();
    const mail = await sendInquiryEmails({
      to: site.contact.email,
      name,
      email,
      message,
      source,
    });

    return NextResponse.json({
      ok: true,
      emailed: mail.notified,
      confirmed: mail.confirmed,
    });
  } catch (error) {
    console.error("[inquiries] POST failed", error);
    return NextResponse.json(
      { error: "Could not save your message. Try emailing directly." },
      { status: 503 },
    );
  }
}
