"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteContent } from "@/lib/content";
import { InlineEditField } from "@/components/cms/inline-edit-field";

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

export function SiteSettingsEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const [site, setSite] = useState(initial);

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

  async function saveBrand(partial: Partial<SiteContent["brand"]>) {
    const next = { ...site.brand, ...partial };
    await patchSetting("brand", next);
    setSite((s) => ({ ...s, brand: next }));
    router.refresh();
  }

  async function saveStatsJson(raw: string) {
    const parsed = JSON.parse(raw) as SiteContent["stats"];
    await patchSetting("stats", parsed);
    setSite((s) => ({ ...s, stats: parsed }));
    router.refresh();
  }

  async function saveFocusJson(raw: string) {
    const parsed = JSON.parse(raw) as SiteContent["focus"];
    await patchSetting("focus", parsed);
    setSite((s) => ({ ...s, focus: parsed }));
    router.refresh();
  }

  async function saveEngagementJson(raw: string) {
    const parsed = JSON.parse(raw) as SiteContent["engagement"];
    await patchSetting("engagement", parsed);
    setSite((s) => ({ ...s, engagement: parsed }));
    router.refresh();
  }

  return (
    <div className="cms-site-page">
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
        <h2 className="cms-panel-title">Contact</h2>
        <div className="cms-form-stack">
          <InlineEditField
            label="Title"
            value={site.contact.title}
            onSave={(v) => saveContact({ title: v })}
          />
          <InlineEditField
            label="Body"
            value={site.contact.body}
            multiline
            onSave={(v) => saveContact({ body: v })}
          />
          <InlineEditField
            label="CTA label"
            value={site.contact.ctaLabel}
            onSave={(v) => saveContact({ ctaLabel: v })}
          />
          <InlineEditField
            label="Email"
            value={site.contact.email}
            onSave={(v) => saveContact({ email: v })}
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
        <h2 className="cms-panel-title">Stats (JSON)</h2>
        <p className="cms-panel-lead">
          Array of {"{ value, label }"}. Confirm after editing.
        </p>
        <InlineEditField
          label="Stats JSON"
          value={JSON.stringify(site.stats, null, 2)}
          multiline
          onSave={async (raw) => {
            try {
              await saveStatsJson(raw);
            } catch {
              throw new Error("Invalid JSON for stats");
            }
          }}
        />
      </section>

      <section className="cms-panel">
        <h2 className="cms-panel-title">Focus tabs (JSON)</h2>
        <InlineEditField
          label="Focus JSON"
          value={JSON.stringify(site.focus, null, 2)}
          multiline
          onSave={async (raw) => {
            try {
              await saveFocusJson(raw);
            } catch {
              throw new Error("Invalid JSON for focus");
            }
          }}
        />
      </section>

      <section className="cms-panel">
        <h2 className="cms-panel-title">Engagement (JSON)</h2>
        <InlineEditField
          label="Engagement JSON"
          value={JSON.stringify(site.engagement, null, 2)}
          multiline
          onSave={async (raw) => {
            try {
              await saveEngagementJson(raw);
            } catch {
              throw new Error("Invalid JSON for engagement");
            }
          }}
        />
      </section>
    </div>
  );
}
