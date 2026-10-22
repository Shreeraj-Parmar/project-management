import { Project } from "@/models";
import { ok, fail, withDB, readJson, isValidId, type Params } from "@/lib/api-helpers";
import { decrypt, encrypt } from "@/lib/crypto";
import { fetchGitSnapshot, parseRepo } from "@/lib/github";

type Ctx = Params<{ id: string }>;

/** Fetch live GitHub data for the connected repo. */
export const GET = withDB<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const project = await Project.findById(id).lean();
  if (!project) return fail("Project not found", 404);
  const repo = project.git?.repo;
  if (!repo) return ok({ connected: false, hasToken: false, globalToken: Boolean(process.env.GITHUB_TOKEN) });
  const token = project.git?.token ? decrypt(project.git.token) : undefined;
  try {
    const snapshot = await fetchGitSnapshot(repo, token);
    return ok({ connected: true, hasToken: Boolean(token), globalToken: Boolean(process.env.GITHUB_TOKEN), ...snapshot });
  } catch (err) {
    return ok({
      connected: true,
      hasToken: Boolean(token),
      globalToken: Boolean(process.env.GITHUB_TOKEN),
      repoName: repo,
      error: err instanceof Error ? err.message : "Failed to reach GitHub",
    });
  }
});

/** Connect / disconnect a repo. body: { repo: "owner/name" | url | "", token?: string } */
export const PUT = withDB<Ctx>(async (req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 404);
  const body = await readJson<{ repo?: string; token?: string }>(req);
  const update: Record<string, string> = {};
  if (typeof body.repo === "string") {
    if (body.repo.trim() === "") {
      update["git.repo"] = "";
      update["git.token"] = "";
    } else {
      const parsed = parseRepo(body.repo);
      if (!parsed) return fail("Enter a repo as owner/name or a GitHub URL");
      update["git.repo"] = parsed;
    }
  }
  if (typeof body.token === "string") update["git.token"] = body.token ? encrypt(body.token) : "";
  const project = await Project.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!project) return fail("Project not found", 404);
  return ok({ repo: project.git?.repo ?? "", hasToken: Boolean(project.git?.token) });
});
