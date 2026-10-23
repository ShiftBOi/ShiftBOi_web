import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clientIp,
  pruneRateLimits,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const BOARD_TAKE = 40;
const SCORE_MAX = 1_000_000;

const deviceIdSchema = z.string().uuid();

const postSchema = z.object({
  deviceId: deviceIdSchema,
  score: z.number().int().positive().max(SCORE_MAX),
});

function playerTag(deviceId: string): string {
  return createHash("sha256").update(deviceId).digest("hex").slice(0, 4).toUpperCase();
}

async function boardEntries(viewerId?: string) {
  const rows = await prisma.dinoScore.findMany({
    orderBy: { bestScore: "desc" },
    take: BOARD_TAKE,
    select: { deviceId: true, bestScore: true },
  });

  return rows.map((row, index) => ({
    rank: index + 1,
    score: row.bestScore,
    tag: playerTag(row.deviceId),
    you: Boolean(viewerId && row.deviceId === viewerId),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("deviceId") ?? undefined;
    const viewerId = raw && deviceIdSchema.safeParse(raw).success ? raw : undefined;

    let myBest = 0;
    if (viewerId) {
      const mine = await prisma.dinoScore.findUnique({
        where: { deviceId: viewerId },
        select: { bestScore: true },
      });
      myBest = mine?.bestScore ?? 0;
    }

    const entries = await boardEntries(viewerId);
    return NextResponse.json({
      entries,
      myBest,
      /** @deprecated prefer entries */
      scores: entries.map((e) => e.score),
    });
  } catch (error) {
    console.error("[api/dino/scores] GET", error);
    return NextResponse.json({ error: "Failed to load scores" }, { status: 500 });
  }
}

/**
 * Upsert best score for a device. Only updates when the new score is higher.
 * One row per person/device — not per attempt.
 */
export async function POST(request: NextRequest) {
  pruneRateLimits();
  const limited = rateLimit(`dino:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { deviceId, score } = parsed.data;

  try {
    const existing = await prisma.dinoScore.findUnique({
      where: { deviceId },
      select: { bestScore: true },
    });

    let bestScore = score;
    let updated = true;

    if (!existing) {
      await prisma.dinoScore.create({
        data: { deviceId, bestScore: score },
      });
    } else if (score > existing.bestScore) {
      await prisma.dinoScore.update({
        where: { deviceId },
        data: { bestScore: score },
      });
      bestScore = score;
    } else {
      bestScore = existing.bestScore;
      updated = false;
    }

    const entries = await boardEntries(deviceId);

    return NextResponse.json({
      updated,
      bestScore,
      entries,
      /** @deprecated prefer entries */
      scores: entries.map((e) => e.score),
    });
  } catch (error) {
    console.error("[api/dino/scores] POST", error);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
