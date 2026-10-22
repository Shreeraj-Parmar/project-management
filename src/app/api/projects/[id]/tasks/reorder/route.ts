import { Task } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string }>;
type Move = { taskId: string; columnId: string; order: number };

/** Bulk update positions after a drag & drop. */
export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ moves?: Move[]; doneColumnId?: string | null }>(req);
  const moves = (body.moves ?? []).filter((m) => isValidId(m.taskId));
  if (moves.length === 0) return ok({ ok: true });
  await Task.bulkWrite(
    moves.map((m) => ({
      updateOne: {
        filter: { _id: m.taskId, projectId: id },
        update: { $set: { columnId: m.columnId, order: m.order } },
      },
    }))
  );
  return ok({ ok: true });
});
