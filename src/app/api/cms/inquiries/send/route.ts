import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { sendInquiryReply } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  inquiryId: z.string().optional(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  kind: z.enum(["reply", "forward", "compose"]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireCmsAdmin(request);
  if (!session) return unauthorized();

  const limited = rateLimit(
    `cms-inquiry-send:${session.user.id}`,
    20,
    60 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many sends. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { inquiryId, to, subject, body: text, kind } = parsed.data;

  try {
    const result = await sendInquiryReply({
      to,
      subject,
      text,
      replyTo: process.env.SMTP_USER || undefined,
    });

    const reply = await prisma.inquiryReply.create({
      data: {
        inquiryId: inquiryId || null,
        to,
        subject,
        body: text,
        kind: kind || "reply",
      },
    });

    if (inquiryId) {
      await prisma.inquiry
        .update({ where: { id: inquiryId }, data: { read: true } })
        .catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      reply,
      smtp: result,
    });
  } catch (error) {
    console.error("[cms/inquiries/send]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 },
    );
  }
}
