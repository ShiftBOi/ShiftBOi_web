export type SlashCommandField = {
  name: string;
  hint: string;
};

export type SlashCommand = {
  id: string;
  /** Menu label, e.g. "/project create" */
  label: string;
  /** Compact badge in composer, e.g. "/create project" */
  badge?: string;
  hint: string;
  /**
   * Expanded instruction for the model when the badge is sent.
   * User-typed details after the badge are appended.
   */
  prompt: string;
  /** Hover schema — fields the user can fill after the badge */
  fields?: SlashCommandField[];
  group?: "projects" | "content" | "ops" | "memory";
};

export type QuickMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  /** Optional slash command to insert as a badge instead of auto-sending */
  commandId?: string;
  icon:
    | "sparkles"
    | "folder"
    | "languages"
    | "inbox"
    | "pen"
    | "search"
    | "user"
    | "bookmark";
};

const PROJECT_CREATE_FIELDS: SlashCommandField[] = [
  { name: "name / title", hint: "Project name (required)" },
  { name: "summary", hint: "Short one-liner under the title" },
  { name: "description", hint: "About / narrative" },
  { name: "techStack", hint: "Tools (Next.js, Prisma, …)" },
  { name: "role", hint: "Your role on the project" },
  { name: "year", hint: "Defaults to current year" },
  { name: "published", hint: "Leave false unless asked to publish" },
];

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "project-create",
    label: "/project create",
    badge: "/create project",
    hint: "Create a new unpublished project",
    group: "projects",
    prompt:
      "Create a new unpublished project now (call create_project). Use everything the user wrote after this command as the name and/or full brief. Year: current year unless they specify otherwise.",
    fields: PROJECT_CREATE_FIELDS,
  },
  {
    id: "project-list",
    label: "/project list",
    badge: "/list projects",
    hint: "List projects with publish state",
    group: "projects",
    prompt:
      "List CMS projects with slug, title, year, and published status as a markdown table. Highlight drafts.",
    fields: [
      { name: "filter", hint: "Optional: drafts | published | year" },
    ],
  },
  {
    id: "project-get",
    label: "/project get",
    badge: "/get project",
    hint: "Inspect one project by slug",
    group: "projects",
    prompt:
      "Show details for the project the user names (or @project) — title, summary, stack, visibility, publish state.",
    fields: [{ name: "@project", hint: "Slug to inspect" }],
  },
  {
    id: "project-polish",
    label: "/project polish",
    badge: "/polish project",
    hint: "Polish English project copy",
    group: "projects",
    prompt:
      "Improve English title, summary, and hero copy for @project. Keep it concise and portfolio-ready. Use notes below if any.",
    fields: [
      { name: "@project", hint: "Project to polish" },
      { name: "notes", hint: "What to emphasize" },
    ],
  },
  {
    id: "project-unpublish",
    label: "/project unpublish",
    badge: "/unpublish",
    hint: "Unpublish a project (keep draft)",
    group: "projects",
    prompt: "Unpublish @project (set published false) and confirm.",
    fields: [{ name: "@project", hint: "Slug to unpublish" }],
  },
  {
    id: "project-delete",
    label: "/project delete",
    badge: "/delete project",
    hint: "Permanently delete a project",
    group: "projects",
    prompt:
      "Delete @project permanently after confirming the slug. Summarize what was removed.",
    fields: [{ name: "@project", hint: "Slug to delete" }],
  },
  {
    id: "about-show",
    label: "/about",
    badge: "/about",
    hint: "Show about / profile copy",
    group: "content",
    prompt: "Show @about details (headline, bio, pitch, profile).",
  },
  {
    id: "about-update",
    label: "/about update",
    badge: "/edit about",
    hint: "Update one about field",
    group: "content",
    prompt:
      "Update @about using the field and value the user provides below.",
    fields: [
      { name: "field", hint: "headline | bio | pitch" },
      { name: "value", hint: "New copy" },
    ],
  },
  {
    id: "site-show",
    label: "/site",
    badge: "/site",
    hint: "Read a site setting",
    group: "content",
    prompt:
      "Show site setting for the key the user names (hero|contact|services|brand|stats|focus|engagement).",
    fields: [
      {
        name: "key",
        hint: "hero | contact | services | brand | stats | focus | engagement",
      },
    ],
  },
  {
    id: "site-update",
    label: "/site update",
    badge: "/edit site",
    hint: "Update a site setting",
    group: "content",
    prompt:
      "Update the site setting the user names with the change they describe below.",
    fields: [
      {
        name: "key",
        hint: "hero | contact | services | brand | stats | focus | engagement",
      },
      { name: "change", hint: "What to change" },
    ],
  },
  {
    id: "activity-list",
    label: "/activity list",
    badge: "/list activities",
    hint: "List Activities & Updates",
    group: "content",
    prompt: "List recent activities with title, slug, and publish state.",
  },
  {
    id: "activity-create",
    label: "/activity create",
    badge: "/create activity",
    hint: "Draft a new activity post",
    group: "content",
    prompt:
      "Create an unpublished activity from the title and detail the user provides below.",
    fields: [
      { name: "title", hint: "Post title" },
      { name: "detail", hint: "Body / detail" },
    ],
  },
  {
    id: "inquiry-list",
    label: "/inquiry list",
    badge: "/inquiries",
    hint: "List recent contact inquiries",
    group: "ops",
    prompt:
      "List the latest contact inquiries with name, email, and a short summary.",
  },
  {
    id: "inquiry-summary",
    label: "/inquiry summary",
    badge: "/inquiry summary",
    hint: "Summarize inquiry themes",
    group: "ops",
    prompt:
      "Summarize recent inquiries: counts, themes, and who needs a reply first.",
  },
  {
    id: "search",
    label: "/search",
    badge: "/search",
    hint: "Search CMS content",
    group: "content",
    prompt: "Search the CMS for the query the user types after this command:",
    fields: [{ name: "query", hint: "What to find" }],
  },
  {
    id: "remember",
    label: "/remember",
    badge: "/remember",
    hint: "Save a short preference",
    group: "memory",
    prompt: "Remember this about me (one short sentence):",
    fields: [{ name: "note", hint: "Preference to save" }],
  },
  {
    id: "help",
    label: "/help",
    badge: "/help",
    hint: "Commands, @mentions, Bypass/Approve",
    group: "ops",
    prompt:
      "List slash commands, @mentions, tools, and how Bypass vs Approve write modes work — short and clear.",
  },
];

