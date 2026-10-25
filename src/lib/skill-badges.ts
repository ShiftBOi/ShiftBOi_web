export type SkillBadgeMeta = {
  bg: string;
  fg: string;
  /** simpleicons slug — https://cdn.simpleicons.org/{slug}/{color} */
  icon: string;
  iconColor: string;
};

const BY_KEY: Record<string, SkillBadgeMeta> = {
  // Languages
  javascript: { bg: "#323330", fg: "#F0DB4F", icon: "javascript", iconColor: "F0DB4F" },
  typescript: { bg: "#3178C6", fg: "#FFFFFF", icon: "typescript", iconColor: "FFFFFF" },
  python: { bg: "#3776AB", fg: "#FFFFFF", icon: "python", iconColor: "FFD43B" },
  go: { bg: "#00ADD8", fg: "#FFFFFF", icon: "go", iconColor: "FFFFFF" },
  golang: { bg: "#00ADD8", fg: "#FFFFFF", icon: "go", iconColor: "FFFFFF" },
  kotlin: { bg: "#7F52FF", fg: "#FFFFFF", icon: "kotlin", iconColor: "FFFFFF" },
  php: { bg: "#777BB4", fg: "#FFFFFF", icon: "php", iconColor: "FFFFFF" },

  // Frontend
  html5: { bg: "#E34F26", fg: "#FFFFFF", icon: "html5", iconColor: "FFFFFF" },
  html: { bg: "#E34F26", fg: "#FFFFFF", icon: "html5", iconColor: "FFFFFF" },
  "html/css": { bg: "#E34F26", fg: "#FFFFFF", icon: "html5", iconColor: "FFFFFF" },
  css3: { bg: "#1572B6", fg: "#FFFFFF", icon: "css3", iconColor: "FFFFFF" },
  css: { bg: "#1572B6", fg: "#FFFFFF", icon: "css3", iconColor: "FFFFFF" },
  react: { bg: "#20232A", fg: "#61DAFB", icon: "react", iconColor: "61DAFB" },
  redux: { bg: "#764ABC", fg: "#FFFFFF", icon: "redux", iconColor: "FFFFFF" },
  "next.js": { bg: "#000000", fg: "#FFFFFF", icon: "nextdotjs", iconColor: "FFFFFF" },
  nextjs: { bg: "#000000", fg: "#FFFFFF", icon: "nextdotjs", iconColor: "FFFFFF" },
  next: { bg: "#000000", fg: "#FFFFFF", icon: "nextdotjs", iconColor: "FFFFFF" },
  vuejs: { bg: "#35495E", fg: "#42B883", icon: "vuedotjs", iconColor: "42B883" },
  "vue.js": { bg: "#35495E", fg: "#42B883", icon: "vuedotjs", iconColor: "42B883" },
  vue: { bg: "#35495E", fg: "#42B883", icon: "vuedotjs", iconColor: "42B883" },
  "tailwind css": { bg: "#0B1120", fg: "#38BDF8", icon: "tailwindcss", iconColor: "38BDF8" },
  tailwindcss: { bg: "#0B1120", fg: "#38BDF8", icon: "tailwindcss", iconColor: "38BDF8" },
  tailwind: { bg: "#0B1120", fg: "#38BDF8", icon: "tailwindcss", iconColor: "38BDF8" },
  vite: { bg: "#646CFF", fg: "#FFFFFF", icon: "vite", iconColor: "FFFFFF" },
  electron: { bg: "#2B2E3A", fg: "#9FEAF9", icon: "electron", iconColor: "9FEAF9" },
  "electron-vite": { bg: "#BD34FE", fg: "#FFFFFF", icon: "electron", iconColor: "FFFFFF" },
  "framer motion": { bg: "#0055FF", fg: "#FFFFFF", icon: "framer", iconColor: "FFFFFF" },
  framermotion: { bg: "#0055FF", fg: "#FFFFFF", icon: "framer", iconColor: "FFFFFF" },
  gsap: { bg: "#88CE02", fg: "#0B0B0B", icon: "greensock", iconColor: "0B0B0B" },

  // Backend & DB
  "node.js": { bg: "#339933", fg: "#FFFFFF", icon: "nodedotjs", iconColor: "FFFFFF" },
  nodejs: { bg: "#339933", fg: "#FFFFFF", icon: "nodedotjs", iconColor: "FFFFFF" },
  node: { bg: "#339933", fg: "#FFFFFF", icon: "nodedotjs", iconColor: "FFFFFF" },
  prisma: { bg: "#2D3748", fg: "#FFFFFF", icon: "prisma", iconColor: "FFFFFF" },
  mysql: { bg: "#4479A1", fg: "#FFFFFF", icon: "mysql", iconColor: "FFFFFF" },
  postgresql: { bg: "#4169E1", fg: "#FFFFFF", icon: "postgresql", iconColor: "FFFFFF" },
  postgres: { bg: "#4169E1", fg: "#FFFFFF", icon: "postgresql", iconColor: "FFFFFF" },
  supabase: { bg: "#3ECF8E", fg: "#0B0B0B", icon: "supabase", iconColor: "0B0B0B" },
  drizzle: { bg: "#C5F74F", fg: "#0B0B0B", icon: "drizzle", iconColor: "0B0B0B" },

  // DevOps
  cloudflare: { bg: "#F38020", fg: "#FFFFFF", icon: "cloudflare", iconColor: "FFFFFF" },
  vercel: { bg: "#000000", fg: "#FFFFFF", icon: "vercel", iconColor: "FFFFFF" },
  docker: { bg: "#2496ED", fg: "#FFFFFF", icon: "docker", iconColor: "FFFFFF" },

  // Design & Tools
  figma: { bg: "#F24E1E", fg: "#FFFFFF", icon: "figma", iconColor: "FFFFFF" },
  git: { bg: "#F05032", fg: "#FFFFFF", icon: "git", iconColor: "FFFFFF" },
  github: { bg: "#181717", fg: "#FFFFFF", icon: "github", iconColor: "FFFFFF" },
  postman: { bg: "#FF6C37", fg: "#FFFFFF", icon: "postman", iconColor: "FFFFFF" },
  "visual studio code": { bg: "#007ACC", fg: "#FFFFFF", icon: "visualstudio", iconColor: "FFFFFF" },
  "vs code": { bg: "#007ACC", fg: "#FFFFFF", icon: "visualstudio", iconColor: "FFFFFF" },
  vscode: { bg: "#007ACC", fg: "#FFFFFF", icon: "visualstudio", iconColor: "FFFFFF" },
  notion: { bg: "#000000", fg: "#FFFFFF", icon: "notion", iconColor: "FFFFFF" },
  npm: { bg: "#CB3837", fg: "#FFFFFF", icon: "npm", iconColor: "FFFFFF" },
  yarn: { bg: "#2C8EBB", fg: "#FFFFFF", icon: "yarn", iconColor: "FFFFFF" },
  bun: { bg: "#000000", fg: "#FBF0DF", icon: "bun", iconColor: "FBF0DF" },
  "claude ai": { bg: "#D4A27F", fg: "#1A1A1A", icon: "anthropic", iconColor: "1A1A1A" },
  claude: { bg: "#D4A27F", fg: "#1A1A1A", icon: "anthropic", iconColor: "1A1A1A" },
  cursor: { bg: "#1A1A1A", fg: "#FFFFFF", icon: "cursor", iconColor: "FFFFFF" },
  graphql: { bg: "#E10098", fg: "#FFFFFF", icon: "graphql", iconColor: "FFFFFF" },
};

