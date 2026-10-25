import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  // R2 rejects optional AWS flexible checksums with AccessDenied on some tokens.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
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

function normalizeFolderKey(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/?$/, "/");
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
      CacheControl: "public, max-age=31536000, immutable",
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

export async function deleteObjectByKey(key: string): Promise<void> {
  if (!isR2Configured()) throw new Error("R2 is not configured");
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key.replace(/^\//, ""),
    }),
  );
}

export type R2ListedObject = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
};

export type R2FolderEntry = {
  key: string;
  color?: string;
};

export async function getR2FolderColor(
  path: string,
): Promise<string | undefined> {
  const key = normalizeFolderKey(path);
  try {
    const head = await r2Client.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    const raw = head.Metadata?.color?.trim();
    if (!raw) return undefined;
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
      const a = withHash[1]!;
      const b = withHash[2]!;
      const c = withHash[3]!;
      return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function setR2FolderColor(
  path: string,
  color: string,
): Promise<string> {
  const key = normalizeFolderKey(path);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.alloc(0),
      ContentType: "application/x-directory",
      Metadata: { color: color.trim() },
    }),
  );
  return key;
}

export async function listR2Prefix(prefix = ""): Promise<{
  folders: R2FolderEntry[];
  objects: R2ListedObject[];
}> {
  if (!isR2Configured()) {
    return { folders: [], objects: [] };
  }

  const normalized = prefix
    ? prefix.endsWith("/")
      ? prefix
      : `${prefix}/`
    : "";

  const response = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: normalized || undefined,
      Delimiter: "/",
    }),
  );

  const folderKeys = (response.CommonPrefixes || [])
    .map((p) => p.Prefix || "")
    .filter(Boolean);

  const folders: R2FolderEntry[] = await Promise.all(
    folderKeys.map(async (key) => {
      const color = await getR2FolderColor(key);
      return color ? { key, color } : { key };
    }),
  );

  const objects: R2ListedObject[] = (response.Contents || [])
    .filter((obj) => obj.Key && !obj.Key.endsWith("/"))
    .map((obj) => ({
      key: obj.Key!,
      url: `${R2_PUBLIC_URL}/${obj.Key}`,
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? "",
      isFolder: false,
    }));

  return { folders, objects };
}

export async function createR2Folder(
  path: string,
  color?: string,
): Promise<string> {
  const key = normalizeFolderKey(path);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.alloc(0),
      ContentType: "application/x-directory",
      ...(color ? { Metadata: { color: color.trim() } } : {}),
    }),
  );
  return key;
}

export async function listR2FolderDeep(path: string): Promise<{
  keys: string[];
  fileCount: number;
  totalSize: number;
  samples: string[];
}> {
  const prefix = normalizeFolderKey(path);
  const keys: string[] = [];
  let totalSize = 0;
  let token: string | undefined;
  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of response.Contents || []) {
      if (!obj.Key) continue;
      keys.push(obj.Key);
      if (!obj.Key.endsWith("/")) {
        totalSize += obj.Size ?? 0;
      }
    }
    token = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (token);

  const files = keys.filter((k) => !k.endsWith("/"));
  return {
    keys,
    fileCount: files.length,
    totalSize,
    samples: files.slice(0, 8).map((k) => k.slice(prefix.length) || k),
  };
}

export async function deleteR2Folder(path: string): Promise<{ deleted: number }> {
  const { keys } = await listR2FolderDeep(path);
  if (!keys.length) {
    const marker = normalizeFolderKey(path);
    try {
      await deleteObjectByKey(marker);
      return { deleted: 1 };
    } catch {
      return { deleted: 0 };
    }
  }

  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    const res = await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    deleted += chunk.length - (res.Errors?.length ?? 0);
  }
  return { deleted };
}

export async function listAllR2Objects(): Promise<R2ListedObject[]> {
  if (!isR2Configured()) return [];
  const out: R2ListedObject[] = [];
  let token: string | undefined;
  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: token,
      }),
    );
    for (const obj of response.Contents || []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      out.push({
        key: obj.Key,
        url: `${R2_PUBLIC_URL}/${obj.Key}`,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? "",
        isFolder: false,
      });
    }
    token = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function getR2StorageSummary(): Promise<{
  totalFiles: number;
  totalSize: number;
  limitBytes: number;
}> {
  const objects = await listAllR2Objects();
  const totalSize = objects.reduce((sum, o) => sum + o.size, 0);
  const limitGb = Number(process.env.R2_STORAGE_LIMIT_GB || 10);
  return {
    totalFiles: objects.length,
    totalSize,
    limitBytes: Math.max(1, limitGb) * 1024 * 1024 * 1024,
  };
}
