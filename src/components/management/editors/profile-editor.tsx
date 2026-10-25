"use client";

import {
  CmsFloatingSave,
  CmsHeader,
  CmsMessage,
  CmsPanel,
} from "@/components/management/cms-chrome";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetch-json";
import { useEffect, useMemo, useState } from "react";

type ProfileState = {
  name: string;
  title: string;
  wordmark: string;
  heroHeadline: string;
  heroSubhead: string;
  heroHelper: string;
  email: string;
};

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [original, setOriginal] = useState<ProfileState | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson<{ profile?: ProfileState; error?: string }>("/api/cms/content")
      .then(({ ok, data }) => {
        if (ok && data.profile) {
          setProfile(data.profile);
          setOriginal(data.profile);
        } else setMessage(data.error || "Failed to load profile");
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Failed to load profile");
      });
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(original),
    [profile, original]
  );

  async function save() {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    const { ok, data } = await fetchJson<{ error?: string }>("/api/cms/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "profile", ...profile }),
    });
    setSaving(false);
    if (ok) {
      setOriginal(profile);
      setMessage("Profile saved.");
    } else setMessage(data.error || "Save failed");
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  return (
    <div className="pb-24">
      <CmsHeader
        eyebrow="Profile"
        title="Site chrome"
        subtitle="Wordmark, name, title — frosted panel + floating save like ttianqii settings"
      />
      <CmsMessage>{message}</CmsMessage>
      <CmsPanel>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["wordmark", "Wordmark"],
              ["name", "Name"],
              ["title", "Title"],
              ["email", "Email"],
              ["heroSubhead", "Hero subhead"],
              ["heroHelper", "Hero helper"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <Input
                className="cms-input h-10 rounded-full border-[var(--cms-line)] bg-[var(--cms-input)] px-4"
                value={profile[key]}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Fallback hero headline</span>
            <Textarea
              className="cms-input min-h-20 rounded-3xl border-[var(--cms-line)] bg-[var(--cms-input)] px-4 py-3"
              value={profile.heroHeadline}
              onChange={(e) => setProfile({ ...profile, heroHeadline: e.target.value })}
            />
          </label>
        </div>
      </CmsPanel>
      <CmsFloatingSave
        visible={dirty}
        saving={saving}
        onSave={save}
        onCancel={() => original && setProfile(original)}
      />
    </div>
  );
}
