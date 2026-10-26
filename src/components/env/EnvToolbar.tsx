"use client";

import { Copy, Download, Eye, EyeOff, FileCode2, FileDown, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/client";
import { Button, Menu, MenuItem, SearchInput, Tooltip } from "@/components/ui";
import { plural } from "./utils";

/** Search on the left; Reveal all, Raw editor, Import and Export on the right. Replaced by the SelectionBar while rows are selected. */
export function EnvToolbar({
  query,
  onQuery,
  shown,
  total,
  envName,
  revealAllOn,
  revealAllBusy,
  canRevealAll,
  onToggleRevealAll,
  onImport,
  onRawEdit,
  onExportCopy,
  onExportDownload,
  canExport,
  compact,
}: {
  query: string;
  onQuery: (q: string) => void;
  shown: number;
  total: number;
  envName: string;
  revealAllOn: boolean;
  revealAllBusy: boolean;
  canRevealAll: boolean;
  onToggleRevealAll: () => void;
  onImport: () => void;
  onRawEdit: () => void;
  onExportCopy: () => void;
  onExportDownload: () => void;
  canExport: boolean;
  /** Narrow layout: equal text buttons on one row. */
  compact?: boolean;
}) {
  const searching = query.trim() !== "";
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2">
      <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
        <SearchInput
          value={query}
          onValueChange={onQuery}
          placeholder="Search variables"
          aria-label="Search variables by key or note"
          className="sm:max-w-xs"
        />
        {searching ? (
          <span className="hidden whitespace-nowrap text-body-sm text-ink-muted sm:inline" aria-hidden>
            {shown} of {total}
          </span>
        ) : null}
      </div>
      <div className={cn("flex items-center gap-2", compact ? "w-full [&>*]:min-w-0 [&>*]:flex-1" : "flex-wrap")}>
        <Tooltip
          content={revealAllOn ? "Hide every value in this environment" : "Reveal every secret in this environment. Values hide again after 30 seconds."}
        >
          <Button
            variant="secondary"
            fullWidth={compact}
            aria-pressed={revealAllOn}
            disabled={!canRevealAll}
            onClick={onToggleRevealAll}
            icon={compact ? undefined : revealAllBusy ? <Loader2 size={16} className="animate-spin" /> : revealAllOn ? <EyeOff size={16} /> : <Eye size={16} />}
            className={cn(revealAllOn && "bg-brand-soft text-brand-dark hover:bg-brand-soft-hover")}
          >
            {revealAllOn ? "Hide all" : "Reveal all"}
          </Button>
        </Tooltip>
        <Tooltip content="Edit every variable as plain KEY=value text">
          <Button variant="secondary" fullWidth={compact} icon={compact ? undefined : <FileCode2 size={16} />} onClick={onRawEdit}>
            Raw editor
          </Button>
        </Tooltip>
        <Button variant="secondary" fullWidth={compact} icon={compact ? undefined : <Upload size={16} />} onClick={onImport}>
          {compact ? "Import" : "Import .env"}
        </Button>
        <Menu
          width="w-64"
          ariaLabel="Export"
          trigger={
            <Button variant="secondary" fullWidth={compact} icon={compact ? undefined : <Download size={16} />} disabled={!canExport}>
              Export
            </Button>
          }
        >
          <MenuItem icon={<Copy size={16} />} description={`${plural(total === 0 ? 0 : total, "variable")} from ${envName}`} onClick={onExportCopy}>
            Copy as .env
          </MenuItem>
          <MenuItem icon={<FileDown size={16} />} description={`${envName}.env`} onClick={onExportDownload}>
            Download .env
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
