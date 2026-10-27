import { Folder } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { cleanPath, cleanSegment, ensureFolders, join } from "@/lib/folders";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const folders = await Folder.find({ projectId: id }).sort({ path: 1 }).lean();
  return ok(folders);
});

/** Create a folder. body: { name, parent? } */
export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ name?: string; parent?: string }>(req);
  const name = cleanSegment(body.name ?? "");
  if (!name) return fail("Folder name is required");
  const parent = cleanPath(body.parent ?? "");
  const path = join(parent, name);
  const exists = await Folder.exists({ projectId: id, path });
  if (exists) return fail(`A folder named “${name}” already exists here`, 409);
  await ensureFolders(id, parent);
  const folder = await Folder.create({ projectId: id, name, path });
  return ok(folder, { status: 201 });
});
