import { mkdir, writeFile } from "fs/promises";
import path from "path";

function safeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "cms";
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * Dev / fallback upload when Cloudflare R2 is not configured.
 * Writes under public/uploads so Next can serve the file at /uploads/...
 */
export async function uploadFileLocal(
  file: File | Buffer,
  opts: {
    folder?: string;
    filename?: string;
    contentType: string;
  },
): Promise<{ url: string; key: string }> {
  const folder = safeFolder(opts.folder ?? "cms");
  const extFromType = opts.contentType.split("/")[1]?.split("+")[0] || "bin";
  const baseName = opts.filename
    ? safeFilename(opts.filename)
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFromType}`;

  const relativeDir = path.join("uploads", folder);
  const absDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absDir, { recursive: true });

  const body =
    file instanceof Buffer
      ? file
      : Buffer.from(await (file as File).arrayBuffer());

  await writeFile(path.join(absDir, baseName), body);

  const key = `${relativeDir}/${baseName}`.replace(/\\/g, "/");
  return { url: `/${key}`, key };
}
