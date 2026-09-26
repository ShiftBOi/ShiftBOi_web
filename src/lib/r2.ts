import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "";
const endpoint = accountId
  ? `https://${accountId}.r2.cloudflarestorage.com`
  : "https://r2.cloudflarestorage.com";

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET || "webport";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL,
  );
}

function safeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "cms";
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * Upload a binary file (image/video) to Cloudflare R2.
 * Returns the public URL.
 */
export async function uploadFileToR2(
  file: File | Buffer,
  opts: {
    folder?: string;
    filename?: string;
    contentType: string;
  },
): Promise<{ url: string; key: string }> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured");
  }

  const folder = safeFolder(opts.folder ?? "cms");
  const extFromType = opts.contentType.split("/")[1]?.split("+")[0] || "bin";
  const baseName = opts.filename
    ? safeFilename(opts.filename)
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFromType}`;
  const key = `${folder}/${baseName}`;

  const body =
    file instanceof Buffer
      ? file
      : Buffer.from(await (file as File).arrayBuffer());

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: opts.contentType,
    }),
  );

  return { url: `${R2_PUBLIC_URL}/${key}`, key };
}

export async function deleteFromR2(imageUrl: string): Promise<void> {
  if (!isR2Configured() || !imageUrl.startsWith(R2_PUBLIC_URL)) return;
  try {
    const key = new URL(imageUrl).pathname.replace(/^\//, "");
    if (!key) return;
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }),
    );
  } catch (error) {
    console.error("[r2] delete failed", error);
  }
}