export const QUICK_MENU: QuickMenuItem[] = [
  {
    id: "create-project",
    title: "Create a project",
    subtitle: "From a name or full brief",
    commandId: "project-create",
    prompt: "",
    icon: "folder",
  },
  {
    id: "about-review",
    title: "Review about page",
    subtitle: "Headline, bio, and pitch",
    commandId: "about-show",
    prompt: "",
    icon: "pen",
  },
  {
    id: "inbox",
    title: "Triage inquiries",
    subtitle: "Themes and who to reply first",
    commandId: "inquiry-summary",
    prompt: "",
    icon: "inbox",
  },
  {
    id: "activity",
    title: "Post an update",
    subtitle: "Activities & Updates draft",
    commandId: "activity-create",
    prompt: "",
    icon: "bookmark",
  },
  {
    id: "search-cms",
    title: "Search the CMS",
    subtitle: "Projects, about, activities",
    commandId: "search",
    prompt: "",
    icon: "search",
  },
  {
    id: "help",
    title: "What can you do?",
    subtitle: "Commands, mentions, Bypass/Approve",
    commandId: "help",
    prompt: "",
    icon: "sparkles",
  },
];

export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.replace(/^\//, "").trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      (c.badge || "").toLowerCase().includes(q) ||
      c.hint.toLowerCase().includes(q) ||
      c.id.includes(q) ||
      (c.group || "").includes(q),
  );
}

export function getSlashCommand(id: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find((c) => c.id === id);
}
