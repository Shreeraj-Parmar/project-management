"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui";
import { envLabel, normalizeEnvName } from "./utils";

export const NEW_ENV = "__new";

/** State for an "Environment" select that can also create a new environment by typing its name. */
export function useEnvChoice(initial: string) {
  const [choice, setChoice] = useState(initial);
  const [custom, setCustom] = useState("");
  const resolved = choice === NEW_ENV ? normalizeEnvName(custom) : choice;
  return { choice, setChoice, custom, setCustom, resolved, needsName: choice === NEW_ENV && !resolved };
}

export function EnvChoiceFields({
  environments,
  state,
  label = "Environment",
  className,
}: {
  environments: string[];
  state: ReturnType<typeof useEnvChoice>;
  label?: string;
  className?: string;
}) {
  const { choice, setChoice, custom, setCustom, resolved } = state;
  return (
    <div className={className}>
      <Field label={label}>
        <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
          {environments.map((e) => (
            <option key={e} value={e}>
              {envLabel(e)}
            </option>
          ))}
          <option value={NEW_ENV}>New environment…</option>
        </Select>
      </Field>
      {choice === NEW_ENV ? (
        <Field
          label="New environment name"
          className="mt-3"
          helper={custom.trim() && resolved !== custom.trim() ? `Will be saved as “${resolved}”.` : "Lowercase letters, numbers and dashes."}
          error={custom.trim() && !resolved ? "Use letters, numbers or dashes." : undefined}
        >
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="preview" maxLength={32} autoComplete="off" spellCheck={false} />
        </Field>
      ) : null}
    </div>
  );
}
