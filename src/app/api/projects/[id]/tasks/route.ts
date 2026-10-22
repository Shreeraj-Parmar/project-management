import { Task } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const tasks = await Task.find({ projectId: id }).sort({ order: 1, createdAt: 1 }).lean();
  return ok(tasks);
});

export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ title?: string; columnId?: string; description?: string; priority?: string; labels?: string[]; dueDate?: string | null }>(req);
  if (!body.title?.trim()) return fail("Title is required");
  if (!body.columnId) return fail("columnId is required");
  const last = await Task.findOne({ projectId: id, columnId: body.columnId }).sort({ order: -1 }).lean();
  const task = await Task.create({
    projectId: id,
    columnId: body.columnId,
    title: body.title.trim(),
    description: body.description ?? "",
    priority: body.priority ?? "medium",
    labels: body.labels ?? [],
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    order: (last?.order ?? -1) + 1,
  });
  return ok(task, { status: 201 });
});
