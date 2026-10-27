import { Folder } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { cleanPath, cleanSegment, deleteFolderTree, join, parentOf, relocateFolder } from "@/lib/folders";

type Ctx = Params<{ id: string; folderId: string }>;

/** Rename ({ name }) and/or move ({ parent }) a folder. Children and files follow. */
export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, folderId } = await params;
  if (!isValidId(id) || !isValidId(folderId)) return fail("Invalid id", 404);
  const folder = await Folder.findOne({ _id: folderId, projectId: id }).lean();
  if (!folder) return fail("Not found", 404);
  const body = await readJson<{ name?: string; parent?: string }>(req);
  const name = typeof body.name === "string" ? cleanSegment(body.name) : folder.name;
  if (!name) return fail("Folder name is required");
  const parent = typeof body.parent === "string" ? cleanPath(body.parent) : parentOf(folder.path);
  const to = join(parent, name);
  if (to === folder.path) return ok(folder);
  if (to === folder.path || to.startsWith(folder.path + "/")) return fail("A folder can't be moved into itself");
  if (await Folder.exists({ projectId: id, path: to })) return fail(`A folder named “${name}” already exists there`, 409);
  await relocateFolder(id, folder.path, to);
  const updated = await Folder.findById(folderId).lean();
  return ok(updated);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, folderId } = await params;
  if (!isValidId(id) || !isValidId(folderId)) return fail("Invalid id", 404);
  const folder = await Folder.findOne({ _id: folderId, projectId: id }).lean();
  if (!folder) return fail("Not found", 404);
  const files = await deleteFolderTree(id, folder.path);
  return ok({ ok: true, files });
});
