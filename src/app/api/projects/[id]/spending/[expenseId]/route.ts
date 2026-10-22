import { Expense } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string; expenseId: string }>;

export const PATCH = withDB<Ctx>(async (req, { params }) => {
  const { id, expenseId } = await params;
  if (!isValidId(id) || !isValidId(expenseId)) return fail("Invalid id", 404);
  const body = await readJson<Record<string, unknown>>(req);
  const update: Record<string, unknown> = {};
  for (const k of ["title", "currency", "category", "recurring", "note"]) if (typeof body[k] === "string") update[k] = body[k];
  if ("amount" in body) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) return fail("Amount must be a positive number");
    update.amount = amount;
  }
  if (typeof body.date === "string") update.date = new Date(body.date);
  const e = await Expense.findOneAndUpdate({ _id: expenseId, projectId: id }, { $set: update }, { new: true }).lean();
  if (!e) return fail("Not found", 404);
  return ok(e);
});

export const DELETE = withDB<Ctx>(async (_req, { params }) => {
  const { id, expenseId } = await params;
  if (!isValidId(id) || !isValidId(expenseId)) return fail("Invalid id", 404);
  const res = await Expense.deleteOne({ _id: expenseId, projectId: id });
  if (!res.deletedCount) return fail("Not found", 404);
  return ok({ ok: true });
});
