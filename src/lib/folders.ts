import { FileItem, Folder } from "@/models";
import { deleteObject } from "@/lib/s3";

export const cleanSegment = (raw: string) => raw.trim().replace(/[\/\\]+/g, "-").replace(/^\.+/, "").slice(0, 80);
export const cleanPath = (raw: string) =>
  raw
    .split("/")
    .map((s) => cleanSegment(s))
    .filter(Boolean)
    .join("/");
export const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
export const join = (parent: string, name: string) => (parent ? `${parent}/${name}` : name);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Move / rename a folder: rewrites the path prefix on the folder, every descendant folder and every file under it. */
export async function relocateFolder(projectId: string, from: string, to: string) {
  if (from === to) return;
  const re = new RegExp(`^${escapeRe(from)}(/|$)`);
  const [folders, files] = await Promise.all([
    Folder.find({ projectId, path: re }).lean(),
    FileItem.find({ projectId, folder: re }).lean(),
  ]);
  const rewrite = (p: string) => to + p.slice(from.length);
  const ops = folders.map((f) => {
    const path = rewrite(f.path);
    return { updateOne: { filter: { _id: f._id }, update: { $set: { path, name: path.split("/").pop() } } } };
  });
  if (ops.length) await Folder.bulkWrite(ops);
  const fileOps = files.map((f) => ({ updateOne: { filter: { _id: f._id }, update: { $set: { folder: rewrite(f.folder) } } } }));
  if (fileOps.length) await FileItem.bulkWrite(fileOps);
}

/** Delete a folder with everything inside (S3 objects included, best effort). Returns how many files went. */
export async function deleteFolderTree(projectId: string, path: string): Promise<number> {
  const re = new RegExp(`^${escapeRe(path)}(/|$)`);
  const files = await FileItem.find({ projectId, folder: re }).lean();
  await Promise.all([Folder.deleteMany({ projectId, path: re }), FileItem.deleteMany({ projectId, folder: re })]);
  await Promise.allSettled(files.map((f) => deleteObject(f.key).catch((err) => console.warn("[folders] failed to delete S3 object", f.key, err))));
  return files.length;
}

/** Make sure every ancestor folder of `path` exists as a record (so folders created implicitly by uploads are real). */
export async function ensureFolders(projectId: string, path: string) {
  if (!path) return;
  const parts = path.split("/");
  const ops = parts.map((_, i) => {
    const p = parts.slice(0, i + 1).join("/");
    return { updateOne: { filter: { projectId, path: p }, update: { $setOnInsert: { name: parts[i] } }, upsert: true } };
  });
  await Folder.bulkWrite(ops);
}
