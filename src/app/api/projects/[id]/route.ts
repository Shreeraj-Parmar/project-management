import { Project, Task, EnvVar, Password, FileItem, Note, Expense } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt } from "@/lib/crypto";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const project = await Project.findById(id).lean();
  if (!project) return fail("Project not found", 404);

  const [tasks, doneTasks, envCount, pwCount, fileCount, noteCount, spend, recentTasks, recentNotes] = await Promise.all([
    Task.countDocuments({ projectId: id }),
    Task.countDocuments({ projectId: id, completedAt: { $ne: null } }),
    EnvVar.countDocuments({ projectId: id }),
    Password.countDocuments({ projectId: id }),
    FileItem.countDocuments({ projectId: id, status: "uploaded" }),
    Note.countDocuments({ projectId: id }),
    Expense.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Task.find({ projectId: id }).sort({ updatedAt: -1 }).limit(6).lean(),
    Note.find({ projectId: id }).sort({ updatedAt: -1 }).limit(4).lean(),
  ]);

  const { git, ...rest } = project as typeof project & { git?: { repo?: string; token?: string } };
  return ok({
    ...rest,
    git: { repo: git?.repo ?? "", hasToken: Boolean(git?.token) },
    stats: {
      tasks,
      doneTasks,
      env: envCount,
      passwords: pwCount,
      files: fileCount,
      notes: noteCount,
      spent: spend[0]?.total ?? 0,
      expenses: spend[0]?.count ?? 0,
    },
    recentTasks,
    recentNotes,
  });
});

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<Record<string, unknown>>(req);
  const allowed = ["name", "description", "color", "status", "tags", "starred", "links", "columns"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  if (typeof update.name === "string" && !update.name.trim()) return fail("Name cannot be empty");

  if (body.git && typeof body.git === "object") {
    const g = body.git as { repo?: string; token?: string };
    if (typeof g.repo === "string") update["git.repo"] = g.repo.trim();
    if (typeof g.token === "string") update["git.token"] = g.token ? encrypt(g.token) : "";
  }

  const project = await Project.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!project) return fail("Project not found", 404);
  return ok(project);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const project = await Project.findByIdAndDelete(id);
  if (!project) return fail("Project not found", 404);
  await Promise.all([
    Task.deleteMany({ projectId: id }),
    EnvVar.deleteMany({ projectId: id }),
    Password.deleteMany({ projectId: id }),
    FileItem.deleteMany({ projectId: id }),
    Note.deleteMany({ projectId: id }),
    Expense.deleteMany({ projectId: id }),
  ]);
  return ok({ ok: true });
});
