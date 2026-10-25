"use client";

import {
  CmsEmpty,
  CmsHeader,
  CmsMessage,
  CmsPanel,
  CmsTabs,
  CmsToolbar,
} from "@/components/management/cms-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import { Check, Edit2, Newspaper, Pencil, Tags, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  isPublished: boolean;
  publishedAt: string;
  newsType?: { id: string; type: string; color: string } | null;
  detail?: string;
};

type TypeRow = { id: string; type: string; color: string };

const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function NewsEditor() {
  const [tab, setTab] = useState<"news" | "types">("news");
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#3b82f6");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeColor, setEditTypeColor] = useState("");

  const load = useCallback(async () => {
    const [newsRes, typesRes] = await Promise.all([
      fetchJson<{ success?: boolean; data?: any[]; error?: string }>(
        "/api/news?management=true"
      ),
      fetchJson<{ success?: boolean; data?: TypeRow[] }>("/api/news-types"),
    ]);
    if (!newsRes.ok) {
      setMessage(newsRes.data.error || "Failed to load news");
      return;
    }
    setRows(
      (newsRes.data.data || []).map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        coverImage: n.coverImage,
        isPublished: n.isPublished,
        publishedAt: n.publishedAt,
        newsType: n.newsType,
        detail: n.translations?.en?.detail || "",
      }))
    );
    if (typesRes.ok && typesRes.data.data) setTypes(typesRes.data.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  async function createNews() {
    const { ok, data } = await fetchJson<{ data?: { id: string }; error?: string }>(
      "/api/news",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New post", isPublished: false }),
      }
    );
    if (!ok) {
      setMessage(data.error || "Create failed");
      return;
    }
    await load();
    if (data.data?.id) setEditingId(data.data.id);
  }

  async function saveNews(row: NewsRow) {
    const { ok, data } = await fetchJson<{ error?: string }>(`/api/news/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: row.slug,
        title: row.title,
        detail: row.detail,
        isPublished: row.isPublished,
        newsTypeId: row.newsType?.id ?? null,
        coverImage: row.coverImage,
      }),
    });
    setMessage(ok ? `Saved ${row.title}` : data.error || "Save failed");
    if (ok) {
      setEditingId(null);
      await load();
    }
  }

  async function removeNews(id: string) {
    if (!window.confirm("Delete this news post?")) return;
    await fetchJson(`/api/news/${id}`, { method: "DELETE" });
    await load();
  }

  function patchNews(id: string, patch: Partial<NewsRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function createType() {
    if (!newTypeName.trim()) return;
    const { ok, data } = await fetchJson<{ error?: string }>("/api/news-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newTypeName, color: newTypeColor }),
    });
    if (!ok) {
      setMessage(data.error || "Create type failed");
      return;
    }
    setShowNewType(false);
    setNewTypeName("");
    await load();
  }

  async function updateType(id: string) {
    await fetchJson(`/api/news-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: editTypeName, color: editTypeColor }),
    });
    setEditingTypeId(null);
    await load();
  }

  async function deleteType(id: string) {
    if (!window.confirm("Delete news type?")) return;
    await fetchJson(`/api/news-types/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <CmsHeader
        eyebrow="News"
        title="News"
        subtitle="Same tabs as ttianqii-web — posts list + types table"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsTabs
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "news",
            label: "News",
            hint: "Posts & covers",
            icon: Newspaper,
            count: rows.length,
          },
          {
            id: "types",
            label: "Types",
            hint: "Categories",
            icon: Tags,
            count: types.length,
          },
        ]}
      />

      {tab === "news" ? (
        <>
          <CmsToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search news…"
            onAdd={createNews}
            addLabel="Add News"
          />
          {filtered.length === 0 ? (
            <CmsEmpty>No news posts found</CmsEmpty>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <CmsPanel key={item.id} className="!p-4">
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          className="h-10 rounded-full px-4"
                          value={item.title}
                          onChange={(e) => patchNews(item.id, { title: e.target.value })}
                          placeholder="Title"
                        />
                        <Input
                          className="h-10 rounded-full px-4"
                          value={item.slug}
                          onChange={(e) => patchNews(item.id, { slug: e.target.value })}
                          placeholder="Slug"
                        />
                        <select
                          className="cms-input h-10 rounded-full border-[var(--cms-line)] bg-[var(--cms-input)] px-4 text-sm sm:col-span-2"
                          value={item.newsType?.id || ""}
                          onChange={(e) => {
                            const t = types.find((x) => x.id === e.target.value);
                            patchNews(item.id, {
                              newsType: t
                                ? { id: t.id, type: t.type, color: t.color }
                                : null,
                            });
                          }}
                        >
                          <option value="">No type</option>
                          {types.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Textarea
                        className="min-h-28 rounded-3xl px-4 py-3"
                        value={item.detail || ""}
                        onChange={(e) => patchNews(item.id, { detail: e.target.value })}
                        placeholder="Detail"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isPublished}
                          onChange={(e) =>
                            patchNews(item.id, { isPublished: e.target.checked })
                          }
                        />
                        Published
                      </label>
                      <div className="flex gap-2">
                        <Button
                          className="rounded-full"
                          onClick={() =>
                            saveNews(rows.find((r) => r.id === item.id) || item)
                          }
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
                    <div className="flex items-center gap-4">
                      <div
                        className="grid size-14 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                        style={{
                          backgroundColor: item.newsType?.color || "#3B6BFF",
                        }}
                      >
                        {item.newsType?.type?.slice(0, 2) || "N"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold">{item.title}</h3>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              item.isPublished
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {item.isPublished ? "Live" : "Draft"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          /{item.slug} · {new Date(item.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeNews(item.id)}
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
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button
              className="rounded-full"
              onClick={() => {
                setShowNewType((v) => !v);
                setEditingTypeId(null);
              }}
            >
              New Type
            </Button>
          </div>
          {showNewType ? (
            <CmsPanel className="mb-4 space-y-3">
              <Input
                className="h-10 rounded-full px-4"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Type name"
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "size-8 rounded-full",
                      newTypeColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTypeColor(color)}
                  />
                ))}
              </div>
              <Button className="rounded-full" onClick={createType}>
                Create
              </Button>
            </CmsPanel>
          ) : null}
          <div className="overflow-hidden rounded-[20px] bg-white/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="w-16 px-5 py-4">Color</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="w-24 px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((pt) => (
                  <tr key={pt.id} className="border-b border-border/40">
                    {editingTypeId === pt.id ? (
                      <td colSpan={3} className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            className="h-9 max-w-xs rounded-full px-3"
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                          />
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "size-7 rounded-full",
                                editTypeColor === color
                                  ? "ring-2 ring-primary ring-offset-1"
                                  : ""
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => setEditTypeColor(color)}
                            />
                          ))}
                          <button
                            type="button"
                            className="p-2 text-emerald-600"
                            onClick={() => updateType(pt.id)}
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-red-600"
                            onClick={() => setEditingTypeId(null)}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-4">
                          <div
                            className="size-8 rounded-full"
                            style={{ backgroundColor: pt.color }}
                          />
                        </td>
                        <td className="px-5 py-4 font-medium">{pt.type}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditingTypeId(pt.id);
                                setEditTypeName(pt.type);
                                setEditTypeColor(pt.color);
                              }}
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-muted-foreground hover:text-red-600"
                              onClick={() => deleteType(pt.id)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
