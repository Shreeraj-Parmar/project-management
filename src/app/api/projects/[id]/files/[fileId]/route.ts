import { FileItem } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { deleteObject, presignDownload } from "@/lib/s3";

type Ctx = Params<{ id: string; fileId: string }>;

/** Returns a short-lived download url. */
export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id, fileId } = await params;
  if (!isValidId(id) || !isValidId(fileId)) return fail("Invalid id", 404);
  const f = await FileItem.findOne({ _id: fileId, projectId: id }).lean();
  if (!f) return fail("Not found", 404);
  const url = await presignDownload(f.key, f.name);
  return ok({ url });
});

/** Step 2 of upload: mark as uploaded (or rename / move folder). */
export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, fileId } = await params;
  if (!isValidId(id) || !isValidId(fileId)) return fail("Invalid id", 404);
  const body = await readJson<{ status?: "uploaded"; name?: string; folder?: string; size?: number }>(req);
  const update: Record<string, unknown> = {};
  if (body.status === "uploaded") update.status = "uploaded";
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.folder === "string") update.folder = body.folder.replace(/^\/+|\/+$/g, "");
  if (typeof body.size === "number") update.size = body.size;
  const f = await FileItem.findOneAndUpdate({ _id: fileId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!f) return fail("Not found", 404);
  return ok(f);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, fileId } = await params;
  if (!isValidId(id) || !isValidId(fileId)) return fail("Invalid id", 404);
  const f = await FileItem.findOneAndDelete({ _id: fileId, projectId: id }).lean();
  if (!f) return fail("Not found", 404);
  try {
    await deleteObject(f.key);
  } catch (err) {
    console.warn("[files] failed to delete S3 object", f.key, err);
  }
  return ok({ ok: true });
});
