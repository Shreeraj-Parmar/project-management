import { Project, Task, Expense } from "@/models";
import { ok, fail, withDB, readJson } from "@/lib/api-helpers";
import { BOARD_COLORS, BOARD_TEMPLATES, LABEL_COLORS, isValidBoardBackground } from "@/lib/constants";

type ColumnInput = { id?: unknown; title?: unknown; color?: unknown };

/** Accept either a template id or an explicit list of columns; fall back to the default Kanban template. */
function resolveColumns(template?: string, columns?: ColumnInput[]) {
  if (Array.isArray(columns) && columns.length > 0) {
    const seen = new Set<string>();
    const out = columns
      .map((c, i) => {
        const title = typeof c.title === "string" ? c.title.trim().slice(0, 60) : "";
        const rawId = typeof c.id === "string" && c.id.trim() ? c.id.trim() : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const id = rawId || `list-${i + 1}`;
        const color = typeof c.color === "string" && LABEL_COLORS.some((l) => l.id === c.color) ? c.color : "blue";
        return { id, title, color };
      })
      .filter((c) => c.title && !seen.has(c.id) && seen.add(c.id));
    if (out.length > 0) return out.slice(0, 12);
  }
  const t = BOARD_TEMPLATES.find((x) => x.id === template) ?? BOARD_TEMPLATES[0];
  return t.columns.map((c) => ({ ...c }));
}

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
  const body = await readJson<{ name?: string; description?: string; color?: string; tags?: string[]; template?: string; columns?: ColumnInput[] }>(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return fail("Board title is required");
  if (name.length > 120) return fail("Board title is too long (max 120 characters)");
  const color = isValidBoardBackground(body.color) ? body.color : BOARD_COLORS[0].id;
  const tags = Array.isArray(body.tags)
    ? Array.from(new Set(body.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean))).slice(0, 20)
    : [];
  const project = await Project.create({
    name,
    description: typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "",
    color,
    tags,
    columns: resolveColumns(body.template, body.columns),
  });
  return ok(project, { status: 201 });
});
