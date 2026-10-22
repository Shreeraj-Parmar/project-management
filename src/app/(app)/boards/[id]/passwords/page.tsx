"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Plus, SearchX } from "lucide-react";
import { api, useFetch } from "@/lib/client";
import { MODULES, PASSWORD_CATEGORIES } from "@/lib/constants";
import type { PasswordItem } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { EmptyState, ErrorBox, PageHeader } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { CredentialCard } from "@/components/passwords/CredentialCard";
import { CredentialModal } from "@/components/passwords/CredentialModal";
import { CredentialSkeletons, GRID_CLASS } from "@/components/passwords/CredentialSkeletons";
import { categoryMeta } from "@/components/passwords/categories";
import { isSortKey, VaultToolbar, type SortKey } from "@/components/passwords/VaultToolbar";
import { usePersistedState } from "@/components/passwords/usePersistedState";
import { useSecrets } from "@/components/passwords/useSecrets";

const MOD = MODULES.find((m) => m.id === "passwords")!;
const CATEGORY_ORDER: string[] = [...PASSWORD_CATEGORIES];

function sortItems(items: PasswordItem[], sort: SortKey): PasswordItem[] {
  const byName = (a: PasswordItem, b: PasswordItem) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true });
  const time = (p: PasswordItem) => new Date(p.updatedAt).getTime() || 0;
  const rank = (p: PasswordItem) => {
    const i = CATEGORY_ORDER.indexOf(p.category);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  const copy = [...items];
  if (sort === "updated") return copy.sort((a, b) => time(b) - time(a) || byName(a, b));
  if (sort === "oldest") return copy.sort((a, b) => time(a) - time(b) || byName(a, b));
  if (sort === "category") return copy.sort((a, b) => rank(a) - rank(b) || byName(a, b));
  return copy.sort(byName);
}

/** True when a key press should not trigger a page shortcut (typing, a dialog or a menu is open, modifier keys). */
function shortcutBlocked(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return true;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return true;
  return Boolean(document.querySelector('[aria-modal="true"], [role="menu"], [role="dialog"]'));
}

