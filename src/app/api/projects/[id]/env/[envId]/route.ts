import { EnvVar } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt, decrypt } from "@/lib/crypto";

type Ctx = Params<{ id: string; envId: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id, envId } = await params;
  if (!isValidId(id) || !isValidId(envId)) return fail("Invalid id", 404);
  const v = await EnvVar.findOne({ _id: envId, projectId: id }).lean();
  if (!v) return fail("Not found", 404);
  return ok({ ...v, value: decrypt(v.value) });
});

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, envId } = await params;
  if (!isValidId(id) || !isValidId(envId)) return fail("Invalid id", 404);
  const body = await readJson<{ key?: string; value?: string; note?: string; secret?: boolean; environment?: string }>(req);
  const update: Record<string, unknown> = {};
  if (typeof body.key === "string" && body.key.trim()) update.key = body.key.trim();
  if (typeof body.value === "string") update.value = encrypt(body.value);
  if (typeof body.note === "string") update.note = body.note;
  if (typeof body.secret === "boolean") update.secret = body.secret;
  if (typeof body.environment === "string" && body.environment.trim()) update.environment = body.environment.trim();
  const v = await EnvVar.findOneAndUpdate({ _id: envId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!v) return fail("Not found", 404);
  return ok({ ...v, value: decrypt(v.value), hasValue: Boolean(v.value) });
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, envId } = await params;
  if (!isValidId(id) || !isValidId(envId)) return fail("Invalid id", 404);
  const res = await EnvVar.deleteOne({ _id: envId, projectId: id });
  if (!res.deletedCount) return fail("Not found", 404);
  return ok({ ok: true });
});
