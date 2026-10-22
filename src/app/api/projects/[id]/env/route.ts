import { EnvVar } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt, decrypt } from "@/lib/crypto";

type Ctx = Params<{ id: string }>;

export const GET = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const url = new URL(req.url);
  const reveal = url.searchParams.get("reveal") === "1";
  const vars = await EnvVar.find({ projectId: id }).sort({ environment: 1, key: 1 }).lean();
  return ok(
    vars.map((v) => ({
      ...v,
      value: reveal ? decrypt(v.value) : v.secret ? "" : decrypt(v.value),
      hasValue: Boolean(v.value),
    }))
  );
});

/** Create one variable, or bulk import from a pasted .env block via { environment, raw }. */
export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ environment?: string; key?: string; value?: string; note?: string; secret?: boolean; raw?: string }>(req);
  const environment = body.environment?.trim() || "development";

  if (body.raw) {
    const lines = body.raw.split(/\r?\n/);
    const docs: { projectId: string; environment: string; key: string; value: string; secret: boolean }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      docs.push({ projectId: id, environment, key: m[1], value: encrypt(value), secret: true });
    }
    if (docs.length === 0) return fail("No KEY=VALUE lines found");
    // Upsert each key within the environment
    await EnvVar.bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { projectId: id, environment, key: d.key },
          update: { $set: { value: d.value }, $setOnInsert: { secret: true, note: "" } },
          upsert: true,
        },
      }))
    );
    return ok({ imported: docs.length }, { status: 201 });
  }

  if (!body.key?.trim()) return fail("Key is required");
  const doc = await EnvVar.findOneAndUpdate(
    { projectId: id, environment, key: body.key.trim() },
    { $set: { value: encrypt(body.value ?? ""), note: body.note ?? "", secret: body.secret ?? true } },
    { new: true, upsert: true }
  ).lean();
  return ok({ ...doc, value: body.value ?? "", hasValue: Boolean(body.value) }, { status: 201 });
});
