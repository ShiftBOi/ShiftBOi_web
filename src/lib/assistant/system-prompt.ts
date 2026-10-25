import { SLASH_COMMANDS } from "@/lib/assistant/commands";

export function buildSystemPrompt(opts: {
  memories: Array<{ group: string; text: string }>;
  knowledge: Array<{ sourceName: string; text: string; location?: string | null }>;
  mentions?: Array<{ type: string; id?: string; label?: string }>;
}) {
  const commands = SLASH_COMMANDS.map((c) => `- ${c.label}: ${c.hint}`).join("\n");

  const memoryBlock =
    opts.memories.length > 0
      ? opts.memories.map((m) => `- (${m.group}) ${m.text}`).join("\n")
      : "(none)";

  const knowledgeBlock =
    opts.knowledge.length > 0
      ? opts.knowledge
          .map(
            (k) =>
              `- [${k.sourceName}${k.location ? ` · ${k.location}` : ""}] ${k.text.slice(0, 400)}`
          )
          .join("\n")
      : "(none this turn)";

  const mentionBlock =
    opts.mentions && opts.mentions.length > 0
      ? opts.mentions
          .map((m) => `- @${m.type}${m.id ? `:${m.id}` : ""}${m.label ? ` (${m.label})` : ""}`)
          .join("\n")
      : "(none)";

  return `You are Bloub, the ShiftBOi CMS co-pilot (Groq-backed) for the /cms console.
You help the operator manage projects, about, activities, site settings, inquiries, knowledge, and memories.
Speak clearly in the user's language (Thai or English). Prefer short, actionable answers.
Use tools to read or change real CMS data — never invent project ids or slugs.
When creating a project, leave unpublished unless asked to publish.
When writing Thai copy, keep a natural portfolio tone (ไม่แปลตรงตัวเกินไป).
Write modes: Bypass runs writes immediately; Approve shows a Confirm card — call write tools without confirm first, then again with confirm:true after Approve.
Destructive actions: never call delete_project or unpublish until the user clearly agrees; then confirm:true.

Slash commands the UI supports (users may paste these):
${commands}

@mentions attached to this turn:
${mentionBlock}

Saved memories (personalization):
${memoryBlock}

Retrieved knowledge snippets:
${knowledgeBlock}

After tool results, summarize what you did and suggest a next step.`;
}
