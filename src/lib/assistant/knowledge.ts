// @ts-nocheck
import { getPrisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/projects";

function chunkText(text: string, size = 700): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += size) {
    out.push(clean.slice(i, i + size));
  }
  return out;
}

function scoreChunk(query: string, text: string): number {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (q.length === 0) return 0;
  const hay = text.toLowerCase();
  let hits = 0;
  for (const w of q) {
    if (hay.includes(w)) hits += 1;
  }
  return hits / q.length;
}

export async function syncKnowledgeFromCms() {
  // Remove previous CMS-synced sources; keep manual notes
  const old = await getPrisma().knowledgeSource.findMany({
    where: { kind: { in: ["cms-project", "cms-about", "cms-activity", "cms-inquiry"] } },
    select: { id: true },
  });
  if (old.length) {
    await getPrisma().knowledgeSource.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }

  const [projects, about, activities, inquiries] = await Promise.all([
    getPrisma().project.findMany({
      orderBy: { createdAt: "desc" },
      include: projectInclude,
      take: 80,
    }),
    getPrisma().about.findFirst({
      include: {
        translationEn: true,
        translationTh: true,
        translationJa: true,
        translationFr: true,
        translationZh: true,
      },
    }),
    getPrisma().activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        translationEn: true,
        translationTh: true,
      },
    }),
    getPrisma().inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  let chunkCount = 0;

  for (const p of projects) {
    const en = p.translationEn;
    const th = p.translationTh;
    const body = [
      `Project ${p.slug} (${p.year})`,
      en?.title && `EN title: ${en.title}`,
      en?.tagline && `EN tagline: ${en.tagline}`,
      en?.description && `EN description: ${en.description}`,
      th?.title && `TH title: ${th.title}`,
      th?.tagline && `TH tagline: ${th.tagline}`,
      th?.description && `TH description: ${th.description}`,
      `Published: ${p.isPublished}`,
    ]
      .filter(Boolean)
      .join("\n");

    const source = await getPrisma().knowledgeSource.create({
      data: {
        name: en?.title || p.slug,
        kind: "cms-project",
        status: "indexed",
        meta: { slug: p.slug, projectId: p.id },
      },
    });
    const parts = chunkText(body);
    for (let i = 0; i < parts.length; i++) {
      await getPrisma().knowledgeChunk.create({
        data: {
          sourceId: source.id,
          index: i,
          location: p.slug,
          text: parts[i]!,
        },
      });
      chunkCount += 1;
    }
  }

  if (about) {
    const locales = [
      ["en", about.translationEn],
      ["th", about.translationTh],
      ["ja", about.translationJa],
      ["fr", about.translationFr],
      ["zh", about.translationZh],
    ] as const;
    const body = locales
      .map(([loc, row]) => {
        if (!row) return null;
        return [
          `About (${loc})`,
          row.headline && `Headline: ${row.headline}`,
          row.bio && `Bio: ${row.bio}`,
          "pitch" in row && row.pitch ? `Pitch: ${row.pitch}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n\n");

    if (body) {
      const source = await getPrisma().knowledgeSource.create({
        data: { name: "About", kind: "cms-about", status: "indexed" },
      });
      const parts = chunkText(body);
      for (let i = 0; i < parts.length; i++) {
        await getPrisma().knowledgeChunk.create({
          data: {
            sourceId: source.id,
            index: i,
            location: "about",
            text: parts[i]!,
          },
        });
        chunkCount += 1;
      }
    }
  }

  for (const a of activities) {
    const en = a.translationEn;
    const detail =
      typeof en?.detail === "string"
        ? en.detail.replace(/<[^>]+>/g, " ").slice(0, 2000)
        : "";
    const body = [`Activity ${a.slug}`, en?.title && `Title: ${en.title}`, detail]
      .filter(Boolean)
      .join("\n");
    if (!body.trim()) continue;
    const source = await getPrisma().knowledgeSource.create({
      data: {
        name: en?.title || a.slug,
        kind: "cms-activity",
        status: "indexed",
        meta: { activityId: a.id, slug: a.slug },
      },
    });
    for (const [i, part] of chunkText(body).entries()) {
      await getPrisma().knowledgeChunk.create({
        data: {
          sourceId: source.id,
          index: i,
          location: a.slug,
          text: part,
        },
      });
      chunkCount += 1;
    }
  }

  if (inquiries.length) {
    const body = inquiries
      .map(
        (inq) =>
          `Inquiry from ${inq.name || "—"} <${inq.email}> (${inq.source}): ${inq.message || ""}`
      )
      .join("\n");
    const source = await getPrisma().knowledgeSource.create({
      data: {
        name: "Recent inquiries",
        kind: "cms-inquiry",
        status: "indexed",
      },
    });
    for (const [i, part] of chunkText(body, 900).entries()) {
      await getPrisma().knowledgeChunk.create({
        data: {
          sourceId: source.id,
          index: i,
          location: "inquiries",
          text: part,
        },
      });
      chunkCount += 1;
    }
  }

  return {
    sources: await getPrisma().knowledgeSource.count(),
    chunks: chunkCount,
  };
}

export async function retrieveKnowledge(query: string, topK = 4) {
  const chunks = await getPrisma().knowledgeChunk.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { source: { select: { id: true, name: true, kind: true } } },
  });
  return chunks
    .map((c) => ({
      id: c.id,
      sourceId: c.sourceId,
      text: c.text,
      location: c.location,
      sourceName: c.source.name,
      kind: c.source.kind,
      similarity: scoreChunk(query, c.text),
    }))
    .filter((c) => c.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(1, Math.min(topK, 12)));
}
