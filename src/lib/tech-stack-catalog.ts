/** Shared tech badge catalog (shields.io) used on homepage + case-study cards. */

export type TechBadge = {
  id: string;
  label: string;
  src: string;
  category: string;
};

const badge = (category: string, label: string, src: string): TechBadge => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  label,
  src,
  category,
});

export const TECH_STACK_CATALOG: TechBadge[] = [
  badge("Languages", "JavaScript", "https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E"),
  badge("Languages", "TypeScript", "https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white"),
  badge("Languages", "Python", "https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54"),
  badge("Languages", "Java", "https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white"),
  badge("Languages", "Kotlin", "https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white"),
  badge("Languages", "Swift", "https://img.shields.io/badge/swift-F54A2A?style=for-the-badge&logo=swift&logoColor=white"),
  badge("Frontend", "HTML5", "https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white"),
  badge("Frontend", "CSS3", "https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white"),
  badge("Frontend", "React", "https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB"),
  badge("Frontend", "Next.js", "https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white"),
  badge("Frontend", "Vite", "https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"),
  badge("Frontend", "TailwindCSS", "https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white"),
  badge("Frontend", "Electron", "https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white"),
  badge("Frontend", "Three.js", "https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white"),
  badge("Frontend", "GSAP", "https://img.shields.io/badge/GSAP-%2388CE02.svg?style=for-the-badge&logo=greensock&logoColor=white"),
  badge("Frontend", "Framer Motion", "https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white"),
  badge("Backend & Data", "Node.js", "https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white"),
  badge("Backend & Data", "Express.js", "https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB"),
  badge("Backend & Data", "Elysia", "https://img.shields.io/badge/Elysia-81C784?style=for-the-badge&logoColor=white"),
  badge("Backend & Data", "Bun", "https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white"),
  badge("Backend & Data", "Socket.io", "https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101"),
  badge("Backend & Data", "Prisma", "https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"),
  badge("Backend & Data", "PostgreSQL", "https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white"),
  badge("Backend & Data", "MySQL", "https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white"),
  badge("Backend & Data", "MongoDB", "https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white"),
  badge("Backend & Data", "Redis", "https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white"),
  badge("AI", "Groq", "https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white"),
  badge("AI", "OpenAI", "https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white"),
  badge("AI", "Vercel AI SDK", "https://img.shields.io/badge/Vercel%20AI%20SDK-000000?style=for-the-badge&logo=vercel&logoColor=white"),
  badge("AI", "Ollama", "https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white"),
  badge("AI", "Gemini", "https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white"),
  badge("Mobile", "Android", "https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white"),
  badge("Mobile", "Jetpack Compose", "https://img.shields.io/badge/Jetpack%20Compose-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white"),
  badge("IDE - Extensions", "Visual Studio Code", "https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white"),
  badge("IDE - Extensions", "VS Code Extension API", "https://img.shields.io/badge/VS%20Code%20Extension%20API-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"),
  badge("IDE - Extensions", "Cursor", "https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white"),
  badge("IDE - Extensions", "Open VSX", "https://img.shields.io/badge/Open%20VSX-A60EE5?style=for-the-badge&logo=eclipseide&logoColor=white"),
  badge("DevOps - Tools", "Docker", "https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white"),
  badge("DevOps - Tools", "Yarn", "https://img.shields.io/badge/Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white"),
  badge("DevOps - Tools", "Git", "https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white"),
  badge("DevOps - Tools", "Cloudflare R2", "https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"),
  badge("DevOps - Tools", "Vercel", "https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"),
  badge("Frontend", "esbuild", "https://img.shields.io/badge/esbuild-FFCF00?style=for-the-badge&logo=esbuild&logoColor=black"),
  badge("Frontend", "Canvas", "https://img.shields.io/badge/Canvas-111111?style=for-the-badge&logo=html5&logoColor=white"),
];

const byId = new Map(TECH_STACK_CATALOG.map((t) => [t.id, t]));
const byLabel = new Map(
  TECH_STACK_CATALOG.map((t) => [t.label.toLowerCase(), t]),
);

const ALIASES: Record<string, string> = {
  "simple-git": "git",
  "canvas webview": "canvas",
  ts: "typescript",
  js: "javascript",
  "next": "next-js",
  "nextjs": "next-js",
  vscode: "visual-studio-code",
  "vs code": "visual-studio-code",
  "vs-code": "visual-studio-code",
};

export function findTechBadge(query: string | null | undefined): TechBadge | null {
  if (!query?.trim()) return null;
  const q = query.trim();
  const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const aliased = ALIASES[q.toLowerCase()] || ALIASES[slug];
  return (
    byId.get(q) ||
    byId.get(slug) ||
    (aliased ? byId.get(aliased) : null) ||
    byLabel.get(q.toLowerCase()) ||
    null
  );
}

export function resolveTechBadges(names: string[]): TechBadge[] {
  const out: TechBadge[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const badgeItem = findTechBadge(name);
    if (!badgeItem || seen.has(badgeItem.id)) continue;
    seen.add(badgeItem.id);
    out.push(badgeItem);
  }
  return out;
}

export function techCatalogGrouped(): { category: string; items: TechBadge[] }[] {
  const map = new Map<string, TechBadge[]>();
  for (const item of TECH_STACK_CATALOG) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}
