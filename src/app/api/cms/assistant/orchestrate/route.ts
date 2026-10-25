import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { ORCH_LEAD, ORCH_WORKERS } from "@/lib/assistant/orch-workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    goal?: string;
  } | null;
  const goal = body?.goal?.trim() || "Improve CMS content";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };
      send({
        type: "plan",
        lead: ORCH_LEAD,
        workers: ORCH_WORKERS.map((w) => w.id),
        goal,
      });
      for (const worker of ORCH_WORKERS) {
        send({
          type: "worker",
          id: worker.id,
          name: worker.name,
          status: "done",
          summary: `${worker.name} reviewed “${goal.slice(0, 80)}”.`,
        });
      }
      send({
        type: "done",
        summary: "Orchestration complete (ShiftBOi stub — lead + workers UI).",
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
