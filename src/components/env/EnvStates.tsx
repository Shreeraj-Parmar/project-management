"use client";

import { Braces, SearchX, Upload, Plus } from "lucide-react";
import { MODULES } from "@/lib/constants";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { envLabel, plural } from "./utils";

const MOD = MODULES.find((m) => m.id === "env")!;

/** No variables in this environment: two ways to start. */
export function EnvEmpty({ env, onImport, onAdd }: { env: string; onImport: () => void; onAdd: () => void }) {
  return (
    <div className="rounded-card border border-dashed border-border-bold/50 bg-surface/60">
      <EmptyState
        icon={<Braces size={28} />}
        color={MOD.color}
        title={`No variables for ${env}`}
        description="Add your first variable or import an existing .env file."
        action={
          <>
            <Button variant="secondary" icon={<Upload size={16} />} onClick={onImport}>
              Import .env
            </Button>
            <Button icon={<Plus size={16} />} onClick={onAdd}>
              Add variable
            </Button>
          </>
        }
      />
    </div>
  );
}

/** Search found nothing in this environment (and maybe something elsewhere). */
export function EnvNoMatch({
  query,
  env,
  elsewhere,
  onClear,
  onGo,
}: {
  query: string;
  env: string;
  elsewhere: { env: string; count: number }[];
  onClear: () => void;
  onGo: (env: string) => void;
}) {
  return (
    <div className="rounded-card border border-line">
      <EmptyState
        compact
        icon={<SearchX size={24} />}
        color={MOD.color}
        title={`No variables match “${query}”`}
        description={
          elsewhere.length > 0
            ? `Nothing in ${env}, but there are matches in other environments.`
            : "Search looks at keys and notes. Values are never searched."
        }
        action={
          <>
            {elsewhere.map((e) => (
              <Button key={e.env} variant="secondary" onClick={() => onGo(e.env)}>
                {envLabel(e.env)} ({plural(e.count, "match", "matches")})
              </Button>
            ))}
            <Button variant={elsewhere.length > 0 ? "subtle" : "secondary"} onClick={onClear}>
              Clear search
            </Button>
          </>
        }
      />
    </div>
  );
}

/** Table-shaped loading placeholder. */
export function EnvSkeleton() {
  return (
    <div role="status" aria-label="Loading variables" className="overflow-hidden rounded-card border border-line bg-canvas">
      <div className="flex h-9 items-center gap-6 border-b border-line bg-surface px-4">
        <Skeleton width={56} height={10} />
        <Skeleton width={56} height={10} className="hidden sm:block" />
        <Skeleton width={56} height={10} className="hidden md:block" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex h-11 items-center gap-6 border-t border-line px-4 first:border-t-0">
          <Skeleton width={16} height={16} className="shrink-0" />
          <Skeleton width={110 + ((i * 37) % 70)} height={14} className="shrink-0" />
          <Skeleton width={90 + ((i * 53) % 80)} height={14} className="hidden shrink-0 sm:block" />
          <Skeleton width={120 + ((i * 29) % 60)} height={14} className="hidden shrink-0 md:block" />
          <Skeleton width={72} height={24} className="ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
}
