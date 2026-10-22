import { Task } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string; taskId: string }>;

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, taskId } = await params;
  if (!isValidId(id) || !isValidId(taskId)) return fail("Invalid id", 404);
  const body = await readJson<Record<string, unknown>>(req);
  const allowed = ["title", "description", "labels", "priority", "dueDate", "columnId", "order", "checklist", "completedAt"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  if ("dueDate" in update) update.dueDate = update.dueDate ? new Date(update.dueDate as string) : null;
  if ("completedAt" in update) update.completedAt = update.completedAt ? new Date(update.completedAt as string) : null;
  const task = await Task.findOneAndUpdate({ _id: taskId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!task) return fail("Task not found", 404);
  return ok(task);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, taskId } = await params;
  if (!isValidId(id) || !isValidId(taskId)) return fail("Invalid id", 404);
  const res = await Task.deleteOne({ _id: taskId, projectId: id });
  if (!res.deletedCount) return fail("Task not found", 404);
  return ok({ ok: true });
});
