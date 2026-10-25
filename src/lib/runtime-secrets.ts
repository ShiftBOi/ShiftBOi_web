/**
 * AI + R2 secrets from env (ShiftBOi has no SiteSettings secret columns).
 */

export type RuntimeSecrets = {
  openaiApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2PublicUrl: string;
};

export type MaskedSecrets = {
  openaiApiKey: string | null;
  geminiApiKey: string | null;
  groqApiKey: string | null;
  r2AccountId: string | null;
  r2AccessKeyId: string | null;
  r2SecretAccessKey: string | null;
  r2Bucket: string | null;
  r2PublicUrl: string | null;
  source: {
    openai: "db" | "env" | "none";
    gemini: "db" | "env" | "none";
    groq: "db" | "env" | "none";
    r2: "db" | "env" | "mixed" | "none";
  };
};

function envSecrets(): RuntimeSecrets {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    groqApiKey: process.env.GROQ_API_KEY || "",
    r2AccountId: process.env.R2_ACCOUNT_ID || "",
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    r2Bucket: process.env.R2_BUCKET || "shiftboi",
    r2PublicUrl: process.env.R2_PUBLIC_URL || "",
  };
}

export function maskSecret(value: string | null | undefined) {
  const v = value?.trim() || "";
  if (!v) return null;
  if (v.length <= 8) return "••••••••";
  return `${v.slice(0, 3)}••••${v.slice(-4)}`;
}

export async function resolveRuntimeSecrets(): Promise<{
  secrets: RuntimeSecrets;
  masked: MaskedSecrets;
}> {
  const secrets = envSecrets();
  const src = (v: string) => (v ? ("env" as const) : ("none" as const));
  const r2Bits = [
    secrets.r2AccountId,
    secrets.r2AccessKeyId,
    secrets.r2SecretAccessKey,
    secrets.r2Bucket,
  ];
  const r2Any = r2Bits.some(Boolean);
  const r2All = r2Bits.every(Boolean);

  return {
    secrets,
    masked: {
      openaiApiKey: maskSecret(secrets.openaiApiKey),
      geminiApiKey: maskSecret(secrets.geminiApiKey),
      groqApiKey: maskSecret(secrets.groqApiKey),
      r2AccountId: maskSecret(secrets.r2AccountId),
      r2AccessKeyId: maskSecret(secrets.r2AccessKeyId),
      r2SecretAccessKey: maskSecret(secrets.r2SecretAccessKey),
      r2Bucket: secrets.r2Bucket || null,
      r2PublicUrl: secrets.r2PublicUrl || null,
      source: {
        openai: src(secrets.openaiApiKey),
        gemini: src(secrets.geminiApiKey),
        groq: src(secrets.groqApiKey),
        r2: !r2Any ? "none" : r2All ? "env" : "mixed",
      },
    },
  };
}
