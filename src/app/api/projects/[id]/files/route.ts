import { randomUUID } from "crypto";
import { FileItem } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { isS3Configured, presignUpload } from "@/lib/s3";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const files = await FileItem.find({ projectId: id, status: "uploaded" }).sort({ folder: 1, createdAt: -1 }).lean();
  return ok({ configured: isS3Configured(), files });
});

/** Step 1 of upload: create a pending record and return a presigned PUT url. */
export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  if (!isS3Configured()) return fail("AWS S3 is not configured. Add the AWS_* variables to .env.", 503);
  const body = await readJson<{ name?: string; size?: number; contentType?: string; folder?: string }>(req);
  if (!body.name) return fail("name is required");
  const safeName = body.name.replace(/[^\w.\-() ]+/g, "_");
  const folder = (body.folder ?? "").replace(/^\/+|\/+$/g, "");
  const key = `projects/${id}/${folder ? folder + "/" : ""}${randomUUID()}-${safeName}`;
  const contentType = body.contentType || "application/octet-stream";
  const file = await FileItem.create({
    projectId: id,
    name: body.name,
    key,
    size: body.size ?? 0,
    contentType,
    folder,
    status: "pending",
  });
  const uploadUrl = await presignUpload(key, contentType);
  return ok({ file, uploadUrl }, { status: 201 });
});
