"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Eye, EyeOff, Copy, Trash2, Pencil, ExternalLink, Check, User, Search, Shuffle } from "lucide-react";
import { api, cn, copyToClipboard, relativeTime, useFetch } from "@/lib/client";
import { MODULES, PASSWORD_CATEGORIES } from "@/lib/constants";
import type { PasswordItem } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState, Badge } from "@/components/ui/Misc";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "passwords")!;
const CAT_COLORS: Record<string, string> = {
  Server: "#0c66e4",
  Database: "#1f845a",
  "API Key": "#5e4db2",
  Service: "#c25100",
  Email: "#946f00",
  Social: "#ae4787",
  Other: "#626f86",
};

function generatePassword(len = 20) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function PasswordsPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/passwords`;
  const { data, loading, error, refetch, setData } = useFetch<PasswordItem[]>(base);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<PasswordItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<PasswordItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const items = data ?? [];
  const list = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((p) => (cat === "all" || p.category === cat) && (!q || p.title.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)));
  }, [items, query, cat]);

  async function getSecret(p: PasswordItem): Promise<string> {
    if (revealed[p._id] !== undefined) return revealed[p._id];
    const full = await api.get<PasswordItem>(`${base}/${p._id}`);
    return full.password ?? "";
  }

  async function toggleReveal(p: PasswordItem) {
    if (revealed[p._id] !== undefined) {
      setRevealed((r) => {
        const n = { ...r };
        delete n[p._id];
        return n;
      });
      return;
    }
    try {
      const s = await getSecret(p);
      setRevealed((r) => ({ ...r, [p._id]: s }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function copy(p: PasswordItem, what: "password" | "username") {
    try {
      const text = what === "password" ? await getSecret(p) : p.username;
      if (await copyToClipboard(text)) {
        setCopied(`${p._id}:${what}`);
        setTimeout(() => setCopied(null), 1200);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function remove(p: PasswordItem) {
    await api.del(`${base}/${p._id}`);
    setData((prev) => (prev ? prev.filter((x) => x._id !== p._id) : prev));
    refetchProject(true);
    toast("Entry deleted", "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ModuleHeader
        title="Passwords & credentials"
        description="Server logins, DB users, API keys. Secrets are AES-256 encrypted and only decrypted when you reveal them."
        color={MOD.color}
        icon={<KeyRound size={20} />}
        actions={
          <Button color={MOD.color} icon={<Plus size={15} />} onClick={() => setEditing("new")}>
            Add credential
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="h-9 w-56 pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["all", ...PASSWORD_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold transition", cat === c ? "text-white" : "bg-[#091e420f] text-ink-soft hover:bg-[#091e4224]")}
              style={cat === c ? { background: c === "all" ? MOD.color : CAT_COLORS[c] } : undefined}
            >
              {c === "all" ? "All" : c}
              {c !== "all" ? <span className="ml-1 opacity-70">{items.filter((p) => p.category === c).length}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={22} />}
          color={MOD.color}
          title={items.length === 0 ? "No credentials yet" : "Nothing matches"}
          description="Store server SSH logins, database users, API keys and service accounts for this project."
          action={
            items.length === 0 ? (
              <Button color={MOD.color} onClick={() => setEditing("new")}>
                Add credential
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const shown = revealed[p._id];
            const color = CAT_COLORS[p.category] ?? CAT_COLORS.Other;
            return (
              <div key={p._id} className="t-card group relative overflow-hidden p-4">
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-ink">{p.title}</h3>
                      <Badge bg={color + "22"} fg={color}>
                        {p.category}
                      </Badge>
                    </div>
                    {p.url ? (
                      <a href={/^https?:/.test(p.url) ? p.url : `https://${p.url}`} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1 truncate text-xs text-brand hover:underline">
                        <ExternalLink size={11} /> {p.url}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center opacity-60 group-hover:opacity-100">
                    <IconButton title="Edit" onClick={() => setEditing(p)}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton title="Delete" onClick={() => setDeleting(p)} className="hover:!text-danger">
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-3 space-y-2 pl-2 text-sm">
                  {p.username ? (
                    <div className="flex items-center gap-2">
                      <User size={14} className="shrink-0 text-ink-muted" />
                      <span className="mono truncate text-ink">{p.username}</span>
                      <IconButton title="Copy username" onClick={() => copy(p, "username")} className="ml-auto h-7 w-7">
                        {copied === `${p._id}:username` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </IconButton>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <KeyRound size={14} className="shrink-0 text-ink-muted" />
                    {shown !== undefined ? (
                      <code className="mono truncate rounded bg-[#ffeceb] px-1.5 py-0.5 text-xs text-[#601e16]">{shown || <i>empty</i>}</code>
                    ) : (
                      <span className="mono tracking-widest text-ink-muted">{p.hasPassword ? "••••••••••••" : <i className="tracking-normal">empty</i>}</span>
                    )}
                    <div className="ml-auto flex items-center">
                      <IconButton title={shown !== undefined ? "Hide" : "Reveal"} onClick={() => toggleReveal(p)} className="h-7 w-7">
                        {shown !== undefined ? <EyeOff size={14} /> : <Eye size={14} />}
                      </IconButton>
                      <IconButton title="Copy password" onClick={() => copy(p, "password")} className="h-7 w-7">
                        {copied === `${p._id}:password` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </IconButton>
                    </div>
                  </div>
                  {p.notes ? <p className="whitespace-pre-wrap rounded bg-[#f7f8f9] p-2 text-xs text-ink-soft">{p.notes}</p> : null}
                </div>
                <div className="mt-3 pl-2 text-[11px] text-ink-muted">Updated {relativeTime(p.updatedAt)}</div>
              </div>
            );
          })}
        </div>
      )}

      {editing ? (
        <PasswordModal
          base={base}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refetch(true);
            refetchProject(true);
            setRevealed({});
            setEditing(null);
          }}
        />
      ) : null}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title={`Delete "${deleting?.title}"?`} />
    </div>
  );
}

function PasswordModal({ base, item, onClose, onSaved }: { base: string; item: PasswordItem | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState(item?.category ?? "Server");
  const [username, setUsername] = useState(item?.username ?? "");
  const [password, setPassword] = useState("");
  const [loaded, setLoaded] = useState(!item);
  const [show, setShow] = useState(!item);
  const [url, setUrl] = useState(item?.url ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    api.get<PasswordItem>(`${base}/${item._id}`).then((p) => {
      if (cancelled) return;
      setPassword(p.password ?? "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [base, item]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { title, category, username, password, url, notes };
      if (item) await api.patch(`${base}/${item._id}`, body);
      else await api.post(base, body);
      toast("Saved", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Edit credential" : "Add credential"} accent={MOD.color} width="max-w-md">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <Field label="Title">
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Production server (SSH)" />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {PASSWORD_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Username / email / key id">
          <Input className="mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="root" />
        </Field>
        <Field label="Password / secret">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input type={show ? "text" : "password"} className="mono pr-9" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!loaded} placeholder={loaded ? "" : "loading…"} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Button type="button" variant="secondary" icon={<Shuffle size={14} />} onClick={() => { setPassword(generatePassword()); setShow(true); }} title="Generate strong password">
              Generate
            </Button>
          </div>
        </Field>
        <Field label="URL / host" hint="optional">
          <Input className="mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ssh 1.2.3.4 or https://console…" />
        </Field>
        <Field label="Notes" hint="optional">
          <Textarea className="min-h-[64px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Port, 2FA backup codes location, etc." />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color={MOD.color} loading={busy} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