export default function PasswordsPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/passwords`;
  const { data, loading, error, refetch, setData } = useFetch<PasswordItem[]>(base);
  const secrets = useSecrets(base);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = usePersistedState<SortKey>("devboard.passwords.sort", "name", isSortKey);
  const [editing, setEditing] = useState<PasswordItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<PasswordItem | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useMemo(() => data ?? [], [data]);
  const q = query.trim().toLowerCase();

  // Search matches title, username, URL, notes and category. It never looks at the secret.
  const matchesQuery = useCallback(
    (p: PasswordItem) => !q || [p.title, p.username, p.url, p.notes, p.category].some((v) => (v ?? "").toLowerCase().includes(q)),
    [q]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const p of items) {
      if (!matchesQuery(p)) continue;
      c.all += 1;
      c[p.category] = (c[p.category] ?? 0) + 1;
    }
    return c;
  }, [items, matchesQuery]);

  const visible = useMemo(() => sortItems(items.filter((p) => matchesQuery(p) && (category === "all" || p.category === category)), sort), [items, matchesQuery, category, sort]);
  const filtering = q.length > 0 || category !== "all";

  const openAdd = useCallback(() => setEditing("new"), []);

  // `n` adds a credential, like every other module page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || shortcutBlocked(e) || !data) return;
      e.preventDefault();
      openAdd();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [data, openAdd]);

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    []
  );

  function onSaved(saved: PasswordItem, mode: "created" | "updated") {
    setData((prev) => {
      const list = prev ?? [];
      return list.some((p) => p._id === saved._id) ? list.map((p) => (p._id === saved._id ? saved : p)) : [...list, saved];
    });
    secrets.hide(saved._id);
    refetchProject(true);
    setEditing(null);
    // Make the result findable: reset filters that would hide it, flash the card and bring it into view.
    if (mode === "created") {
      setQuery("");
      if (category !== "all" && category !== saved.category) setCategory("all");
    }
    setHighlightId(saved._id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 2400);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`cred-${saved._id}`)?.closest("li")?.scrollIntoView({ block: "nearest", behavior: "smooth" })));
  }

  /** After a card disappears keyboard focus would fall to <body>: move it to the card that took its place. */
  function refocusAfterRemove(index: number) {
    window.setTimeout(() => {
      const titles = document.querySelectorAll<HTMLElement>('ul[aria-label="Credentials"] h3 button');
      const next = titles[Math.min(index, titles.length - 1)];
      (next ?? document.querySelector<HTMLElement>('[data-vault-add]'))?.focus();
    }, 60);
  }

  async function remove(p: PasswordItem): Promise<void> {
    const index = visible.findIndex((x) => x._id === p._id);
    try {
      await api.del(`${base}/${p._id}`);
      setData((prev) => (prev ? prev.filter((x) => x._id !== p._id) : prev));
      refocusAfterRemove(index);
      secrets.hide(p._id);
      refetchProject(true);
      toast(`Credential "${p.title.length > 48 ? `${p.title.slice(0, 47)}...` : p.title}" deleted.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete this credential.", "error", { action: { label: "Retry", onClick: () => void remove(p) } });
    }
  }

  const header = (
    <PageHeader
      title="Passwords"
      description={<span className="hidden sm:inline">Server logins, database users and API keys. Secrets are encrypted and only decrypted when you reveal them.</span>}
      color={MOD.color}
      icon={<KeyRound size={20} />}
      actions={
        <Button icon={<Plus size={16} />} onClick={openAdd} title="Add credential (N)" data-vault-add>
          Add credential
        </Button>
      }
    />
  );

  let body: React.ReactNode;
  if (loading && !data) {
    body = <CredentialSkeletons />;
  } else if (error && !data) {
    body = <ErrorBox title="Couldn't load credentials" message={error} onRetry={() => refetch()} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon={<KeyRound size={24} />}
        color={MOD.color}
        title="No credentials yet"
        description="Keep this project's server logins, database users and API keys in one place."
        action={<Button onClick={openAdd}>Add credential</Button>}
      />
    );
  } else if (visible.length === 0) {
    const cat = category !== "all" ? category : null;
    const CatIcon = cat ? categoryMeta(cat).icon : SearchX;
    body = (
      <EmptyState
        compact
        icon={<CatIcon size={22} />}
        color={cat && !q ? MOD.color : "#626f86"}
        title={q ? `Nothing matches \u201c${query.trim()}\u201d` : `No ${cat} credentials yet`}
        description={q ? (cat ? `No ${cat} credentials match your search.` : "Check the spelling, or search for a title, username, URL or note.") : "Add one, or switch back to all credentials."}
        action={
          <>
            {q ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : (
              <Button onClick={openAdd}>Add {cat} credential</Button>
            )}
            {cat ? (
              <Button variant="subtle" onClick={() => setCategory("all")}>
                Show all credentials
              </Button>
            ) : null}
          </>
        }
      />
    );
  } else {
    body = (
      <>
        {error ? <ErrorBox className="mb-3" title="Couldn't refresh credentials" message={error} onRetry={() => refetch(true)} /> : null}
        {filtering ? (
          <p aria-live="polite" className="mb-3 text-body-sm text-ink-muted">
            Showing {visible.length} of {items.length} {items.length === 1 ? "credential" : "credentials"}
          </p>
        ) : null}
        <ul aria-label="Credentials" className={GRID_CLASS}>
          {visible.map((p) => (
            <li key={p._id} className="min-w-0">
              <CredentialCard
                item={p}
                secret={secrets.revealed[p._id]}
                revealing={Boolean(secrets.pending[p._id])}
                copied={secrets.copied}
                highlighted={highlightId === p._id}
                onToggleReveal={secrets.toggleReveal}
                onCopy={secrets.copy}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            </li>
          ))}
        </ul>
      </>
    );
  }

  const showToolbar = items.length > 0;

  return (
    <div className="@container">
      {header}
      {showToolbar ? (
        <VaultToolbar
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={setCategory}
          counts={counts}
          sort={sort}
          onSort={setSort}
          revealedCount={secrets.revealedCount}
          onHideAll={secrets.hideAll}
        />
      ) : null}
      {body}

      {editing ? (
        <CredentialModal
          key={editing === "new" ? "new" : editing._id}
          base={base}
          item={editing === "new" ? null : editing}
          defaultCategory={category !== "all" ? category : undefined}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => (deleting ? remove(deleting) : undefined)}
        title={deleting ? `Delete "${deleting.title.length > 60 ? `${deleting.title.slice(0, 59)}...` : deleting.title}"?` : "Delete credential?"}
        message="The stored secret is removed permanently. There is no undo."
        confirmLabel="Delete credential"
      />
    </div>
  );
}
