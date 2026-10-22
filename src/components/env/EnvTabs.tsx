"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Field, IconButton, Input, Popover, Tabs } from "@/components/ui";
import { envLabel, normalizeEnvName, validateEnvName } from "./utils";

export const ENV_TABS_ID = "env";

/** Environment switcher: underline tabs with count lozenges, plus a "+" that adds a custom environment. */
export function EnvTabs({
  environments,
  value,
  onChange,
  counts,
  onAddEnvironment,
}: {
  environments: string[];
  value: string;
  onChange: (env: string) => void;
  /** Variables per environment (matches while searching). Undefined while loading. */
  counts?: Record<string, number>;
  onAddEnvironment: (name: string) => void;
}) {
  return (
    <div className="flex items-stretch">
      <Tabs
        ariaLabel="Environments"
        idPrefix={ENV_TABS_ID}
        value={value}
        onChange={onChange}
        className="min-w-0 max-w-full"
        tabs={environments.map((e) => ({
          id: e,
          label: envLabel(e),
          count: counts ? (counts[e] ?? 0) : undefined,
        }))}
      />
      <div className="flex flex-1 items-center border-b-2 border-fill-hover pl-1">
        <Popover
          title="Add environment"
          placement="bottom-start"
          trigger={
            <IconButton title="Add environment">
              <Plus size={16} />
            </IconButton>
          }
        >
          {(api) => <AddEnvironment existing={environments} onAdd={(n) => (onAddEnvironment(n), api.close())} />}
        </Popover>
      </div>
    </div>
  );
}

function AddEnvironment({ existing, onAdd }: { existing: string[]; onAdd: (name: string) => void }) {
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const name = normalizeEnvName(raw);
  const error = touched ? validateEnvName(name, existing) : null;
  return (
    <form
      className="space-y-3 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        const err = validateEnvName(name, existing);
        if (err && existing.includes(name)) {
          // Already there: just go to it.
          onAdd(name);
          return;
        }
        if (!err) onAdd(name);
      }}
    >
      <Field
        label="Name"
        error={error}
        helper={name && name !== raw.trim() ? `Will be saved as “${name}”.` : "Lowercase letters, numbers and dashes, for example preview."}
      >
        <Input
          size="sm"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="preview"
          maxLength={32}
          autoComplete="off"
          spellCheck={false}
          data-autofocus
        />
      </Field>
      <Button type="submit" fullWidth disabled={!name}>
        Add environment
      </Button>
    </form>
  );
}
