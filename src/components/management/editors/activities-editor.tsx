"use client";

import {
  CmsEmpty,
  CmsHeader,
  CmsMessage,
  CmsPanel,
  CmsTabs,
  CmsToolbar,
} from "@/components/management/cms-chrome";
import { ContentBlocksEditor } from "@/components/management/content-blocks-editor";
import { R2Finder } from "@/components/management/r2-finder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import {
  Check,
  Edit2,
  FolderOpen,
  Pencil,
  Tags,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `activity-${Date.now()}`
  );
}

type ActivityRow = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  isPublished: boolean;
  publishedAt: string;
  activityType?: { id: string; type: string; color: string } | null;
  detail?: string;
};

type TypeRow = { id: string; type: string; color: string };

const PRESET_COLORS = [
  "#e82434",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#94a3b8",
];

function toDateInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ActivitiesEditor() {
  const [tab, setTab] = useState<"items" | "types">("items");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#e82434");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeColor, setEditTypeColor] = useState("");
  const [coverFinderFor, setCoverFinderFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [actRes, typesRes] = await Promise.all([
      fetchJson<{ success?: boolean; data?: any[]; error?: string }>(
        "/api/cms/activities?management=true"
      ),
      fetchJson<{ success?: boolean; data?: TypeRow[] }>("/api/cms/activity-types"),
    ]);
    if (!actRes.ok) {
      setMessage(actRes.data.error || "Failed to load activities");
      return;
    }
    setRows(
      (actRes.data.data || []).map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        coverImage: n.coverImage,
        isPublished: n.isPublished,
        publishedAt: n.publishedAt,
        activityType: n.activityType,
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
          r.slug.toLowerCase().includes(search.toLowerCase()) ||
          (r.activityType?.type || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [rows, search]
  );

  async function createActivity() {
    const defaultType =
      types.find((t) => t.type === "Activity") || types[0] || null;
    const { ok, data } = await fetchJson<{
      data?: { id: string };
      error?: string;
    }>("/api/cms/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New activity",
        isPublished: false,
        activityTypeId: defaultType?.id ?? null,
        detail: JSON.stringify([
          { id: crypto.randomUUID(), type: "text", value: "" },
        ]),
      }),
    });
    if (!ok) {
      setMessage(data.error || "Create failed");
      return;
    }
    await load();
    if (data.data?.id) setEditingId(data.data.id);
  }

  async function saveActivity(row: ActivityRow) {
    const { ok, data } = await fetchJson<{ error?: string }>(
      `/api/cms/activities/${row.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugifyTitle(row.slug || row.title),
          title: row.title,
          detail: row.detail,
          isPublished: row.isPublished,
          publishedAt: row.publishedAt,
          activityTypeId: row.activityType?.id ?? null,
          coverImage: row.coverImage,
        }),
      }
    );
    setMessage(ok ? `Saved ${row.title}` : data.error || "Save failed");
    if (ok) {
      setEditingId(null);
      await load();
    }
  }

  async function removeActivity(id: string) {
    if (!window.confirm("Delete this activity?")) return;
    await fetchJson(`/api/cms/activities/${id}`, { method: "DELETE" });
    await load();
  }

  function patchRow(id: string, patch: Partial<ActivityRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function createType() {
    if (!newTypeName.trim()) return;
    const { ok, data } = await fetchJson<{ error?: string }>(
      "/api/cms/activity-types",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newTypeName, color: newTypeColor }),
      }
    );
    if (!ok) {
      setMessage(data.error || "Create type failed");
      return;
    }
    setShowNewType(false);
    setNewTypeName("");
    await load();
  }

  async function updateType(id: string) {
    await fetchJson(`/api/cms/activity-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: editTypeName, color: editTypeColor }),
    });
    setEditingTypeId(null);
    await load();
  }

  async function deleteType(id: string) {
    if (!window.confirm("Delete this type?")) return;
    await fetchJson(`/api/cms/activity-types/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <CmsHeader
        eyebrow="Content"
        title="Activities & Updates"
        subtitle="Publish dated notes with rich text, images, and links — types you can extend"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsTabs
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "items",
            label: "Activities",
            hint: "Posts & details",
            icon: Zap,
            count: rows.length,
          },
          {
            id: "types",
            label: "Types",
            hint: "Activity · Update · …",
            icon: Tags,
            count: types.length,
          },
        ]}
      />

      {tab === "items" ? (
        <>
          <CmsToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search activities…"
            onAdd={createActivity}
            addLabel="Add Activity"
          />
          {filtered.length === 0 ? (
            <CmsEmpty>
              No activities yet — add one, or seed types first.
            </CmsEmpty>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <CmsPanel key={item.id} className="!p-4">
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs text-muted-foreground sm:col-span-2">
                          Title
                          <Input
                            className="mt-1 h-10 rounded-full px-4"
                            value={item.title}
                            onChange={(e) =>
                              patchRow(item.id, { title: e.target.value })
                            }
                            placeholder="Title"
                          />
                        </label>
                        <label className="block text-xs text-muted-foreground sm:col-span-2">
                          URL slug
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              /activities/
                            </span>
                            <Input
                              className="h-10 min-w-0 flex-1 rounded-full px-4 font-mono text-sm"
                              value={item.slug}
                              onChange={(e) =>
                                patchRow(item.id, {
                                  slug: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]+/g, "-")
                                    .replace(/--+/g, "-"),
                                })
                              }
                              onBlur={() => {
                                const clean = slugifyTitle(item.slug || item.title);
                                if (clean !== item.slug) {
                                  patchRow(item.id, { slug: clean });
                                }
                              }}
                              placeholder="my-activity-slug"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full"
                              onClick={() =>
                                patchRow(item.id, {
                                  slug: slugifyTitle(item.title),
                                })
                              }
                            >
                              From title
                            </Button>
                          </div>
                        </label>
                        <label className="block text-xs text-muted-foreground">
                          Publish date
                          <Input
                            type="date"
                            className="mt-1 h-10 rounded-full px-4"
                            value={toDateInput(item.publishedAt)}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (!v) return;
                              patchRow(item.id, {
                                publishedAt: new Date(
                                  `${v}T12:00:00`
                                ).toISOString(),
                              });
                            }}
                          />
                        </label>
                        <label className="block text-xs text-muted-foreground">
                          Type
                          <select
                            className="cms-input mt-1 h-10 w-full rounded-full border-[var(--cms-line)] bg-[var(--cms-input)] px-4 text-sm"
                            value={item.activityType?.id || ""}
                            onChange={(e) => {
                              const t = types.find(
                                (x) => x.id === e.target.value
                              );
                              patchRow(item.id, {
                                activityType: t
                                  ? {
                                      id: t.id,
                                      type: t.type,
                                      color: t.color,
                                    }
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
                        </label>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Cover
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            className="h-10 min-w-[12rem] flex-1 rounded-full px-4"
                            value={item.coverImage || ""}
                            onChange={(e) =>
                              patchRow(item.id, {
                                coverImage: e.target.value || null,
                              })
                            }
                            placeholder="Cover image URL"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setCoverFinderFor(item.id)}
                          >
                            <FolderOpen className="size-4" />
                            R2
                          </Button>
                        </div>
                        {item.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverImage}
                            alt=""
                            className="mt-2 h-28 w-full max-w-md rounded-xl object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Detail · rich text
                        </p>
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                          <ContentBlocksEditor
                            description={item.detail || ""}
                            onChange={(json) =>
                              patchRow(item.id, { detail: json })
                            }
                            tone="light"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isPublished}
                          onChange={(e) =>
                            patchRow(item.id, {
                              isPublished: e.target.checked,
                            })
                          }
                        />
                        Published
                      </label>
                      <div className="flex gap-2">
                        <Button
                          className="rounded-full"
                          onClick={() =>
                            saveActivity(
                              rows.find((r) => r.id === item.id) || item
                            )
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
                          backgroundColor:
                            item.activityType?.color || "#e82434",
                        }}
                      >
                        {item.activityType?.type?.slice(0, 2) || "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold">
                            {item.title}
                          </h3>
                          {item.activityType ? (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                              style={{
                                backgroundColor: item.activityType.color,
                              }}
                            >
                              {item.activityType.type}
                            </span>
                          ) : null}
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
                          /{item.slug} ·{" "}
                          {new Date(item.publishedAt).toLocaleDateString()}
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
                          onClick={() => removeActivity(item.id)}
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
          <R2Finder
            open={Boolean(coverFinderFor)}
            folder="coverimage"
            title="Activity cover · R2"
            onClose={() => setCoverFinderFor(null)}
            onSelect={(url) => {
              if (!coverFinderFor) return;
              patchRow(coverFinderFor, { coverImage: url });
              setCoverFinderFor(null);
            }}
          />
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
                placeholder="Type name (e.g. Talk, Award)"
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "size-8 rounded-full",
                      newTypeColor === color
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
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
