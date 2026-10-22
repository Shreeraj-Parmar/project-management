import { Password } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt } from "@/lib/crypto";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const items = await Password.find({ projectId: id }).sort({ category: 1, title: 1 }).lean();
  // Never return the secret in list responses
  return ok(items.map((p) => ({ ...p, password: undefined, hasPassword: Boolean(p.password) })));
});

export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ title?: string; category?: string; username?: string; password?: string; url?: string; notes?: string }>(req);
  if (!body.title?.trim()) return fail("Title is required");
  const doc = await Password.create({
    projectId: id,
    title: body.title.trim(),
    category: body.category ?? "Other",
    username: body.username ?? "",
    password: encrypt(body.password ?? ""),
    url: body.url ?? "",
    notes: body.notes ?? "",
  });
  const plain = doc.toObject();
  return ok({ ...plain, password: undefined, hasPassword: Boolean(plain.password) }, { status: 201 });
});
