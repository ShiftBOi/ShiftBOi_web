import { prisma } from "@/lib/prisma";

export type AboutBundle = {
  about: {
    headline: string;
    bio: string;
    pitch: string;
  };
  profile: {
    name: string;
    title: string;
    wordmark: string;
    heroSubhead: string;
    heroHelper: string;
    email: string;
  };
  education: Array<{
    id: string;
    order: number;
    degree: string;
    institution: string;
    field: string;
  }>;
  work: Array<{
    id: string;
    order: number;
    year: string;
    title: string;
    company: string;
    description: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    order: number;
  }>;
};

const KEY = "about_cms";

const EMPTY: AboutBundle = {
  about: { headline: "", bio: "", pitch: "" },
  profile: {
    name: "",
    title: "",
    wordmark: "ShiftBOi",
    heroSubhead: "",
    heroHelper: "",
    email: "",
  },
  education: [],
  work: [],
  skills: [],
};

export async function getAboutBundle(): Promise<AboutBundle> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  if (!row?.value || typeof row.value !== "object") return structuredClone(EMPTY);
  return { ...structuredClone(EMPTY), ...(row.value as AboutBundle) };
}

export async function saveAboutBundle(next: AboutBundle) {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next },
    update: { value: next },
  });
  return next;
}
