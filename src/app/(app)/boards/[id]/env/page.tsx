"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Braces, Lock, Plus } from "lucide-react";
import { ENVIRONMENTS, MODULES } from "@/lib/constants";
import type { EnvVar } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Button, ConfirmDialog, ErrorBox, PageHeader, TabPanel, Tooltip, useToast } from "@/components/ui";
import { AddVarsModal, type AddVarsPayload } from "@/components/env/AddVarsModal";
import { EnvCards } from "@/components/env/EnvCards";
import { EnvModal, type SavePayload } from "@/components/env/EnvModal";
import { EnvEmpty, EnvNoMatch, EnvSkeleton } from "@/components/env/EnvStates";
import { EnvTable } from "@/components/env/EnvTable";
import { ENV_TABS_ID, EnvTabs } from "@/components/env/EnvTabs";
import { EnvToolbar } from "@/components/env/EnvToolbar";
import { ImportModal } from "@/components/env/ImportModal";
import { InlineAdd } from "@/components/env/InlineAdd";
import { RawEditorModal } from "@/components/env/RawEditorModal";
import { TagFilter } from "@/components/env/EnvTags";
import { SelectionBar } from "@/components/env/SelectionBar";
import { useEnvData, useLayoutMode, useReveal } from "@/components/env/hooks";
import type { DraftVar, EnvController, SortState } from "@/components/env/types";
import { copyText, downloadText, errMessage, isTypingTarget, plural, serializeEnv, sortEnvironments } from "@/components/env/utils";

const MOD = MODULES.find((m) => m.id === "env")!;

