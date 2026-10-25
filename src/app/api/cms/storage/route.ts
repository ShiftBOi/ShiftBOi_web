import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";
import {
  browseStorage,
  deleteFolder,
  deleteStorageKey,
  mkdirStorage,
  setFolderColor,
  storageSummary,
  uploadStorageFile,
} from "@/lib/cms-storage";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

async function uploadBase64(image: string, folder: string) {
  const match = image.match(/^data:((?:image|video)\/[\w.+-]+);base64,(.+)$/i);
  const contentType = match?.[1] || "image/png";
  const base64 = match?.[2] || image;
  const buffer = Buffer.from(base64, "base64");
  const ext = contentType.split("/")[1]?.split("+")[0] || "png";
  return uploadStorageFile(buffer, {
    folder: folder.replace(/\/$/, "") || "gallery",
    filename: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
    contentType,
  });
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return fail("Unauthorized", 401);

  const mode = request.nextUrl.searchParams.get("mode") || "browse";
  const prefix = request.nextUrl.searchParams.get("prefix") || "";

  try {
    if (mode === "summary") {
      const data = await storageSummary();
      return ok({
        ...data,
        ready: isR2Configured(),
      });
    }
    return ok(await browseStorage(prefix));
  } catch (error) {
    console.error("[cms/storage GET]", error);
    return fail("Storage browse failed", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return fail("Unauthorized", 401);

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("Missing file");
      const folderRaw = form.get("folder");
      const folder =
        typeof folderRaw === "string" && folderRaw.trim()
          ? folderRaw.trim().replace(/\/$/, "")
          : "cms";
      const result = await uploadStorageFile(file, {
        folder,
        filename: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        contentType: file.type || "application/octet-stream",
      });
      return ok(result);
    }

    const body = (await request.json()) as {
      action?: string;
      path?: string;
      color?: string;
      key?: string;
      image?: string;
      folder?: string;
    };
    const action = body.action || "";

    if (action === "upload") {
      const image = String(body.image || "");
      if (!image) return fail("image required");
      const result = await uploadBase64(image, String(body.folder || "gallery"));
      return ok({ url: result.url, key: result.key });
    }
    if (action === "mkdir") {
      return ok(await mkdirStorage(String(body.path || ""), body.color));
    }
    if (action === "set-folder-color") {
      return ok(
        await setFolderColor(
          String(body.path || ""),
          String(body.color || "#888888"),
        ),
      );
    }
    if (action === "delete-folder") {
      return ok(await deleteFolder(String(body.path || "")));
    }

    return fail("Unknown action");
  } catch (error) {
    console.error("[cms/storage POST]", error);
    return fail(
      error instanceof Error ? error.message : "Storage action failed",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) return fail("Unauthorized", 401);

  try {
    const body = (await request.json()) as { key?: string };
    const key = String(body.key || "");
    if (!key) return fail("key required");
    return ok(await deleteStorageKey(key));
  } catch (error) {
    console.error("[cms/storage DELETE]", error);
    return fail("Delete failed", 500);
  }
}
