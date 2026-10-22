import { Project, Task } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string }>;
type Column = { id: string; title: string; color: string };

/** Replace the full column list (add/rename/reorder/delete). Tasks in deleted columns move to the first column. */
export const PUT = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ columns?: Column[] }>(req);
  const columns = (body.columns ?? []).filter((c) => c && c.id && c.title?.trim());
  if (columns.length === 0) return fail("At least one column is required");

  const project = await Project.findById(id);
  if (!project) return fail("Project not found", 404);
  const keep = new Set(columns.map((c) => c.id));
  await Task.updateMany({ projectId: id, columnId: { $nin: [...keep] } }, { $set: { columnId: columns[0].id } });
  project.set(
    "columns",
    columns.map((c) => ({ id: c.id, title: c.title.trim(), color: c.color || "blue" }))
  );
  await project.save();
  return ok(project.columns);
});
