export type ToolServerId =
  | "content"
  | "settings"
  | "knowledge"
  | "memory";

export type BuiltinToolDef = {
  id: string;
  server: ToolServerId;
  name: string;
  description: string;
  access: "read" | "write";
  /** Rough context tokens for the Tools panel meter */
  tokens: number;
};

export const TOOL_SERVERS: {
  id: ToolServerId;
  name: string;
  transport: "builtin";
}[] = [
  { id: "content", name: "ShiftBOi Content", transport: "builtin" },
  { id: "settings", name: "Site Settings", transport: "builtin" },
  { id: "knowledge", name: "Platform Knowledge", transport: "builtin" },
  { id: "memory", name: "Assistant Memory", transport: "builtin" },
];

export const BUILTIN_TOOLS: BuiltinToolDef[] = [
  {
    id: "list_projects",
    server: "content",
    name: "list_projects",
    description: "List CMS projects (slug, title, year, published).",
    access: "read",
    tokens: 220,
  },
  {
    id: "search_projects",
    server: "content",
    name: "search_projects",
    description: "Search projects by title/summary/stack keywords.",
    access: "read",
    tokens: 260,
  },
  {
    id: "get_project",
    server: "content",
    name: "get_project",
    description: "Get one project by slug or id with core copy fields.",
    access: "read",
    tokens: 380,
  },
  {
    id: "create_project",
    server: "content",
    name: "create_project",
    description: "Create a new project (approval mode needs confirm:true).",
    access: "write",
    tokens: 300,
  },
  {
    id: "update_project",
    server: "content",
    name: "update_project",
    description: "Update project fields by slug/id.",
    access: "write",
    tokens: 340,
  },
  {
    id: "delete_project",
    server: "content",
    name: "delete_project",
    description: "Permanently delete a project (confirm:true).",
    access: "write",
    tokens: 240,
  },
  {
    id: "get_about",
    server: "content",
    name: "get_about",
    description: "Read about / profile bundle (headline, bio, pitch, skills).",
    access: "read",
    tokens: 280,
  },
  {
    id: "update_about_field",
    server: "content",
    name: "update_about_field",
    description: "Update headline, bio, or pitch.",
    access: "write",
    tokens: 300,
  },
  {
    id: "update_profile_field",
    server: "content",
    name: "update_profile_field",
    description: "Update profile chrome (name, title, wordmark, email…).",
    access: "write",
    tokens: 280,
  },
  {
    id: "list_activities",
    server: "content",
    name: "list_activities",
    description: "List Activities & Updates posts.",
    access: "read",
    tokens: 240,
  },
  {
    id: "create_activity",
    server: "content",
    name: "create_activity",
    description: "Create an unpublished activity post.",
    access: "write",
    tokens: 280,
  },
  {
    id: "list_inquiries",
    server: "content",
    name: "list_inquiries",
    description: "List recent contact form inquiries.",
    access: "read",
    tokens: 260,
  },
  {
    id: "summarize_inquiries",
    server: "content",
    name: "summarize_inquiries",
    description: "Summarize recent inquiries (counts and themes).",
    access: "read",
    tokens: 240,
  },
  {
    id: "mark_inquiry_read",
    server: "content",
    name: "mark_inquiry_read",
    description: "Mark one inquiry as read or unread.",
    access: "write",
    tokens: 180,
  },
  {
    id: "search_cms",
    server: "content",
    name: "search_cms",
    description: "Keyword search across projects, about, and activities.",
    access: "read",
    tokens: 320,
  },
  {
    id: "get_site_setting",
    server: "settings",
    name: "get_site_setting",
    description: "Read a site setting JSON blob by key.",
    access: "read",
    tokens: 220,
  },
  {
    id: "update_site_setting",
    server: "settings",
    name: "update_site_setting",
    description: "Upsert a site setting JSON value.",
    access: "write",
    tokens: 280,
  },
  {
    id: "remember",
    server: "memory",
    name: "remember",
    description: "Save a short memory fact about the operator.",
    access: "write",
    tokens: 180,
  },
  {
    id: "forget_memory",
    server: "memory",
    name: "forget_memory",
    description: "Delete a saved memory by key.",
    access: "write",
    tokens: 160,
  },
  {
    id: "list_memories",
    server: "memory",
    name: "list_memories",
    description: "List saved operator memories.",
    access: "read",
    tokens: 160,
  },
  {
    id: "search_knowledge",
    server: "knowledge",
    name: "search_knowledge",
    description: "Retrieve relevant knowledge chunks for a query.",
    access: "read",
    tokens: 300,
  },
  {
    id: "help_commands",
    server: "content",
    name: "help_commands",
    description: "List slash commands, @mentions, and write modes.",
    access: "read",
    tokens: 200,
  },
];

export const ALL_TOOL_IDS = BUILTIN_TOOLS.map((t) => t.id);
