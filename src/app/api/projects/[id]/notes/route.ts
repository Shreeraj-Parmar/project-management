import { Note } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const notes = await Note.find({ projectId: id }).sort({ pinned: -1, updatedAt: -1 }).lean();
  return ok(notes);
});

export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ title?: string; content?: string; color?: string }>(req);
  if (!body.title?.trim()) return fail("Title is required");
  const note = await Note.create({ projectId: id, title: body.title.trim(), content: body.content ?? "", color: body.color ?? "#fff7d6" });
  return ok(note, { status: 201 });
});