const FALLBACK: SkillBadgeMeta = {
  bg: "#3F3F46",
  fg: "#FFFFFF",
  icon: "",
  iconColor: "FFFFFF",
};

/** Preferred category display order on the landing page */
export const SKILL_CATEGORY_ORDER = [
  "Programming Languages",
  "Frontend Development",
  "Backend & Database",
  "DevOps",
  "Design & Tools",
] as const;

/** Canonical skill rows for seed / CMS defaults */
export const CANONICAL_SKILLS: { name: string; category: string; order: number }[] = [
  // Programming Languages
  { name: "JavaScript", category: "Programming Languages", order: 0 },
  { name: "TypeScript", category: "Programming Languages", order: 1 },
  { name: "Python", category: "Programming Languages", order: 2 },
  { name: "Go", category: "Programming Languages", order: 3 },
  { name: "Kotlin", category: "Programming Languages", order: 4 },

  // Frontend
  { name: "HTML5", category: "Frontend Development", order: 10 },
  { name: "CSS3", category: "Frontend Development", order: 11 },
  { name: "React", category: "Frontend Development", order: 12 },
  { name: "Redux", category: "Frontend Development", order: 13 },
  { name: "Next.js", category: "Frontend Development", order: 14 },
  { name: "Vue.js", category: "Frontend Development", order: 15 },
  { name: "Tailwind CSS", category: "Frontend Development", order: 16 },
  { name: "Vite", category: "Frontend Development", order: 17 },
  { name: "Electron", category: "Frontend Development", order: 18 },
  { name: "Electron-Vite", category: "Frontend Development", order: 19 },
  { name: "Framer Motion", category: "Frontend Development", order: 20 },
  { name: "GSAP", category: "Frontend Development", order: 21 },

  // Backend & Database
  { name: "Node.js", category: "Backend & Database", order: 30 },
  { name: "Go", category: "Backend & Database", order: 31 },
  { name: "PHP", category: "Backend & Database", order: 32 },
  { name: "Prisma", category: "Backend & Database", order: 33 },
  { name: "MySQL", category: "Backend & Database", order: 34 },
  { name: "PostgreSQL", category: "Backend & Database", order: 35 },
  { name: "Supabase", category: "Backend & Database", order: 36 },
  { name: "Drizzle", category: "Backend & Database", order: 37 },

  // DevOps
  { name: "Cloudflare", category: "DevOps", order: 40 },
  { name: "Vercel", category: "DevOps", order: 41 },
  { name: "Docker", category: "DevOps", order: 42 },

  // Design & Tools
  { name: "Figma", category: "Design & Tools", order: 50 },
  { name: "Git", category: "Design & Tools", order: 51 },
  { name: "GitHub", category: "Design & Tools", order: 52 },
  { name: "Postman", category: "Design & Tools", order: 53 },
  { name: "Visual Studio Code", category: "Design & Tools", order: 54 },
  { name: "Notion", category: "Design & Tools", order: 55 },
  { name: "npm", category: "Design & Tools", order: 56 },
  { name: "Yarn", category: "Design & Tools", order: 57 },
  { name: "Bun", category: "Design & Tools", order: 58 },
  { name: "Claude AI", category: "Design & Tools", order: 59 },
  { name: "Cursor", category: "Design & Tools", order: 60 },
];

export function normalizeSkillKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getSkillBadgeMeta(name: string): SkillBadgeMeta {
  const key = normalizeSkillKey(name);
  return BY_KEY[key] ?? BY_KEY[key.replace(/\./g, "")] ?? FALLBACK;
}

export function skillIconUrl(meta: SkillBadgeMeta) {
  if (!meta.icon) return null;
  return `https://cdn.simpleicons.org/${meta.icon}/${meta.iconColor}`;
}

export function sortSkillCategories(categories: string[]) {
  return [...categories].sort((a, b) => {
    const ai = SKILL_CATEGORY_ORDER.indexOf(a as (typeof SKILL_CATEGORY_ORDER)[number]);
    const bi = SKILL_CATEGORY_ORDER.indexOf(b as (typeof SKILL_CATEGORY_ORDER)[number]);
    const ao = ai === -1 ? 999 : ai;
    const bo = bi === -1 ? 999 : bi;
    if (ao !== bo) return ao - bo;
    return a.localeCompare(b);
  });
}
