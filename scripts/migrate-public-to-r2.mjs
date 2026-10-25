#!/usr/bin/env node
/**
 * Upload public media assets to Cloudflare R2, preserving path keys.
 * Usage: node scripts/migrate-public-to-r2.mjs [--delete-local] [--dry-run]
 */
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".json": "application/json",
  ".txt": "text/plain",
};

const MEDIA_EXT = new Set(Object.keys(MIME));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: path.join(root, ".env") });
} catch {
  /* optional */
}

const dryRun = process.argv.includes("--dry-run");
const deleteLocal = process.argv.includes("--delete-local");

const accountId = process.env.R2_ACCOUNT_ID || "";
const bucket = process.env.R2_BUCKET || "";
const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

if (!accountId || !bucket || !publicUrl || !accessKeyId || !secretAccessKey) {
  console.error("Missing R2 env (R2_ACCOUNT_ID, R2_BUCKET, R2_PUBLIC_URL, keys).");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** Folders under public/ to migrate (path keys match URL paths). */
const ROOTS = ["images", "uploads", "videos", "dino", "brand", "illustrations"];

/** Loose files at public/ root (icons, OG, etc.). */
const ROOT_FILES = [
  "og.png",
  "dino-dash.png",
  "icon-192.png",
  "icon-512.png",
  "favicon-32.png",
  "favicon.ico",
  "brand-mark.svg",
];

/** Framework / placeholder SVGs — keep local, not worth CDN. */
const SKIP_NAMES = new Set([
  "next.svg",
  "vercel.svg",
  "file.svg",
  "globe.svg",
  "window.svg",
]);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(full)));
    else if (ent.isFile()) out.push(full);
  }
  return out;
}

async function existsOnR2(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(absPath, key) {
  const contentType =
    MIME[path.extname(absPath).toLowerCase()] || "application/octet-stream";
  if (dryRun) {
    console.log(`[dry-run] put ${key} (${contentType})`);
    return;
  }
  const body = createReadStream(absPath);
  const stat = await fs.stat(absPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: String(contentType),
      ContentLength: stat.size,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  console.log(`↑ ${key}`);
}

async function migrateOne(file, key) {
  const base = path.basename(file);
  if (
    base === ".gitkeep" ||
    base === ".DS_Store" ||
    SKIP_NAMES.has(base)
  ) {
    return "skip";
  }
  const ext = path.extname(file).toLowerCase();
  if (!MEDIA_EXT.has(ext)) return "skip";

  if (await existsOnR2(key)) {
    console.log(`= ${key} (exists)`);
    return "skip";
  }
  await uploadFile(file, key);
  if (deleteLocal && !dryRun) {
    await fs.unlink(file);
    console.log(`✗ local ${key}`);
    return "deleted";
  }
  return "uploaded";
}

async function main() {
  console.log(`R2 bucket=${bucket} public=${publicUrl}`);
  let uploaded = 0;
  let skipped = 0;
  let deleted = 0;

  for (const folder of ROOTS) {
    const base = path.join(root, "public", folder);
    const files = await walk(base);
    for (const file of files) {
      const key = path
        .relative(path.join(root, "public"), file)
        .split(path.sep)
        .join("/");
      const result = await migrateOne(file, key);
      if (result === "uploaded") uploaded += 1;
      else if (result === "deleted") {
        uploaded += 1;
        deleted += 1;
      } else skipped += 1;
    }
  }

  for (const name of ROOT_FILES) {
    const file = path.join(root, "public", name);
    try {
      await fs.access(file);
    } catch {
      skipped += 1;
      continue;
    }
    const result = await migrateOne(file, name);
    if (result === "uploaded") uploaded += 1;
    else if (result === "deleted") {
      uploaded += 1;
      deleted += 1;
    } else skipped += 1;
  }

  console.log(
    `\nDone. uploaded=${uploaded} skipped=${skipped} deletedLocal=${deleted}`,
  );
  console.log(
    `Ensure .env has:\nNEXT_PUBLIC_R2_PUBLIC_URL=${publicUrl}\nR2_MEDIA_MIGRATED=1`,
  );
}

main().catch((err) => {
  console.error(err);
  if (err?.name === "AccessDenied" || err?.Code === "AccessDenied") {
    console.error(
      "\nR2 AccessDenied on PutObject — token needs Object Read & Write.",
    );
  }
  process.exit(1);
});
