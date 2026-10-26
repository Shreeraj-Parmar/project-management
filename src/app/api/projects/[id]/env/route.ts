import { EnvVar } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { encrypt, decrypt } from "@/lib/crypto";
import { cleanTags, parseEnvText } from "@/lib/dotenv";

type Ctx = Params<{ id: string }>;

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

function cleanEnvironments(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((e): e is string => typeof e === "string").map((e) => e.trim()).filter(Boolean))];
}

export const GET = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const url = new URL(req.url);
  const reveal = url.searchParams.get("reveal") === "1";
  const vars = await EnvVar.find({ projectId: id }).sort({ environment: 1, key: 1 }).lean();
  return ok(
    vars.map((v) => ({
      ...v,
      tags: v.tags ?? [],
      value: reveal ? decrypt(v.value) : v.secret ? "" : decrypt(v.value),
      hasValue: Boolean(v.value),
    }))
  );
});

type PostBody = {
  environment?: string;
  key?: string;
  value?: string;
  note?: string;
  secret?: boolean;
  tags?: string[];
  raw?: string;
  /** Bulk add: every item goes into every environment listed. */
  items?: { key?: string; value?: string }[];
  environments?: string[];
};

/**
 * Create one variable; bulk import a pasted .env block via { environment, raw };
 * or bulk add via { items, environments, note, secret, tags } (Vercel-style, one row per key per environment).
 */
export const POST = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<PostBody>(req);
  const environment = body.environment?.trim() || "development";

  if (Array.isArray(body.items)) {
    const environments = cleanEnvironments(body.environments);
    if (environments.length === 0) return fail("Pick at least one environment");
    const items = body.items
      .filter((i) => typeof i?.key === "string" && i.key.trim())
      .map((i) => ({ key: i.key!.trim(), value: typeof i.value === "string" ? i.value : "" }));
    if (items.length === 0) return fail("Add at least one key");
    const bad = items.find((i) => !KEY_RE.test(i.key));
    if (bad) return fail(`${bad.key} is not a valid key`);
    const set = { note: body.note ?? "", secret: body.secret ?? true, tags: cleanTags(body.tags) };
    await EnvVar.bulkWrite(
      environments.flatMap((env) =>
        items.map((i) => ({
          updateOne: {
            filter: { projectId: id, environment: env, key: i.key },
            update: { $set: { ...set, value: encrypt(i.value) } },
            upsert: true,
          },
        }))
      )
    );
    return ok({ created: items.length * environments.length }, { status: 201 });
  }

  if (body.raw) {
    const pairs = parseEnvText(body.raw);
    if (pairs.length === 0) return fail("No KEY=VALUE lines found");
    // Upsert each key within the environment
    await EnvVar.bulkWrite(
      pairs.map((p) => ({
        updateOne: {
          filter: { projectId: id, environment, key: p.key },
          update: { $set: { value: encrypt(p.value) }, $setOnInsert: { secret: true, note: "", tags: [] } },
          upsert: true,
        },
      }))
    );
    return ok({ imported: pairs.length }, { status: 201 });
  }

  if (!body.key?.trim()) return fail("Key is required");
  const doc = await EnvVar.findOneAndUpdate(
    { projectId: id, environment, key: body.key.trim() },
    { $set: { value: encrypt(body.value ?? ""), note: body.note ?? "", secret: body.secret ?? true, tags: cleanTags(body.tags) } },
    { new: true, upsert: true }
  ).lean();
  return ok({ ...doc, value: body.value ?? "", hasValue: Boolean(body.value) }, { status: 201 });
});

/**
 * Raw editor save (Railway-style): `set` upserts values (new keys become secrets, existing keys keep note, tags and visibility),
 * `remove` deletes keys. Both apply to one environment.
 */
export const PUT = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ environment?: string; set?: { key?: string; value?: string }[]; remove?: string[] }>(req);
  const environment = body.environment?.trim();
  if (!environment) return fail("Environment is required");
  const set = (Array.isArray(body.set) ? body.set : [])
    .filter((p) => typeof p?.key === "string" && p.key.trim())
    .map((p) => ({ key: p.key!.trim(), value: typeof p.value === "string" ? p.value : "" }));
  const bad = set.find((p) => !KEY_RE.test(p.key));
  if (bad) return fail(`${bad.key} is not a valid key`);
  const remove = (Array.isArray(body.remove) ? body.remove : []).filter((k): k is string => typeof k === "string" && !!k);

  const ops = [
    ...set.map((p) => ({
      updateOne: {
        filter: { projectId: id, environment, key: p.key },
        update: { $set: { value: encrypt(p.value) }, $setOnInsert: { secret: true, note: "", tags: [] } },
        upsert: true,
      },
    })),
    ...(remove.length ? [{ deleteMany: { filter: { projectId: id, environment, key: { $in: remove } } } }] : []),
  ];
  if (ops.length > 0) await EnvVar.bulkWrite(ops);
  return ok({ set: set.length, removed: remove.length });
});
