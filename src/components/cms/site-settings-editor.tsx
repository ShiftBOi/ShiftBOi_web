"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  EngagementTier,
  FocusItem,
  SiteContent,
  StatItem,
} from "@/lib/content";
import { InlineEditField } from "@/components/cms/inline-edit-field";
import { CmsTouchCardEditor } from "@/components/cms/cms-touch-card-editor";
import { CmsFloatingSave } from "@/components/cms/cms-floating-save";
import { useCmsNotify } from "@/components/cms/cms-notify";

async function patchSetting(key: string, value: unknown) {
  const res = await fetch("/api/cms/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Update failed");
  }
}

function newFocusId() {
  return `focus-${Date.now().toString(36)}`;
}

export function SiteSettingsEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const notify = useCmsNotify();
  const [site, setSite] = useState(initial);
  const [statsDraft, setStatsDraft] = useState<StatItem[]>(initial.stats);
  const [focusDraft, setFocusDraft] = useState<FocusItem[]>(initial.focus);
  const [engagementDraft, setEngagementDraft] = useState<EngagementTier[]>(
    initial.engagement,
  );
  const [savingLists, setSavingLists] = useState(false);

  useEffect(() => {
    setSite(initial);
    setStatsDraft(initial.stats);
    setFocusDraft(initial.focus);
    setEngagementDraft(initial.engagement);
  }, [initial]);

  const listsDirty = useMemo(() => {
    return (
      JSON.stringify(statsDraft) !== JSON.stringify(site.stats) ||
      JSON.stringify(focusDraft) !== JSON.stringify(site.focus) ||
      JSON.stringify(engagementDraft) !== JSON.stringify(site.engagement)
    );
  }, [statsDraft, focusDraft, engagementDraft, site]);

  async function saveHero(partial: Partial<SiteContent["hero"]>) {
    const next = { ...site.hero, ...partial };
    await patchSetting("hero", next);
    setSite((s) => ({ ...s, hero: next }));
    router.refresh();
  }

  async function saveContact(partial: Partial<SiteContent["contact"]>) {
    const next = { ...site.contact, ...partial };
    await patchSetting("contact", next);
    setSite((s) => ({ ...s, contact: next }));
    router.refresh();
  }

  async function saveServices(partial: Partial<SiteContent["services"]>) {
    const next = { ...site.services, ...partial };
    await patchSetting("services", next);
    setSite((s) => ({ ...s, services: next }));
    router.refresh();
  }

  async function saveServicesItemsJson(raw: string) {
    const parsed = JSON.parse(raw) as SiteContent["services"]["items"];
    if (!Array.isArray(parsed)) throw new Error("Services items must be an array");
    await saveServices({ items: parsed });
  }

  async function saveBrand(partial: Partial<SiteContent["brand"]>) {
    const next = { ...site.brand, ...partial };
    await patchSetting("brand", next);
    setSite((s) => ({ ...s, brand: next }));
    router.refresh();
  }

  async function saveListSections() {
    setSavingLists(true);
    try {
      await Promise.all([
        patchSetting("stats", statsDraft),
        patchSetting("focus", focusDraft),
        patchSetting("engagement", engagementDraft),
      ]);
      setSite((s) => ({
        ...s,
        stats: statsDraft,
        focus: focusDraft,
        engagement: engagementDraft,
      }));
      notify.success("Site lists saved");
      router.refresh();
    } catch (err) {
      notify.error(
        "Could not save lists",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setSavingLists(false);
    }
  }

  function discardLists() {
    setStatsDraft(site.stats);
    setFocusDraft(site.focus);
    setEngagementDraft(site.engagement);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      if (!listsDirty || savingLists) return;
      e.preventDefault();
      void saveListSections();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="cms-site-page">
      <section className="cms-panel cms-panel--accent">
        <div className="cms-panel-head-row">
          <div>
            <p className="cms-dash-kicker">Public card</p>
            <h2 className="cms-panel-title">Get in touch</h2>
            <p className="cms-panel-lead">
              Click text on the card to edit in place. Messages land in{" "}
              <a href="/cms/inquiries">Inquiries</a>.
            </p>
          </div>
          <a href="/#get-in-touch" className="cms-dash-action" target="_blank" rel="noreferrer">
            Preview card
          </a>
        </div>
        <CmsTouchCardEditor contact={site.contact} onSave={saveContact} />
      </section>

      <section className="cms-panel">
        <div className="cms-panel-head-row">
          <div>
            <p className="cms-dash-kicker">Public folders</p>
            <h2 className="cms-panel-title">Services</h2>
            <p className="cms-panel-lead">
              Soft service cards on the homepage. Each item needs{" "}
              <code>id</code>, <code>title</code>, <code>summary</code>,{" "}
              <code>tags</code>, optional <code>figure</code> (SVG path).
            </p>
          </div>
          <a href="/#services" className="cms-dash-action" target="_blank" rel="noreferrer">
            Preview
          </a>
        </div>
        <div className="cms-form-stack">
          <InlineEditField
            label="Eyebrow"
            value={site.services.eyebrow}
            onSave={(v) => saveServices({ eyebrow: v })}
          />
          <InlineEditField
            label="Title"
            value={site.services.title}
            onSave={(v) => saveServices({ title: v })}
          />
          <InlineEditField
            label="Lead"
            value={site.services.lead}
            multiline
            onSave={(v) => saveServices({ lead: v })}
          />
          <InlineEditField
            label="Items JSON"
            value={JSON.stringify(site.services.items, null, 2)}
            multiline
            onSave={async (raw) => {
              try {
                await saveServicesItemsJson(raw);
              } catch {
                throw new Error("Invalid JSON for service items");
              }
            }}
          />
        </div>
      </section>

      <section className="cms-panel">
        <h2 className="cms-panel-title">Hero</h2>
        <div className="cms-form-stack">
          <InlineEditField
            label="Eyebrow"
            value={site.hero.eyebrow}
            onSave={(v) => saveHero({ eyebrow: v })}
          />
          <InlineEditField
            label="Name"
            value={site.hero.name}
            onSave={(v) => saveHero({ name: v })}
          />
          <InlineEditField
            label="Paragraph 1"
            value={site.hero.paragraphs[0] ?? ""}
            multiline
            onSave={(v) =>
              saveHero({
                paragraphs: [v, site.hero.paragraphs[1] ?? ""],
              })
            }
          />
          <InlineEditField
            label="Paragraph 2"
            value={site.hero.paragraphs[1] ?? ""}
            multiline
            onSave={(v) =>
              saveHero({
                paragraphs: [site.hero.paragraphs[0] ?? "", v],
              })
            }
          />
          <InlineEditField
            label="CTA label"
            value={site.hero.ctaLabel}
            onSave={(v) => saveHero({ ctaLabel: v })}
          />
        </div>
      </section>

      <section className="cms-panel">
        <h2 className="cms-panel-title">Brand</h2>
        <div className="cms-form-stack">
          <InlineEditField
            label="Name"
            value={site.brand.name}
            onSave={(v) => saveBrand({ name: v })}
          />
          <InlineEditField
            label="Tagline"
            value={site.brand.tagline}
            onSave={(v) => saveBrand({ tagline: v })}
          />
        </div>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-head-row">
          <div>
            <h2 className="cms-panel-title">Stats</h2>
            <p className="cms-panel-lead">Homepage metric chips.</p>
          </div>
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              setStatsDraft((rows) => [...rows, { value: "New", label: "Label" }])
            }
          >
            Add stat
          </button>
        </div>
        <div className="cms-form-stack">
          {statsDraft.map((row, index) => (
            <div key={`stat-${index}`} className="cms-passkey-row">
              <label className="cms-field" style={{ flex: 1 }}>
                <span>Value</span>
                <input
                  value={row.value}
                  onChange={(e) =>
                    setStatsDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, value: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field" style={{ flex: 2 }}>
                <span>Label</span>
                <input
                  value={row.label}
                  onChange={(e) =>
                    setStatsDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, label: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="cms-btn is-danger"
                onClick={() =>
                  setStatsDraft((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-head-row">
          <div>
            <h2 className="cms-panel-title">Focus tabs</h2>
            <p className="cms-panel-lead">Structured focus cards for the public site.</p>
          </div>
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              setFocusDraft((rows) => [
                ...rows,
                {
                  id: newFocusId(),
                  label: "New",
                  teaser: "",
                  title: "Untitled",
                  points: [""],
                },
              ])
            }
          >
            Add focus
          </button>
        </div>
        <div className="cms-form-stack">
          {focusDraft.map((row, index) => (
            <div key={row.id || `focus-${index}`} className="cms-ai-card">
              <label className="cms-field">
                <span>Label</span>
                <input
                  value={row.label}
                  onChange={(e) =>
                    setFocusDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, label: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field">
                <span>Title</span>
                <input
                  value={row.title}
                  onChange={(e) =>
                    setFocusDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, title: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field">
                <span>Teaser</span>
                <input
                  value={row.teaser}
                  onChange={(e) =>
                    setFocusDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, teaser: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field">
                <span>Points (one per line)</span>
                <textarea
                  value={row.points.join("\n")}
                  onChange={(e) =>
                    setFocusDraft((rows) =>
                      rows.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              points: e.target.value
                                .split("\n")
                                .map((p) => p.trimEnd()),
                            }
                          : r,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="cms-btn is-danger"
                onClick={() =>
                  setFocusDraft((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-head-row">
          <div>
            <h2 className="cms-panel-title">Engagement tiers</h2>
            <p className="cms-panel-lead">Pricing / engagement cards.</p>
          </div>
          <button
            type="button"
            className="cms-btn"
            onClick={() =>
              setEngagementDraft((rows) => [
                ...rows,
                {
                  name: "New tier",
                  price: "",
                  detail: "",
                  featured: false,
                },
              ])
            }
          >
            Add tier
          </button>
        </div>
        <div className="cms-form-stack">
          {engagementDraft.map((row, index) => (
            <div key={`eng-${index}`} className="cms-ai-card">
              <label className="cms-field">
                <span>Name</span>
                <input
                  value={row.name}
                  onChange={(e) =>
                    setEngagementDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, name: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field">
                <span>Price</span>
                <input
                  value={row.price}
                  onChange={(e) =>
                    setEngagementDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, price: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field">
                <span>Detail</span>
                <textarea
                  value={row.detail}
                  onChange={(e) =>
                    setEngagementDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, detail: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <label className="cms-field" style={{ flexDirection: "row", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={row.featured}
                  onChange={(e) =>
                    setEngagementDraft((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, featured: e.target.checked } : r,
                      ),
                    )
                  }
                />
                <span>Featured</span>
              </label>
              <button
                type="button"
                className="cms-btn is-danger"
                onClick={() =>
                  setEngagementDraft((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <CmsFloatingSave
        dirty={listsDirty}
        saving={savingLists}
        onSave={() => void saveListSections()}
        onDiscard={discardLists}
        label="Unsaved stats / focus / engagement"
      />
    </div>
  );
}
