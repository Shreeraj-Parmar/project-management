import { Note } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string; noteId: string }>;

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, noteId } = await params;
  if (!isValidId(id) || !isValidId(noteId)) return fail("Invalid id", 404);
  const body = await readJson<Record<string, unknown>>(req);
  const update: Record<string, unknown> = {};
  for (const k of ["title", "content", "color", "pinned"]) if (k in body) update[k] = body[k];
  const note = await Note.findOneAndUpdate({ _id: noteId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!note) return fail("Not found", 404);
  return ok(note);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, noteId } = await params;
  if (!isValidId(id) || !isValidId(noteId)) return fail("Invalid id", 404);
  const res = await Note.deleteOne({ _id: noteId, projectId: id });
  if (!res.deletedCount) return fail("Not found", 404);
  return ok({ ok: true });
});
