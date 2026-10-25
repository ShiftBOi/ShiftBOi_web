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
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetch-json";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type WorkRow = {
  id: string;
  year: string;
  sortOrder: number;
  title: string;
  company: string;
  description: string;
};

export function ExperienceEditor() {
  const [rows, setRows] = useState<WorkRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: any[];
      error?: string;
    }>("/api/cms/about/work-experience");
    if (!ok) {
      setMessage(data.error || "Failed to load");
      return;
    }
    setRows(
      (data.data || []).map((item) => ({
        id: item.id,
        year: item.year,
        sortOrder: item.order,
        title: item.translationEn?.title || "",
        company: item.translationEn?.company || "",
        description: item.translationEn?.description || "",
      }))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.company.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  async function create() {
    const { ok, data } = await fetchJson<{ data?: { id: string }; error?: string }>(
      "/api/cms/about/work-experience",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New role", year: String(new Date().getFullYear()) }),
      }
    );
    if (!ok) {
      setMessage(data.error || "Create failed");
      return;
    }
    await load();
    if (data.data?.id) setEditingId(data.data.id);
  }

  async function save(row: WorkRow) {
    const current = rows.find((r) => r.id === row.id) || row;
    const { ok, data } = await fetchJson<{ error?: string }>(
      `/api/cms/about/work-experience/${current.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      }
    );
    setMessage(ok ? `Saved ${current.title}` : data.error || "Save failed");
    if (ok) {
      setEditingId(null);
      await load();
    }
  }

  function patch(id: string, p: Partial<WorkRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this role?")) return;
    await fetchJson(`/api/cms/about/work-experience/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <CmsHeader
        eyebrow="Experience"
        title="Work roles"
        subtitle="Card list like ttianqii-web — search, add, inline edit"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search roles…"
        onAdd={create}
        addLabel="Add Role"
      />

      {filtered.length === 0 ? (
        <CmsEmpty>No roles found</CmsEmpty>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const editing = editingId === row.id;
            return (
              <CmsPanel key={row.id}>
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        className="h-10 rounded-full px-4"
                        value={row.title}
                        onChange={(e) => {
                          const next = [...rows];
                          const i = rows.findIndex((r) => r.id === row.id);
                          next[i] = { ...row, title: e.target.value };
                          setRows(next);
                        }}
                        placeholder="Title"
                      />
                      <Input
                        className="h-10 rounded-full px-4"
                        value={row.company}
                        onChange={(e) => {
                          const next = [...rows];
                          const i = rows.findIndex((r) => r.id === row.id);
                          next[i] = { ...row, company: e.target.value };
                          setRows(next);
                        }}
                        placeholder="Company"
                      />
                      <Input
                        className="h-10 rounded-full px-4"
                        value={row.year}
                        onChange={(e) => {
                          const next = [...rows];
                          const i = rows.findIndex((r) => r.id === row.id);
                          next[i] = { ...row, year: e.target.value };
                          setRows(next);
                        }}
                        placeholder="Year"
                      />
                    </div>
                    <Textarea
                      className="rounded-3xl px-4 py-3"
                      value={row.description}
                      onChange={(e) => {
                        const next = [...rows];
                        const i = rows.findIndex((r) => r.id === row.id);
                        next[i] = { ...row, description: e.target.value };
                        setRows(next);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button className="rounded-full" onClick={() => save(row)}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-lg font-semibold">{row.title || "Untitled"}</h3>
                        <span className="text-xs text-muted-foreground">{row.year}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{row.company}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {row.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        onClick={() => setEditingId(row.id)}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        onClick={() => remove(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </CmsPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
