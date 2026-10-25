import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const bundle = await getAboutBundle();
  return NextResponse.json({
    success: true,
    data: bundle.work.map((w) => ({
      id: w.id,
      order: w.order,
      year: w.year,
      translationEn: {
        title: w.title,
        company: w.company,
        description: w.description,
      },
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  const row = {
    id: `work_${Date.now()}`,
    order: bundle.work.length,
    year: String(body.year || ""),
    title: body.translationEn?.title || body.title || "",
    company: body.translationEn?.company || body.company || "",
    description: body.translationEn?.description || body.description || "",
  };
  bundle.work.push(row);
  await saveAboutBundle(bundle);
  return NextResponse.json({
    success: true,
    data: {
      id: row.id,
      order: row.order,
      year: row.year,
      translationEn: {
        title: row.title,
        company: row.company,
        description: row.description,
      },
    },
  });
}