function sortRows(rows: EnvVar[], sort: SortState): EnvVar[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  return rows
    .slice()
    .sort((a, b) => (sort.by === "key" ? a.key.localeCompare(b.key) : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir);
}

export default function EnvPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/env`;
  const data = useEnvData(base);
  const reveal = useReveal();
  const [rootRef, mode] = useLayoutMode<HTMLDivElement>();

  const [env, setEnvState] = useState<string>("development");
  const [extraEnvs, setExtraEnvs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ by: "key", dir: "asc" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<EnvVar | null>(null);
  const [addVars, setAddVars] = useState<{ text: string } | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [importing, setImporting] = useState<{ text: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EnvVar[] | null>(null);
  const [overwrite, setOverwrite] = useState<{ rows: EnvVar[]; target: string; conflicts: string[] } | null>(null);
  const [adding, setAdding] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [revealAllBusy, setRevealAllBusy] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { vars } = data;

  /* ---- environments (selected one lives in ?env=) ---- */
  const setEnv = useCallback((next: string) => {
    setEnvState(next);
    setSelected(new Set());
    setAdding(false);
    setTagFilter(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("env", next);
      window.history.replaceState(null, "", url);
    } catch {
      /* the tab still switches without the URL */
    }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("env");
    if (fromUrl) {
      setEnvState(fromUrl);
      setExtraEnvs((x) => (x.includes(fromUrl) ? x : [...x, fromUrl]));
    }
  }, []);

  const environments = useMemo(() => sortEnvironments([...ENVIRONMENTS, ...vars.map((v) => v.environment), ...extraEnvs, env]), [vars, extraEnvs, env]);
  const otherEnvironments = useMemo(() => environments.filter((e) => e !== env), [environments, env]);

  const keysByEnv = useCallback(
    (e: string) => {
      const m = new Map<string, string>();
      vars.forEach((v) => v.environment === e && m.set(v.key, v._id));
      return m;
    },
    [vars],
  );
  const keySetIn = useCallback((e: string): ReadonlySet<string> => new Set(keysByEnv(e).keys()), [keysByEnv]);

  /* ---- rows ---- */
  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (v: EnvVar) => !q || v.key.toLowerCase().includes(q) || v.note.toLowerCase().includes(q) || (v.tags ?? []).some((t) => t.includes(q)),
    [q],
  );
  const envVars = useMemo(() => vars.filter((v) => v.environment === env), [vars, env]);
  const allTags = useMemo(() => [...new Set(vars.flatMap((v) => v.tags ?? []))].sort(), [vars]);
  const envTags = useMemo(() => [...new Set(envVars.flatMap((v) => v.tags ?? []))].sort(), [envVars]);
  const activeTag = tagFilter && envTags.includes(tagFilter) ? tagFilter : null;
  const rows = useMemo(
    () => sortRows(envVars.filter((v) => matches(v) && (!activeTag || (v.tags ?? []).includes(activeTag))), sort),
    [envVars, matches, activeTag, sort],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    vars.forEach((v) => matches(v) && (c[v.environment] = (c[v.environment] ?? 0) + 1));
    return c;
  }, [vars, matches]);
  const elsewhere = useMemo(
    () => environments.filter((e) => e !== env && (counts[e] ?? 0) > 0).map((e) => ({ env: e, count: counts[e] })),
    [environments, env, counts],
  );
  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r._id)), [rows, selected]);

  /* ---- small helpers ---- */
  const flash = useCallback((id: string) => {
    setHighlightId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setHighlightId(null), 2200);
  }, []);
  useEffect(() => () => void (flashTimer.current && clearTimeout(flashTimer.current)), []);

  const copyKey = useCallback(
    async (v: EnvVar) => {
      const ok = await copyText(v.key);
      toast(ok ? `Copied ${v.key}` : "Couldn't copy to the clipboard. Check the browser's clipboard permission.", ok ? "success" : "error");
      return ok;
    },
    [toast],
  );

  const copyValue = useCallback(
    async (v: EnvVar) => {
      try {
        let value = v.secret ? reveal.revealed[v._id] : v.value;
        if (value === undefined) value = await data.fetchValue(v._id);
        const ok = await copyText(value);
        toast(ok ? `Copied ${v.key} value` : "Couldn't copy to the clipboard. Check the browser's clipboard permission.", ok ? "success" : "error");
        return ok;
      } catch (err) {
        toast(errMessage(err, "Couldn't read the value. Try again."), "error");
        return false;
      }
    },
    [data, reveal.revealed, toast],
  );

  const toggleReveal = useCallback(
    async (v: EnvVar) => {
      if (v._id in reveal.revealed) {
        reveal.hide([v._id]);
        return;
      }
      try {
        const value = await reveal.track([v._id], () => data.fetchValue(v._id));
        reveal.put({ [v._id]: value });
      } catch (err) {
        toast(errMessage(err, "Couldn't reveal the value. Try again."), "error");
      }
    },
    [data, reveal, toast],
  );

  const secretRows = useMemo(() => envVars.filter((v) => v.secret && v.hasValue), [envVars]);
  const revealAllOn = secretRows.length > 0 && secretRows.every((v) => v._id in reveal.revealed);

  async function toggleRevealAll() {
    if (revealAllOn) {
      reveal.hide(secretRows.map((v) => v._id));
      return;
    }
    setRevealAllBusy(true);
    try {
      const all = await data.fetchAll();
      const map: Record<string, string> = {};
      all.forEach((v) => v.environment === env && v.secret && v.hasValue && (map[v._id] = v.value));
      reveal.put(map);
    } catch (err) {
      toast(errMessage(err, "Couldn't reveal the values. Try again."), "error", { action: { label: "Retry", onClick: () => void toggleRevealAll() } });
    } finally {
      setRevealAllBusy(false);
    }
  }

  /* ---- create, edit ---- */
  async function saveVar(payload: SavePayload, item: EnvVar | null) {
    const saved = item ? await data.update(item._id, payload) : await data.create({ ...payload, value: payload.value ?? "" });
    if (item && item._id in reveal.revealed) reveal.put({ [item._id]: payload.value ?? reveal.revealed[item._id] });
    setEditing(null);
    refetchProject(true);
    if (saved.environment !== env) setEnv(saved.environment);
    if (query) setQuery("");
    flash(saved._id);
    if (item) toast(`Updated ${saved.key}`, "success");
  }

  async function saveMany(payload: AddVarsPayload) {
    const created = await data.createMany(payload);
    setAddVars(null);
    setExtraEnvs((x) => [...x, ...payload.environments.filter((e) => !x.includes(e))]);
    if (!payload.environments.includes(env)) setEnv(payload.environments[0]);
    if (query) setQuery("");
    refetchProject(true);
    const where = payload.environments.length === 1 ? payload.environments[0] : plural(payload.environments.length, "environment");
    toast(`Saved ${plural(payload.items.length, "variable")} to ${where}${created > payload.items.length ? ` (${created} in total)` : ""}`, "success");
  }

  async function saveRaw(set: { key: string; value: string }[], remove: string[]) {
    await data.saveRaw(env, set, remove);
    setRawOpen(false);
    reveal.hideAll();
    setSelected(new Set());
    refetchProject(true);
    const parts = [set.length ? `${plural(set.length, "variable")} saved` : "", remove.length ? `${remove.length} deleted` : ""].filter(Boolean);
    toast(`${parts.join(", ")} in ${env}`, "success");
  }

  async function addInline(d: DraftVar) {
    const saved = await data.create({ environment: env, key: d.key, value: d.value, note: d.note, secret: d.secret });
    if (query) setQuery("");
    refetchProject(true);
    flash(saved._id);
  }

  /* ---- delete ---- */
  async function confirmDelete() {
    const list = pendingDelete;
    if (!list) return;
    const results = await Promise.allSettled(list.map((r) => data.remove(r._id)));
    const failed = list.filter((_, i) => results[i].status === "rejected");
    const done = list.filter((_, i) => results[i].status === "fulfilled");
    if (done.length > 0) {
      const ids = done.map((r) => r._id);
      reveal.hide(ids);
      setSelected((s) => new Set([...s].filter((id) => !ids.includes(id))));
      refetchProject(true);
      toast(done.length === 1 ? `Deleted ${done[0].key}` : `Deleted ${plural(done.length, "variable")}`, "success");
    }
    if (failed.length > 0) {
      toast(`Couldn't delete ${failed.length === 1 ? failed[0].key : plural(failed.length, "variable")}. Try again.`, "error", {
        action: { label: "Retry", onClick: () => setPendingDelete(failed) },
      });
    }
  }

  /* ---- duplicate to another environment ---- */
  async function runDuplicate(list: EnvVar[], target: string) {
    try {
      const values: Record<string, string> = {};
      if (list.some((r) => r.secret)) {
        if (list.length === 1) values[list[0]._id] = await data.fetchValue(list[0]._id);
        else (await data.fetchAll()).forEach((v) => (values[v._id] = v.value));
      }
      const results = await Promise.allSettled(
        list.map((r) =>
          data.create({ environment: target, key: r.key, value: r.secret ? (values[r._id] ?? "") : r.value, note: r.note, secret: r.secret, tags: r.tags ?? [] }),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      if (ok > 0) {
        refetchProject(true);
        toast(`Duplicated ${list.length === 1 ? list[0].key : plural(ok, "variable")} to ${target}`, "success", {
          action: { label: "View", onClick: () => setEnv(target) },
        });
      }
      if (ok < list.length) toast(`Couldn't duplicate ${plural(list.length - ok, "variable")} to ${target}. Try again.`, "error");
    } catch (err) {
      toast(errMessage(err, "Couldn't duplicate. Try again."), "error");
    }
  }

  function startDuplicate(list: EnvVar[], target: string) {
    const existing = keysByEnv(target);
    const conflicts = list.filter((r) => existing.has(r.key)).map((r) => r.key);
    if (conflicts.length > 0) setOverwrite({ rows: list, target, conflicts });
    else void runDuplicate(list, target);
  }

  /* ---- import, export ---- */
  async function runImport(raw: string, environment: string, count: number) {
    await data.importRaw(raw, environment);
    setImporting(null);
    setExtraEnvs((x) => (x.includes(environment) ? x : [...x, environment]));
    setEnv(environment);
    refetchProject(true);
    toast(`Imported ${plural(count, "variable")} into ${environment}`, "success");
  }

  async function exportEnv(kind: "copy" | "download", list: EnvVar[]) {
    try {
      const ids = new Set(list.map((r) => r._id));
      const text = serializeEnv((await data.fetchAll()).filter((v) => ids.has(v._id)));
      if (kind === "download") {
        downloadText(`${env}.env`, text);
        toast(`Downloaded ${env}.env`, "success");
      } else {
        const ok = await copyText(text);
        toast(
          ok ? `Copied ${plural(list.length, "variable")} as .env` : "Couldn't copy to the clipboard. Check the browser's clipboard permission.",
          ok ? "success" : "error",
        );
      }
    } catch (err) {
      toast(errMessage(err, "Couldn't export the variables. Try again."), "error");
    }
  }

  /* ---- keyboard: N adds a variable ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.defaultPrevented || isTypingTarget(e.target)) return;
      if (document.querySelector('[aria-modal="true"], [role="dialog"], [role="menu"]')) return;
      e.preventDefault();
      setAddVars({ text: "" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ---- controller handed to rows ---- */
  const ctl: EnvController = {
    revealed: reveal.revealed,
    revealing: reveal.revealing,
    selected,
    highlightId,
    otherEnvironments,
    select: (id, on) =>
      setSelected((s) => {
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      }),
    selectAll: (on) => setSelected(on ? new Set(rows.map((r) => r._id)) : new Set()),
    toggleReveal: (v) => void toggleReveal(v),
    copyKey,
    copyValue,
    edit: (v) => setEditing(v),
    remove: (v) => setPendingDelete([v]),
    duplicate: (v, target) => startDuplicate([v], target),
  };

  const loading = data.loading;
  const showAdd = rows.length > 0;
  const showUpdated = mode === "full";
  const addRow = showAdd ? (
    <InlineAdd
      layout={mode === "cards" ? "card" : "row"}
      colSpan={showUpdated ? 6 : 4}
      showUpdated={showUpdated}
      noteColumn={showUpdated}
      open={adding}
      onOpen={() => setAdding(true)}
      onClose={() => setAdding(false)}
      environment={env}
      existingKeys={keySetIn(env)}
      onSubmit={addInline}
      onImportText={(text) => setAddVars({ text })}
    />
  ) : null;

  const delRows = pendingDelete ?? [];
  const delEnv = delRows[0]?.environment ?? env;
  const bulkDelete = delRows.length > 1;

  return (
    <div ref={rootRef}>
      <PageHeader
        title="Environment variables"
        description={
          <span>
            <Lock size={14} aria-hidden className="mr-1.5 inline-block align-[-2px]" />
            Encrypted at rest. Secret values stay masked until you reveal them.
          </span>
        }
        color={MOD.color}
        icon={<Braces size={20} />}
        actions={
          <Tooltip content="Add one or more variables (N)">
            <Button
              variant={!loading && envVars.length === 0 && !data.error ? "secondary" : "primary"}
              icon={<Plus size={16} />}
              onClick={() => setAddVars({ text: "" })}
            >
              Add variables
            </Button>
          </Tooltip>
        }
      />

      {data.error && !data.hasData && !data.loading ? (
        <ErrorBox title="Couldn't load variables" message={data.error} onRetry={() => void data.refetch()} />
      ) : (
        <>
          <EnvTabs
            environments={environments}
            value={env}
            onChange={setEnv}
            counts={loading ? undefined : counts}
            onAddEnvironment={(name) => {
              setExtraEnvs((x) => (x.includes(name) ? x : [...x, name]));
              setEnv(name);
            }}
          />
          <TabPanel idPrefix={ENV_TABS_ID} id={env} value={env}>
            {data.error ? (
              <ErrorBox
                className="mb-4"
                title="Couldn't refresh variables"
                message={`${data.error} Showing the data loaded earlier.`}
                onRetry={() => void data.refetch(true)}
              />
            ) : null}
            {loading ? (
              <EnvSkeleton />
            ) : envVars.length === 0 ? (
              <EnvEmpty env={env} onImport={() => setImporting({ text: "" })} onRawEdit={() => setRawOpen(true)} onAdd={() => setAddVars({ text: "" })} />
            ) : (
              <div className="space-y-3">
                {selectedRows.length > 0 ? (
                  <SelectionBar
                    count={selectedRows.length}
                    of={rows.length}
                    filtered={!!q}
                    otherEnvironments={otherEnvironments}
                    onClear={() => setSelected(new Set())}
                    onCopy={() => void exportEnv("copy", selectedRows)}
                    onDuplicate={(target) => startDuplicate(selectedRows, target)}
                    onDelete={() => setPendingDelete(selectedRows)}
                    onHeight={setBarHeight}
                    compact={mode === "cards"}
                  />
                ) : (
                  <EnvToolbar
                    query={query}
                    onQuery={setQuery}
                    shown={rows.length}
                    total={envVars.length}
                    envName={env}
                    revealAllOn={revealAllOn}
                    revealAllBusy={revealAllBusy}
                    canRevealAll={secretRows.length > 0 && !revealAllBusy}
                    onToggleRevealAll={() => void toggleRevealAll()}
                    onImport={() => setImporting({ text: "" })}
                    onRawEdit={() => setRawOpen(true)}
                    onExportCopy={() => void exportEnv("copy", envVars)}
                    onExportDownload={() => void exportEnv("download", envVars)}
                    canExport={envVars.length > 0}
                    compact={mode === "cards"}
                  />
                )}
                <TagFilter tags={envTags} value={activeTag} onChange={setTagFilter} />
                <p className="sr-only" aria-live="polite">
                  {q ? `${plural(rows.length, "variable")} match` : ""}
                </p>
                {rows.length === 0 ? (
                  activeTag && !q ? (
                    <EnvNoMatch query={`#${activeTag}`} env={env} elsewhere={[]} onClear={() => setTagFilter(null)} onGo={setEnv} />
                  ) : (
                  <EnvNoMatch query={query.trim()} env={env} elsewhere={elsewhere} onClear={() => setQuery("")} onGo={setEnv} />
                  )
                ) : mode === "cards" ? (
                  <EnvCards rows={rows} ctl={ctl} footer={addRow} label={`Variables in ${env}`} />
                ) : (
                  <EnvTable
                    rows={rows}
                    ctl={ctl}
                    mode={mode}
                    sort={sort}
                    caption={`Environment variables in ${env}`}
                    stickyTop={selectedRows.length > 0 && barHeight > 0 ? barHeight + 12 : 0}
                    onSort={(by) => setSort((s) => (s.by === by ? { by, dir: s.dir === "asc" ? "desc" : "asc" } : { by, dir: by === "key" ? "asc" : "desc" }))}
                    footer={addRow}
                  />
                )}
              </div>
            )}
          </TabPanel>
        </>
      )}

      {editing ? (
        <EnvModal
          item={editing}
          environments={environments}
          defaultEnv={editing.environment}
          keysByEnv={keysByEnv}
          loadValue={data.fetchValue}
          onSave={saveVar}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {addVars ? (
        <AddVarsModal
          environments={environments}
          defaultEnv={env}
          initialText={addVars.text}
          keysIn={keySetIn}
          knownTags={allTags}
          onSave={saveMany}
          onClose={() => setAddVars(null)}
        />
      ) : null}

      {rawOpen ? <RawEditorModal environment={env} loadAll={data.fetchAll} onSave={saveRaw} onClose={() => setRawOpen(false)} /> : null}

      {importing ? (
        <ImportModal
          environments={environments}
          defaultEnv={env}
          initialText={importing.text}
          keysIn={keySetIn}
          onImport={runImport}
          onClose={() => setImporting(null)}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={bulkDelete ? `Delete ${plural(delRows.length, "variable")}?` : `Delete ${delRows[0]?.key ?? "variable"}?`}
        confirmLabel={bulkDelete ? `Delete ${delRows.length} variables` : "Delete variable"}
        confirmText={delRows.length >= 10 ? delEnv : undefined}
        message={
          bulkDelete ? (
            <>
              <p>
                This permanently removes these variables from <strong className="text-ink">{delEnv}</strong>. There is no undo.
              </p>
              <ul className="mt-2 max-h-28 list-disc overflow-auto pl-5 font-mono text-body-sm text-ink">
                {delRows.slice(0, 6).map((r) => (
                  <li key={r._id} className="truncate">
                    {r.key}
                  </li>
                ))}
                {delRows.length > 6 ? <li className="list-none font-sans text-ink-soft">and {delRows.length - 6} more</li> : null}
              </ul>
            </>
          ) : (
            <p>
              This permanently removes <strong className="font-mono text-ink">{delRows[0]?.key}</strong> from <strong className="text-ink">{delEnv}</strong>
              {delEnv === "production" ? ", your live environment" : ""}. There is no undo.
            </p>
          )
        }
      />

      <ConfirmDialog
        open={!!overwrite}
        onClose={() => setOverwrite(null)}
        onConfirm={() => overwrite && runDuplicate(overwrite.rows, overwrite.target)}
        title={
          overwrite
            ? `Overwrite ${overwrite.conflicts.length === 1 ? overwrite.conflicts[0] : plural(overwrite.conflicts.length, "variable")} in ${overwrite.target}?`
            : "Overwrite?"
        }
        confirmLabel="Overwrite"
        message={
          overwrite ? (
            <>
              <p>
                {overwrite.conflicts.length === 1 ? "This key already exists" : "These keys already exist"} in{" "}
                <strong className="text-ink">{overwrite.target}</strong>. {overwrite.conflicts.length === 1 ? "Its current value" : "Their current values"} will
                be replaced. There is no undo.
              </p>
              {overwrite.conflicts.length > 1 ? (
                <ul className="mt-2 max-h-28 list-disc overflow-auto pl-5 font-mono text-body-sm text-ink">
                  {overwrite.conflicts.slice(0, 6).map((k) => (
                    <li key={k} className="truncate">
                      {k}
                    </li>
                  ))}
                  {overwrite.conflicts.length > 6 ? <li className="list-none font-sans text-ink-soft">and {overwrite.conflicts.length - 6} more</li> : null}
                </ul>
              ) : null}
            </>
          ) : null
        }
      />
    </div>
  );
}
