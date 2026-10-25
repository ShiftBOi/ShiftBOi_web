"use client";

import {
  CmsEmpty,
  CmsHeader,
  CmsMessage,
  CmsPanel,
  CmsToolbar,
} from "@/components/management/cms-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetch-json";
import { SKILL_CATEGORY_ORDER } from "@/lib/skill-badges";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type SkillRow = {
  id: string;
  name: string;
  category: string;
  sortOrder: number;
};

export function SkillsEditor() {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: any[];
      error?: string;
    }>("/api/cms/about/skills");
    if (!ok) {
      setMessage(data.error || "Failed to load");
      return;
    }
    setSkills(
      (data.data || []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        sortOrder: s.order,
      }))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      skills.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.category.toLowerCase().includes(search.toLowerCase())
      ),
    [skills, search]
  );

  const groups = useMemo(() => {
    const known = SKILL_CATEGORY_ORDER.map((cat) => ({
      title: cat,
      category: cat,
      items: filtered.filter((s) => s.category === cat),
    }));
    const extras = Array.from(new Set(filtered.map((s) => s.category)))
      .filter((cat) => !(SKILL_CATEGORY_ORDER as readonly string[]).includes(cat))
      .map((cat) => ({
        title: cat,
        category: cat,
        items: filtered.filter((s) => s.category === cat),
      }));
    return [...known, ...extras];
  }, [filtered]);

  function patch(id: string, p: Partial<SkillRow>) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }

  async function create(category: string) {
    const { ok, data } = await fetchJson<{ data?: { id: string }; error?: string }>(
      "/api/cms/about/skills",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New skill", category }),
      }
    );
    if (!ok) {
      setMessage(data.error || "Create failed");
      return;
    }
    await load();
    if (data.data?.id) setEditingId(data.data.id);
  }

  async function save(skill: SkillRow) {
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/cms/about/skills/${skill.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(skill),
    });
    setMessage(ok ? `Saved ${skill.name}` : data.error || "Save failed");
    if (ok) {
      setEditingId(null);
      await load();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete skill?")) return;
    await fetchJson(`/api/cms/about/skills/${id}`, { method: "DELETE" });
    await load();
  }

  function renderGroup(title: string, items: SkillRow[], category: string) {
    return (
      <section key={category} className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button size="sm" className="rounded-full" onClick={() => create(category)}>
            Add
          </Button>
        </div>
        {items.length === 0 ? (
          <CmsEmpty>No {title.toLowerCase()} yet</CmsEmpty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((skill) =>
              editingId === skill.id ? (
                <CmsPanel key={skill.id} className="w-full max-w-md !p-4">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="h-9 flex-1 rounded-full px-3"
                      value={skill.name}
                      onChange={(e) => patch(skill.id, { name: e.target.value })}
                    />
                    <select
                      className="cms-input h-9 rounded-full border-[var(--cms-line)] bg-[var(--cms-input)] px-3 text-sm"
                      value={skill.category}
                      onChange={(e) => patch(skill.id, { category: e.target.value })}
                    >
                      {SKILL_CATEGORY_ORDER.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => save(skills.find((s) => s.id === skill.id) || skill)}
                    >
                      Save
                    </Button>
                  </div>
                </CmsPanel>
              ) : (
                <div
                  key={skill.id}
                  className="group inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm ring-1 ring-border/50"
                >
                  <span className="font-medium">{skill.name}</span>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground opacity-60 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                    onClick={() => setEditingId(skill.id)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    onClick={() => remove(skill.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div>
      <CmsHeader
        eyebrow="Skills"
        title="Stack & tools"
        subtitle="Colored badges by category — languages, frontend, backend, devops, tools"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsToolbar search={search} onSearch={setSearch} placeholder="Search skills…" />
      {groups.map((g) => renderGroup(g.title, g.items, g.category))}
    </div>
  );
}
