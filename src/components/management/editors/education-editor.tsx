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
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type EduRow = {
  id: string;
  sortOrder: number;
  degree: string;
  institution: string;
  field: string;
};

export function EducationEditor() {
  const [rows, setRows] = useState<EduRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: any[];
      error?: string;
    }>("/api/cms/about/education");
    if (!ok) {
      setMessage(data.error || "Failed to load");
      return;
    }
    setRows(
      (data.data || []).map((item) => ({
        id: item.id,
        sortOrder: item.order,
        degree: item.translationEn?.degree || "",
        institution: item.translationEn?.institution || "",
        field: item.translationEn?.field || "",
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
          r.degree.toLowerCase().includes(search.toLowerCase()) ||
          r.institution.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  function patch(id: string, patch: Partial<EduRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function create() {
    const { ok, data } = await fetchJson<{ data?: { id: string }; error?: string }>(
      "/api/cms/about/education",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ degree: "New degree" }),
      }
    );
    if (!ok) {
      setMessage(data.error || "Create failed");
      return;
    }
    await load();
    if (data.data?.id) setEditingId(data.data.id);
  }

  async function save(row: EduRow) {
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/cms/about/education/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setMessage(ok ? `Saved ${row.degree}` : data.error || "Save failed");
    if (ok) {
      setEditingId(null);
      await load();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this degree?")) return;
    await fetchJson(`/api/cms/about/education/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <CmsHeader
        eyebrow="Education"
        title="Degrees"
        subtitle="Card list with search · add · inline edit"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search degrees…"
        onAdd={create}
        addLabel="Add Degree"
      />

      {filtered.length === 0 ? (
        <CmsEmpty>No education found</CmsEmpty>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <CmsPanel key={row.id}>
              {editingId === row.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      className="h-10 rounded-full px-4"
                      value={row.degree}
                      onChange={(e) => patch(row.id, { degree: e.target.value })}
                      placeholder="Degree"
                    />
                    <Input
                      className="h-10 rounded-full px-4"
                      value={row.field}
                      onChange={(e) => patch(row.id, { field: e.target.value })}
                      placeholder="Field"
                    />
                    <Input
                      className="h-10 rounded-full px-4 sm:col-span-2"
                      value={row.institution}
                      onChange={(e) => patch(row.id, { institution: e.target.value })}
                      placeholder="Institution"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="rounded-full"
                      onClick={() => save(rows.find((r) => r.id === row.id) || row)}
                    >
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
                    <h3 className="text-lg font-semibold">{row.degree || "Untitled"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{row.institution}</p>
                    <p className="text-sm text-muted-foreground">{row.field}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
