"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Braces,
  KeyRound,
  Files,
  StickyNote,
  Wallet,
  GitBranch,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Archive,
  Check,
} from "lucide-react";
import { api, cn, useFetch } from "@/lib/client";
import { BOARD_COLORS, boardBackground, MODULES, type ModuleId } from "@/lib/constants";
import type { ProjectDetail } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { Spinner, ErrorBox, Badge } from "@/components/ui/Misc";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";
import { ProjectContext, useProject } from "./ProjectContext";

const ICONS: Record<ModuleId, React.ReactNode> = {
  overview: <LayoutDashboard size={17} />,
  tasks: <CheckSquare size={17} />,
  env: <Braces size={17} />,
  passwords: <KeyRound size={17} />,
  files: <Files size={17} />,
  notes: <StickyNote size={17} />,
  spending: <Wallet size={17} />,
  git: <GitBranch size={17} />,
};

export function ProjectShell({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, refetch, setData } = useFetch<ProjectDetail>(id ? `/api/projects/${id}` : null);
  const [collapsed, setCollapsed] = useState(false);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);

  const setProject = useCallback(
    (updater: (p: ProjectDetail) => ProjectDetail) => setData((prev) => (prev ? updater(prev) : prev)),
    [setData]
  );

  if (loading && !data) {
    return (
      <>
        <TopNav />
        <Spinner />
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <TopNav />
        <div className="mx-auto max-w-lg p-6">
          <ErrorBox message={error ?? "Project not found"} onRetry={() => refetch()} />
          <Link href="/boards" className="mt-3 inline-block text-sm font-semibold text-brand">
            ← Back to boards
          </Link>
        </div>
      </>
    );
  }

  const project = data;
  const base = `/boards/${project._id}`;
  const active = MODULES.find((m) => (m.path ? pathname.startsWith(base + m.path) : pathname === base)) ?? MODULES[0];

  async function toggleStar() {
    const next = !project.starred;
    setProject((p) => ({ ...p, starred: next }));
    try {
      await api.patch(`/api/projects/${project._id}`, { starred: next });
    } catch {
      setProject((p) => ({ ...p, starred: !next }));
    }
  }

  async function remove() {
    await api.del(`/api/projects/${project._id}`);
    toast("Board deleted", "success");
    router.replace("/boards");
  }

  return (
    <ProjectContext.Provider value={{ project, refetch, setProject }}>
      <div className="flex min-h-screen flex-col" style={{ background: boardBackground(project.color) }}>
        <TopNav transparent />
        {/* Board header */}
        <div className="flex h-14 items-center gap-2 bg-[#0000003d] px-4 text-white backdrop-blur-sm">
          <Link href="/boards" className="rounded p-1 hover:bg-white/20" title="All boards">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="truncate text-lg font-bold drop-shadow">{project.name}</h1>
          <button onClick={toggleStar} className={cn("rounded p-1.5 hover:bg-white/20", project.starred && "text-[#f5cd47]")} title="Star">
            <Star size={16} fill={project.starred ? "#f5cd47" : "none"} />
          </button>
          <Badge bg="rgba(255,255,255,.25)" fg="#fff" className="capitalize">
            {project.status}
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            {project.tags.slice(0, 4).map((t) => (
              <span key={t} className="hidden rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold md:inline">
                {t}
              </span>
            ))}
            <Menu
              trigger={
                <button className="flex h-8 items-center gap-1 rounded px-2 text-sm font-medium hover:bg-white/20">
                  <MoreHorizontal size={18} />
                </button>
              }
            >
              <MenuItem icon={<Pencil size={14} />} onClick={() => setEdit(true)}>
                Edit board
              </MenuItem>
              <MenuItem
                icon={<Archive size={14} />}
                onClick={async () => {
                  const status = project.status === "archived" ? "active" : "archived";
                  await api.patch(`/api/projects/${project._id}`, { status });
                  setProject((p) => ({ ...p, status }));
                }}
              >
                {project.status === "archived" ? "Unarchive" : "Archive"}
              </MenuItem>
              <MenuItem icon={<Trash2 size={14} />} danger onClick={() => setDel(true)}>
                Delete board
              </MenuItem>
            </Menu>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className={cn("hidden shrink-0 flex-col bg-[#0000003d] text-white backdrop-blur-sm transition-all md:flex", collapsed ? "w-14" : "w-60")}>
            <nav className="flex-1 space-y-0.5 p-2">
              {MODULES.map((m) => {
                const isActive = m.id === active.id;
                return (
                  <Link
                    key={m.id}
                    href={base + m.path}
                    title={m.label}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition",
                      isActive ? "bg-white text-ink shadow-sm" : "text-white/90 hover:bg-white/15"
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white" style={{ background: m.color }}>
                      {ICONS[m.id]}
                    </span>
                    {!collapsed ? <span className="truncate">{m.label}</span> : null}
                    {!collapsed ? <ModuleCount id={m.id} project={project} /> : null}
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => setCollapsed((c) => !c)} className="flex h-10 items-center justify-center border-t border-white/15 hover:bg-white/15">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="flex gap-1 overflow-x-auto bg-[#0000003d] px-2 py-1.5 md:hidden">
              {MODULES.map((m) => (
                <Link
                  key={m.id}
                  href={base + m.path}
                  className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", m.id === active.id ? "bg-white text-ink" : "bg-white/15 text-white")}
                >
                  {ICONS[m.id]} {m.label}
                </Link>
              ))}
            </div>
            <div className={cn("min-h-full", active.id === "tasks" ? "p-3 sm:p-4" : "bg-surface p-4 sm:p-6")}>{children}</div>
          </main>
        </div>
      </div>

      {edit ? <EditBoardModal open={edit} onClose={() => setEdit(false)} /> : null}
      <ConfirmDialog
        open={del}
        onClose={() => setDel(false)}
        onConfirm={remove}
        title={`Delete "${project.name}"?`}
        message="All tasks, env vars, passwords, notes, files and spending records in this board will be permanently deleted."
      />
    </ProjectContext.Provider>
  );
}

function ModuleCount({ id, project }: { id: ModuleId; project: ProjectDetail }) {
  const s = project.stats;
  const n =
    id === "tasks" ? s.tasks - s.doneTasks : id === "env" ? s.env : id === "passwords" ? s.passwords : id === "files" ? s.files : id === "notes" ? s.notes : id === "spending" ? s.expenses : null;
  if (n === null || n === 0) return null;
  return <span className="ml-auto rounded-full bg-black/15 px-1.5 text-[11px] font-semibold">{n}</span>;
}

function EditBoardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project, setProject } = useProject();
  const { toast } = useToast();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [color, setColor] = useState(project.color);
  const [status, setStatus] = useState(project.status);
  const [tags, setTags] = useState(project.tags.join(", "));
  const [links, setLinks] = useState(project.links.map((l) => `${l.label} | ${l.url}`).join("\n"));
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name,
        description,
        color,
        status,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        links: links
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const [label, url] = l.split("|").map((x) => x.trim());
            return url ? { label, url } : { label: label, url: label };
          }),
      };
      await api.patch(`/api/projects/${project._id}`, payload);
      setProject((p) => ({ ...p, ...payload, status: payload.status as ProjectDetail["status"] }));
      toast("Board updated", "success");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit board" width="max-w-md">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="t-label">Background</label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_COLORS.map((c) => (
              <button type="button" key={c.id} title={c.label} onClick={() => setColor(c.id)} className="relative h-9 rounded-md" style={{ background: c.css }}>
                {c.id === color ? <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow" /> : null}
              </button>
            ))}
          </div>
        </div>
        <Field label="Title">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[64px]" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectDetail["status"])}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Tags" hint="comma separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
        </div>
        <Field label="Quick links" hint="one per line: Label | https://url">
          <Textarea value={links} onChange={(e) => setLinks(e.target.value)} placeholder={"Production | https://app.example.com\nVercel | https://vercel.com/..."} className="min-h-[64px] mono text-xs" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
