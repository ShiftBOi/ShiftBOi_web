import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BOARD_TAKE = 8;
const SCORE_MAX = 1_000_000;

const postSchema = z.object({
  deviceId: z.string().uuid(),
  score: z.number().int().positive().max(SCORE_MAX),
});

export async function GET() {
  try {
    const rows = await prisma.dinoScore.findMany({
      orderBy: { bestScore: "desc" },
      take: BOARD_TAKE,
      select: { bestScore: true },
    });
    return NextResponse.json({
      scores: rows.map((r) => r.bestScore),
    });
  } catch (error) {
    console.error("[api/dino/scores] GET", error);
    return NextResponse.json({ error: "Failed to load scores" }, { status: 500 });
  }
}

/**
 * Upsert best score for a device. Only updates when the new score is higher.
 * No username — leaderboard is anonymous score list.
 */
export async function POST(request: NextRequest) {
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

    const rows = await prisma.dinoScore.findMany({
      orderBy: { bestScore: "desc" },
      take: BOARD_TAKE,
      select: { bestScore: true },
    });

    return NextResponse.json({
      updated,
      bestScore,
      scores: rows.map((r) => r.bestScore),
    });
  } catch (error) {
    console.error("[api/dino/scores] POST", error);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
