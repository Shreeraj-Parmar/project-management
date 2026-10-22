import { Password } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt, decrypt } from "@/lib/crypto";

type Ctx = Params<{ id: string; pwId: string }>;

/** Reveal: returns the decrypted password for a single entry. */
export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id, pwId } = await params;
  if (!isValidId(id) || !isValidId(pwId)) return fail("Invalid id", 404);
  const p = await Password.findOne({ _id: pwId, projectId: id }).lean();
  if (!p) return fail("Not found", 404);
  return ok({ ...p, password: decrypt(p.password) });
});

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, pwId } = await params;
  if (!isValidId(id) || !isValidId(pwId)) return fail("Invalid id", 404);
  const body = await readJson<Record<string, unknown>>(req);
  const update: Record<string, unknown> = {};
  for (const k of ["title", "category", "username", "url", "notes"]) {
    if (typeof body[k] === "string") update[k] = body[k];
  }
  if (typeof body.password === "string") update.password = encrypt(body.password);
  const p = await Password.findOneAndUpdate({ _id: pwId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!p) return fail("Not found", 404);
  return ok({ ...p, password: undefined, hasPassword: Boolean(p.password) });
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, pwId } = await params;
  if (!isValidId(id) || !isValidId(pwId)) return fail("Invalid id", 404);
  const res = await Password.deleteOne({ _id: pwId, projectId: id });
  if (!res.deletedCount) return fail("Not found", 404);
  return ok({ ok: true });
});
