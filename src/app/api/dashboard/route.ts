import { Project, Task, Expense, Note, Password, EnvVar, FileItem } from "@/models";
import { ok, withDB } from "@/lib/api-helpers";

export const GET = withDB(async () => {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [projects, tasks, openTasks, dueSoon, overdue, spend, notes, passwords, env, files, recent] = await Promise.all([
    Project.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ completedAt: null }),
    Task.find({ completedAt: null, dueDate: { $gte: now, $lte: weekAhead } }).sort({ dueDate: 1 }).limit(8).lean(),
    Task.find({ completedAt: null, dueDate: { $lt: now } }).sort({ dueDate: 1 }).limit(8).lean(),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Note.countDocuments(),
    Password.countDocuments(),
    EnvVar.countDocuments(),
    FileItem.countDocuments({ status: "uploaded" }),
    Task.find().sort({ updatedAt: -1 }).limit(8).lean(),
  ]);
  return ok({
    counts: { projects, tasks, openTasks, notes, passwords, env, files, spent: spend[0]?.total ?? 0 },
    dueSoon,
    overdue,
    recent,
  });
});
