"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff, ExternalLink, KeyRound, Loader2, MoreHorizontal, Pencil, Terminal, Trash2, User } from "lucide-react";
import { cn, relativeTime } from "@/lib/client";
import type { PasswordItem } from "@/lib/types";
import { IconButton } from "@/components/ui/Button";
import { Lozenge } from "@/components/ui/Lozenge";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/Menu";
import { CategoryTile, categoryMeta } from "./categories";
import { classifyUrl, fullDate } from "./password-utils";
import type { CopyKind, Revealed } from "./useSecrets";

type Props = {
  item: PasswordItem;
  secret?: Revealed;
  revealing: boolean;
  /** `${id}:${kind}` of the value that was just copied, for the check-mark feedback. */
  copied: string | null;
  highlighted: boolean;
  onToggleReveal: (item: PasswordItem) => void;
  onCopy: (item: PasswordItem, what: CopyKind) => void;
  onEdit: (item: PasswordItem) => void;
  onDelete: (item: PasswordItem) => void;
};

/** One credential as a Trello-style tile: icon tile, title, copy-first value rows, link chip, notes. */
export function CredentialCard({ item, secret, revealing, copied, highlighted, onToggleReveal, onCopy, onEdit, onDelete }: Props) {
  const meta = categoryMeta(item.category);
  const link = classifyUrl(item.url);
  const titleId = `cred-${item._id}`;
  const shown = secret !== undefined;
  const isCopied = (k: CopyKind) => copied === `${item._id}:${k}`;

  return (
    <article aria-labelledby={titleId} className={cn("t-card relative flex h-full flex-col p-4", highlighted && "ring-2 ring-focus ring-offset-2")}>
      <div className="flex items-start gap-3">
        <CategoryTile category={item.category} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-body font-semibold text-ink">
            {/* Stretched button: the whole card opens the editor, inner controls sit above it. */}
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.title}`}
              title={item.title}
              className="line-clamp-2 w-full break-words text-left outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-focus focus-visible:after:ring-offset-2"
            >
              {item.title}
            </button>
          </h3>
          <div className="mt-1">
            <Lozenge appearance={meta.lozenge} className={meta.lozengeClass}>
              {item.category}
            </Lozenge>
          </div>
        </div>
        <div className="relative -mr-1.5 -mt-1.5 shrink-0">
          <Menu
            ariaLabel={`Actions for ${item.title}`}
            width="w-48"
            trigger={
              <IconButton title="Credential actions" aria-label={`Actions for ${item.title}`}>
                <MoreHorizontal size={16} />
              </IconButton>
            }
          >
            <MenuItem icon={<Pencil size={16} />} onClick={() => onEdit(item)}>
              Edit
            </MenuItem>
            <MenuDivider />
            <MenuItem danger icon={<Trash2 size={16} />} onClick={() => onDelete(item)}>
              Delete
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {item.username ? (
          <ValueRow
            icon={<User size={14} />}
            label="Username"
            actions={
              <CopyButton copied={isCopied("username")} title="Copy username" label={`Copy username for ${item.title}`} onClick={() => onCopy(item, "username")} />
            }
          >
            <span className="mono block truncate text-body-sm text-ink" title={item.username}>
              {item.username}
            </span>
          </ValueRow>
        ) : null}

        <ValueRow
          icon={<KeyRound size={14} />}
          label="Password"
          revealed={shown}
          actions={
            item.hasPassword ? (
              <>
                <IconButton
                  size="sm"
                  title={shown ? "Hide" : "Reveal"}
                  aria-label={`${shown ? "Hide" : "Reveal"} password for ${item.title}`}
                  aria-busy={revealing || undefined}
                  onClick={() => onToggleReveal(item)}
                >
                  {revealing ? <Loader2 size={14} className="animate-spin" /> : shown ? <EyeOff size={14} /> : <Eye size={14} />}
                </IconButton>
                <CopyButton copied={isCopied("password")} title="Copy password" label={`Copy password for ${item.title}`} onClick={() => onCopy(item, "password")} />
              </>
            ) : null
          }
        >
          {!item.hasPassword ? (
            <span className="block text-body-sm italic text-ink-muted">No password saved</span>
          ) : shown ? (
            <>
              <code data-testid="revealed-secret" className="mono block max-h-32 select-all overflow-y-auto whitespace-pre-wrap break-all py-1 text-body-sm text-ink">
                {secret.value || <i className="not-italic text-ink-soft">(empty)</i>}
              </code>
              <span className="block pb-1 text-micro text-ink-soft">
                <Countdown until={secret.until} />
              </span>
            </>
          ) : (
            <>
              <span aria-hidden className="block text-body tracking-[0.18em] text-ink-soft">
                ••••••••••••
              </span>
              <span className="sr-only">Password hidden</span>
            </>
          )}
        </ValueRow>
      </div>

      {link ? (
        <div className="mt-3 flex">
          {link.kind === "web" ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.href}
              className="relative inline-flex h-6 max-w-full items-center gap-1 rounded-control bg-brand-soft px-1.5 text-body-sm font-medium text-blue-800 hover:bg-brand-soft-hover hover:underline"
            >
              <ExternalLink size={12} aria-hidden className="shrink-0" />
              <span className="truncate">{link.label}</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onCopy(item, "host")}
              title="Copy"
              aria-label={`Copy host ${link.label}`}
              className="relative inline-flex h-6 max-w-full items-center gap-1 rounded-control bg-fill px-1.5 text-body-sm text-ink-soft hover:bg-fill-hover hover:text-ink"
            >
              <Terminal size={12} aria-hidden className="shrink-0" />
              <span className="mono truncate">{link.label}</span>
              {isCopied("host") ? <Check size={12} aria-hidden className="shrink-0 text-success-text" /> : <Copy size={12} aria-hidden className="shrink-0" />}
            </button>
          )}
        </div>
      ) : null}

      {item.notes ? <p className="mt-3 line-clamp-2 whitespace-pre-line break-words text-body-sm text-ink-soft">{item.notes}</p> : null}

      <p className="mt-auto pt-3 text-micro text-ink-muted">
        <time dateTime={item.updatedAt} title={fullDate(item.updatedAt)}>
          Updated {relativeTime(item.updatedAt)}
        </time>
      </p>
    </article>
  );
}

/** A single labelled value in a bordered row with its actions on the right. Sits above the stretched card button. */
function ValueRow({ icon, label, children, actions, revealed }: { icon: React.ReactNode; label: string; children: React.ReactNode; actions?: React.ReactNode; revealed?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex min-h-8 items-center gap-2 rounded-control border pl-2 pr-1",
        revealed ? "border-yellow-300 bg-warning-soft" : "border-line bg-canvas"
      )}
    >
      <span className="shrink-0 text-ink-soft" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">{label}: </span>
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </div>
  );
}

function CopyButton({ copied, title, label, onClick }: { copied: boolean; title: string; label: string; onClick: () => void }) {
  return (
    <IconButton size="sm" title={title} aria-label={label} onClick={onClick}>
      {copied ? <Check size={14} className="text-success-text" /> : <Copy size={14} />}
    </IconButton>
  );
}

/** "Hides in 24s". Ticks on its own so only this node re-renders. Hidden from screen readers to avoid a stream of announcements. */
function Countdown({ until }: { until: number }) {
  const left = () => Math.max(0, Math.ceil((until - Date.now()) / 1000));
  const [secs, setSecs] = useState(left);
  useEffect(() => {
    setSecs(left());
    const t = setInterval(() => setSecs(left()), 1000);
    return () => clearInterval(t);
    // left closes over `until` only
  }, [until]);
  return (
    <>
      <span aria-hidden className="tabular-nums">
        Hides in {secs}s
      </span>
      <span className="sr-only">Password visible. It hides again automatically.</span>
    </>
  );
}
