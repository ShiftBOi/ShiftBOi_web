import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";
import { isR2Configured, uploadFileToR2 } from "@/lib/r2";
import { uploadFileLocal } from "@/lib/local-upload";

export const runtime = "nodejs";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image or video uploads are allowed" },
      { status: 400 },
    );
  }

  if (file.size > 12 * 1024 * 1024 && file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image too large (max 12MB)" }, { status: 400 });
  }

  if (file.size > 80 * 1024 * 1024 && file.type.startsWith("video/")) {
    return NextResponse.json({ error: "Video too large (max 80MB)" }, { status: 400 });
  }

  const folderRaw = form?.get("folder");
  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim()
      : "cms";

  const opts = {
    folder,
    filename: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    contentType: file.type || "application/octet-stream",
  };

  try {
    const result = isR2Configured()
      ? await uploadFileToR2(file, opts)
      : await uploadFileLocal(file, opts);
    return NextResponse.json({
      url: result.url,
      pathname: result.key,
      key: result.key,
      storage: isR2Configured() ? "r2" : "local",
    });
  } catch (error) {
    console.error("[cms/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
