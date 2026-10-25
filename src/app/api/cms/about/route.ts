import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle, type AboutBundle } from "@/lib/cms-about";

export const runtime = "nodejs";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const bundle = await getAboutBundle();
  return ok({
    about: {
      translationEn: bundle.about,
    },
    education: bundle.education.map((e) => ({
      id: e.id,
      order: e.order,
      translationEn: {
        degree: e.degree,
        institution: e.institution,
        field: e.field,
      },
    })),
    work: bundle.work.map((w) => ({
      id: w.id,
      order: w.order,
      year: w.year,
      translationEn: {
        title: w.title,
        company: w.company,
        description: w.description,
      },
    })),
    skills: bundle.skills,
  });
}

export async function PUT(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => null);
  const current = await getAboutBundle();

  if (body?.about?.translationEn) {
    current.about = {
      headline: String(body.about.translationEn.headline || ""),
      bio: String(body.about.translationEn.bio || ""),
      pitch: String(body.about.translationEn.pitch || ""),
    };
  }
  if (Array.isArray(body?.education)) {
    current.education = body.education.map(
      (e: {
        id?: string;
        order?: number;
        translationEn?: { degree?: string; institution?: string; field?: string };
      },
      i: number,
    ) => ({
      id: e.id || `edu_${Date.now()}_${i}`,
      order: e.order ?? i,
      degree: e.translationEn?.degree || "",
      institution: e.translationEn?.institution || "",
      field: e.translationEn?.field || "",
    }));
  }
  if (Array.isArray(body?.work)) {
    current.work = body.work.map(
      (w: {
        id?: string;
        order?: number;
        year?: string;
        translationEn?: {
          title?: string;
          company?: string;
          description?: string;
        };
      },
      i: number,
    ) => ({
      id: w.id || `work_${Date.now()}_${i}`,
      order: w.order ?? i,
      year: w.year || "",
      title: w.translationEn?.title || "",
      company: w.translationEn?.company || "",
      description: w.translationEn?.description || "",
    }));
  }
  if (Array.isArray(body?.skills)) {
    current.skills = body.skills.map(
      (
        s: { id?: string; name?: string; category?: string; order?: number },
        i: number,
      ) => ({
        id: s.id || `skill_${Date.now()}_${i}`,
        name: s.name || "",
        category: s.category || "Other",
        order: s.order ?? i,
      }),
    );
  }

  await saveAboutBundle(current);
  return ok(current);
}
