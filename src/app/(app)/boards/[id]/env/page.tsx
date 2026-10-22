"use client";

import { useEffect, useMemo, useState } from "react";
import { Braces, Plus, Eye, EyeOff, Copy, Trash2, Pencil, Download, Upload, Check, Lock, Unlock } from "lucide-react";
import { api, cn, copyToClipboard, useFetch } from "@/lib/client";
import { ENVIRONMENTS, MODULES } from "@/lib/constants";
import type { EnvVar } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState, Badge } from "@/components/ui/Misc";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "env")!;
const ENV_BADGE: Record<string, { bg: string; fg: string }> = {
  development: { bg: "#e9f2ff", fg: "#09326c" },
  staging: { bg: "#fff7d6", fg: "#533f04" },
  production: { bg: "#ffeceb", fg: "#601e16" },
  test: { bg: "#f3f0ff", fg: "#352c63" },
};

export default function EnvPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/env`;
  const { data, loading, error, refetch, setData } = useFetch<EnvVar[]>(base);
  const [env, setEnv] = useState<string>("development");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EnvVar | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<EnvVar | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [allVisible, setAllVisible] = useState(false);

  const vars = data ?? [];
  const environments = useMemo(() => {
    const set = new Set<string>(ENVIRONMENTS);
    vars.forEach((v) => set.add(v.environment));
    return [...set];
  }, [vars]);
  const list = vars.filter((v) => v.environment === env);
  const countFor = (e: string) => vars.filter((v) => v.environment === e).length;

  async function reveal(v: EnvVar) {
    if (revealed[v._id] !== undefined) {
      setRevealed((r) => {
        const n = { ...r };
        delete n[v._id];
        return n;
      });
      return;
    }
    try {
      const full = await api.get<EnvVar>(`${base}/${v._id}`);
      setRevealed((r) => ({ ...r, [v._id]: full.value }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to reveal", "error");
    }
  }

  async function revealAll() {
    if (allVisible) {
      setRevealed({});
      setAllVisible(false);
      return;
    }
    try {
      const all = await api.get<EnvVar[]>(`${base}?reveal=1`);
      const map: Record<string, string> = {};
      all.forEach((v) => (map[v._id] = v.value));
      setRevealed(map);
      setAllVisible(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function copyValue(v: EnvVar) {
    let value = revealed[v._id];
    if (value === undefined) {
      const full = await api.get<EnvVar>(`${base}/${v._id}`);
      value = full.value;
    }
    if (await copyToClipboard(value)) {
      setCopied(v._id);
      setTimeout(() => setCopied(null), 1200);
    }
  }

  async function exportEnv() {
    try {
      const all = await api.get<EnvVar[]>(`${base}?reveal=1`);
      const text = all
        .filter((v) => v.environment === env)
        .map((v) => `${v.note ? `# ${v.note}\n` : ""}${v.key}=${/[\s#"']/.test(v.value) ? JSON.stringify(v.value) : v.value}`)
        .join("\n");
      if (await copyToClipboard(text + "\n")) toast(`.env for ${env} copied to clipboard`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function remove(v: EnvVar) {
    await api.del(`${base}/${v._id}`);
    setData((prev) => (prev ? prev.filter((x) => x._id !== v._id) : prev));
    refetchProject(true);
    toast("Variable deleted", "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ModuleHeader
        title="Environment variables"
        description="Encrypted at rest. Reveal, copy or export as a .env file."
        color={MOD.color}
        icon={<Braces size={20} />}
        actions={
          <>
            <Button variant="secondary" icon={<Upload size={15} />} onClick={() => setImporting(true)}>
              Import .env
            </Button>
            <Button variant="secondary" icon={<Download size={15} />} onClick={exportEnv} disabled={list.length === 0}>
              Copy as .env
            </Button>
            <Button color={MOD.color} icon={<Plus size={15} />} onClick={() => setEditing("new")}>
              Add variable
            </Button>
          </>
        }
      />

      {/* Environment tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-line">
        {environments.map((e) => (
          <button
            key={e}
            onClick={() => setEnv(e)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold capitalize transition",
              env === e ? "border-current text-ink" : "border-transparent text-ink-muted hover:text-ink"
            )}
            style={env === e ? { color: MOD.color } : undefined}
          >
            {e}
            <span className="rounded-full bg-[#091e420f] px-1.5 text-[11px] text-ink-soft">{countFor(e)}</span>
          </button>
        ))}
        <button onClick={revealAll} className="ml-auto flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-ink-muted hover:text-ink">
          {allVisible ? <Lock size={13} /> : <Unlock size={13} />} {allVisible ? "Hide all" : "Reveal all"}
        </button>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Braces size={22} />}
          color={MOD.color}
          title={`No variables for ${env}`}
          description="Add variables one by one, or paste a whole .env file to import them."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setImporting(true)}>
                Import .env
              </Button>
              <Button color={MOD.color} onClick={() => setEditing("new")}>
                Add variable
              </Button>
            </div>
          }
        />
      ) : (
        <div className="t-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f8f9] text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Note</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((v) => {
                const shown = revealed[v._id];
                return (
                  <tr key={v._id} className="group hover:bg-[#f7f8f9]">
                    <td className="px-4 py-2.5 align-top">
                      <div className="mono font-semibold text-ink">{v.key}</div>
                      <Badge bg={ENV_BADGE[v.environment]?.bg ?? "#f1f2f4"} fg={ENV_BADGE[v.environment]?.fg ?? "#44546f"} className="mt-1 capitalize md:hidden">
                        {v.environment}
                      </Badge>
                    </td>
                    <td className="max-w-[320px] px-4 py-2.5 align-top">
                      {shown !== undefined ? (
                        <code className="mono block break-all rounded bg-[#f3f0ff] px-2 py-1 text-xs text-[#352c63]">{shown || <i className="text-ink-muted">empty</i>}</code>
                      ) : v.secret ? (
                        <span className="mono tracking-widest text-ink-muted">{v.hasValue ? "••••••••••••" : <i className="tracking-normal">empty</i>}</span>
                      ) : (
                        <code className="mono block break-all text-xs text-ink">{v.value}</code>
                      )}
                    </td>
                    <td className="hidden max-w-[200px] truncate px-4 py-2.5 align-top text-ink-muted md:table-cell">{v.note}</td>
                    <td className="px-2 py-1.5 align-top">
                      <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100">
                        <IconButton title={shown !== undefined ? "Hide" : "Reveal"} onClick={() => reveal(v)}>
                          {shown !== undefined ? <EyeOff size={15} /> : <Eye size={15} />}
                        </IconButton>
                        <IconButton title="Copy value" onClick={() => copyValue(v)}>
                          {copied === v._id ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                        </IconButton>
                        <IconButton title="Edit" onClick={() => setEditing(v)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton title="Delete" onClick={() => setDeleting(v)} className="hover:!text-danger">
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <EnvModal
          base={base}
          environments={environments}
          defaultEnv={env}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refetch(true);
            refetchProject(true);
            setEditing(null);
          }}
        />
      ) : null}
      {importing ? (
        <ImportModal
          base={base}
          environments={environments}
          defaultEnv={env}
          onClose={() => setImporting(false)}
          onDone={(n, e) => {
            toast(`Imported ${n} variable${n === 1 ? "" : "s"} into ${e}`, "success");
            setEnv(e);
            refetch(true);
            refetchProject(true);
            setImporting(false);
          }}
        />
      ) : null}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title={`Delete ${deleting?.key}?`} />
    </div>
  );
}

function EnvModal({ base, environments, defaultEnv, item, onClose, onSaved }: { base: string; environments: string[]; defaultEnv: string; item: EnvVar | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [key, setKey] = useState(item?.key ?? "");
  const [value, setValue] = useState("");
  const [loadedValue, setLoadedValue] = useState(!item);
  const [note, setNote] = useState(item?.note ?? "");
  const [secret, setSecret] = useState(item?.secret ?? true);
  const [environment, setEnvironment] = useState(item?.environment ?? defaultEnv);
  const [customEnv, setCustomEnv] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    api.get<EnvVar>(`${base}/${item._id}`).then((v) => {
      if (cancelled) return;
      setValue(v.value);
      setLoadedValue(true);
    });
    return () => {
      cancelled = true;
    };
  }, [base, item]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const envName = environment === "__custom" ? customEnv.trim() : environment;
    try {
      if (item) await api.patch(`${base}/${item._id}`, { key, value, note, secret, environment: envName });
      else await api.post(base, { key, value, note, secret, environment: envName });
      toast("Saved", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Edit variable" : "Add variable"} accent={MOD.color} width="max-w-md">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Environment">
            <Select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
              {environments.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
              <option value="__custom">+ custom…</option>
            </Select>
          </Field>
          {environment === "__custom" ? (
            <Field label="Name">
              <Input value={customEnv} onChange={(e) => setCustomEnv(e.target.value)} placeholder="preview" />
            </Field>
          ) : (
            <Field label="Visibility">
              <Select value={secret ? "secret" : "plain"} onChange={(e) => setSecret(e.target.value === "secret")}>
                <option value="secret">Secret (hidden)</option>
                <option value="plain">Plain (always visible)</option>
              </Select>
            </Field>
          )}
        </div>
        <Field label="Key">
          <Input autoFocus className="mono" value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))} placeholder="DATABASE_URL" />
        </Field>
        <Field label="Value">
          <Textarea className="mono min-h-[72px] text-xs" value={value} onChange={(e) => setValue(e.target.value)} placeholder={loadedValue ? "value" : "loading…"} disabled={!loadedValue} />
        </Field>
        <Field label="Note" hint="optional">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where it comes from, who owns it…" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color={MOD.color} loading={busy} disabled={!key.trim() || (environment === "__custom" && !customEnv.trim())}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ base, environments, defaultEnv, onClose, onDone }: { base: string; environments: string[]; defaultEnv: string; onClose: () => void; onDone: (count: number, env: string) => void }) {
  const { toast } = useToast();
  const [raw, setRaw] = useState("");
  const [environment, setEnvironment] = useState(defaultEnv);
  const [busy, setBusy] = useState(false);
  const count = raw.split(/\r?\n/).filter((l) => /^\s*(export\s+)?[A-Za-z_][A-Za-z0-9_.-]*\s*=/.test(l)).length;

  async function submit() {
    setBusy(true);
    try {
      const res = await api.post<{ imported: number }>(base, { raw, environment });
      onDone(res.imported, environment);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Import .env"
      accent={MOD.color}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button color={MOD.color} loading={busy} disabled={count === 0} onClick={submit}>
            Import {count > 0 ? `${count} variable${count === 1 ? "" : "s"}` : ""}
          </Button>
        </>
      }
    >
      <Field label="Into environment" className="mb-3">
        <Select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
          {environments.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Paste .env contents" hint="existing keys are overwritten">
        <Textarea className="mono min-h-[220px] text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={"# comments are ignored\nDATABASE_URL=postgres://...\nNEXT_PUBLIC_API=https://api.example.com"} />
      </Field>
    </Modal>
  );
}
