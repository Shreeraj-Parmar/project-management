import { Project, Task, Expense } from "@/models";
import { ok, fail, withDB, readJson } from "@/lib/api-helpers";

export const GET = withDB(async () => {
  const projects = await Project.find().sort({ starred: -1, updatedAt: -1 }).lean();
  const ids = projects.map((p) => p._id);
  const [taskAgg, spendAgg] = await Promise.all([
    Task.aggregate([
      { $match: { projectId: { $in: ids } } },
      {
        $group: {
          _id: "$projectId",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $ne: ["$completedAt", null] }, 1, 0] } },
        },
      },
    ]),
    Expense.aggregate([{ $match: { projectId: { $in: ids } } }, { $group: { _id: "$projectId", total: { $sum: "$amount" } } }]),
  ]);
  const taskMap = new Map(taskAgg.map((t) => [String(t._id), t]));
  const spendMap = new Map(spendAgg.map((s) => [String(s._id), s.total]));
  return ok(
    projects.map((p) => ({
      ...p,
      stats: {
        tasks: taskMap.get(String(p._id))?.total ?? 0,
        done: taskMap.get(String(p._id))?.done ?? 0,
        spent: spendMap.get(String(p._id)) ?? 0,
      },
    }))
  );
});

export const POST = withDB(async (req) => {
  const body = await readJson<{ name?: string; description?: string; color?: string; tags?: string[] }>(req);
  if (!body.name?.trim()) return fail("Name is required");
  const project = await Project.create({
    name: body.name.trim(),
    description: body.description ?? "",
    color: body.color ?? "ocean",
    tags: body.tags ?? [],
  });
  return ok(project, { status: 201 });
});
