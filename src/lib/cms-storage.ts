import { readdir, mkdir, rm, stat } from "fs/promises";
import path from "path";
import {
  createR2Folder,
  deleteObjectByKey,
  deleteR2Folder,
  getR2StorageSummary,
  isR2Configured,
  listR2FolderDeep,
  listR2Prefix,
  R2_PUBLIC_URL,
  setR2FolderColor,
  uploadFileToR2,
} from "@/lib/r2";

export type StorageFolder = {
  key: string;
  name: string;
  color: string | null;
  size: number;
  fileCount: number;
};

export type StorageObject = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  filename: string;
  folder: string;
};

function uploadsRoot() {
  return path.join(process.cwd(), "public", "uploads");
}

function normalizePrefix(prefix: string) {
  return prefix.replace(/^\/+/, "").replace(/\/?$/, prefix ? "/" : "");
}

async function listLocalPrefix(prefix = ""): Promise<{
  folders: StorageFolder[];
  objects: StorageObject[];
}> {
  const normalized = prefix.replace(/^\/+|\/+$/g, "");
  const dir = normalized
    ? path.join(uploadsRoot(), normalized)
    : uploadsRoot();

  try {
    await mkdir(dir, { recursive: true });
    const entries = await readdir(dir, { withFileTypes: true });
    const folders: StorageFolder[] = [];
    const objects: StorageObject[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const rel = normalized ? `${normalized}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        folders.push({
          key: `${rel}/`,
          name: entry.name,
          color: null,
          size: 0,
          fileCount: 0,
        });
      } else if (entry.isFile()) {
        const info = await stat(path.join(dir, entry.name));
        objects.push({
          key: `uploads/${rel}`.replace(/\\/g, "/"),
          url: `/uploads/${rel}`.replace(/\\/g, "/"),
          size: info.size,
          lastModified: info.mtime.toISOString(),
          filename: entry.name,
          folder: normalized || "root",
        });
      }
    }

    return { folders, objects };
  } catch {
    return { folders: [], objects: [] };
  }
}

export async function browseStorage(prefix = "") {
  if (isR2Configured()) {
    const { folders, objects } = await listR2Prefix(prefix);
    const foldersWithSize: StorageFolder[] = await Promise.all(
      folders.map(async (f) => {
        const info = await listR2FolderDeep(f.key);
        return {
          key: f.key,
          name: f.key.replace(prefix, "").replace(/\/$/, "") || f.key,
          color: f.color ?? null,
          size: info.totalSize,
          fileCount: info.fileCount,
        };
      }),
    );
    return {
      storage: "r2" as const,
      prefix,
      folders: foldersWithSize,
      objects: objects.map((o) => ({
        ...o,
        filename: o.key.split("/").pop() || o.key,
        folder: o.key.includes("/")
          ? o.key.slice(0, o.key.lastIndexOf("/"))
          : "root",
      })),
      publicBase: R2_PUBLIC_URL,
    };
  }

  const local = await listLocalPrefix(prefix);
  return {
    storage: "local" as const,
    prefix,
    ...local,
    publicBase: "",
  };
}

export async function storageSummary() {
  if (isR2Configured()) {
    const summary = await getR2StorageSummary();
    return {
      storage: "r2" as const,
      ...summary,
      limitGb: summary.limitBytes / (1024 * 1024 * 1024),
      limitLabel: `${summary.limitBytes / (1024 * 1024 * 1024)} GB`,
    };
  }

  // Cheap local summary of public/uploads
  async function walk(dir: string): Promise<{ files: number; size: number }> {
    let files = 0;
    let size = 0;
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const nested = await walk(full);
          files += nested.files;
          size += nested.size;
        } else if (entry.isFile()) {
          files += 1;
          size += (await stat(full)).size;
        }
      }
    } catch {
      /* empty */
    }
    return { files, size };
  }

  const { files, size } = await walk(uploadsRoot());
  return {
    storage: "local" as const,
    totalFiles: files,
    totalSize: size,
    limitBytes: 10 * 1024 * 1024 * 1024,
    limitGb: 10,
    limitLabel: "local",
  };
}

export async function mkdirStorage(pathName: string, color?: string) {
  const clean = pathName.replace(/^\/+|\/+$/g, "");
  if (!clean) throw new Error("path required");
  if (isR2Configured()) {
    const key = await createR2Folder(clean, color);
    return { key, color: color ?? null };
  }
  await mkdir(path.join(uploadsRoot(), clean), { recursive: true });
  return { key: `${clean}/`, color: color ?? null };
}

export async function setFolderColor(pathName: string, color: string) {
  if (!isR2Configured()) {
    throw new Error("Folder colors require Cloudflare R2");
  }
  const key = await setR2FolderColor(pathName, color);
  return { key, color };
}

export async function deleteFolder(pathName: string) {
  const clean = pathName.replace(/^\/+|\/+$/g, "");
  if (!clean) throw new Error("Cannot delete root");
  if (isR2Configured()) {
    return deleteR2Folder(clean);
  }
  await rm(path.join(uploadsRoot(), clean), { recursive: true, force: true });
  return { deleted: 1 };
}

export async function deleteStorageKey(key: string) {
  const clean = key.replace(/^\//, "");
  if (!clean) throw new Error("key required");
  if (isR2Configured()) {
    await deleteObjectByKey(clean);
    return { deleted: clean };
  }
  const localPath = clean.startsWith("uploads/")
    ? path.join(process.cwd(), "public", clean)
    : path.join(uploadsRoot(), clean);
  await rm(localPath, { force: true });
  return { deleted: clean };
}

export async function uploadStorageFile(
  file: File | Buffer,
  opts: { folder?: string; filename?: string; contentType: string },
) {
  const folder = (opts.folder || "cms").replace(/^\/+|\/+$/g, "") || "cms";
  if (!isR2Configured()) {
    throw new Error(
      "Cloudflare R2 is required for CMS media. Set R2_* env vars.",
    );
  }
  return uploadFileToR2(file, { ...opts, folder });
}

export { normalizePrefix };
