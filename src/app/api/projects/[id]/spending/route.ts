import { Expense } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const expenses = await Expense.find({ projectId: id }).sort({ date: -1 }).lean();
  return ok(expenses);
});

export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ title?: string; amount?: number; currency?: string; category?: string; date?: string; recurring?: string; note?: string }>(req);
  if (!body.title?.trim()) return fail("Title is required");
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) return fail("Amount must be a positive number");
  const expense = await Expense.create({
    projectId: id,
    title: body.title.trim(),
    amount,
    currency: body.currency ?? "USD",
    category: body.category ?? "Other",
    date: body.date ? new Date(body.date) : new Date(),
    recurring: body.recurring ?? "none",
    note: body.note ?? "",
  });
  return ok(expense, { status: 201 });
});
