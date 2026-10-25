import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const bundle = await getAboutBundle();
  return NextResponse.json({
    success: true,
    data: bundle.education.map((e) => ({
      id: e.id,
      order: e.order,
      translationEn: {
        degree: e.degree,
        institution: e.institution,
        field: e.field,
      },
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  const row = {
    id: `edu_${Date.now()}`,
    order: bundle.education.length,
    degree: body.translationEn?.degree || body.degree || "",
    institution: body.translationEn?.institution || body.institution || "",
    field: body.translationEn?.field || body.field || "",
  };
  bundle.education.push(row);
  await saveAboutBundle(bundle);
  return NextResponse.json({
    success: true,
    data: {
      id: row.id,
      order: row.order,
      translationEn: {
        degree: row.degree,
        institution: row.institution,
        field: row.field,
      },
    },
  });
}
